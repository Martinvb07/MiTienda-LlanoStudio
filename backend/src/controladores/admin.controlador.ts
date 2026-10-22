import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { cifrarContrasena, verificarContrasena } from '../utilidades/contrasenas.js'
import { listarOfertas } from '../servicios/ofertas.servicio.js'
import { noAutorizado, noEncontrado } from '../utilidades/errores.js'

/**
 * Panel de la plataforma: lo usa Llano Studio para ver todas las tiendas,
 * cambiarles el plan o suspenderlas. Es un acceso aparte del de los dueños de
 * tienda: sus credenciales viven sólo en el .env del servidor y su token no
 * sirve en el panel de tiendas (ni al revés).
 */

export const esquemaIngresoAdmin = z.object({
  email: z.string().trim().toLowerCase().max(160),
  contrasena: z.string().min(1).max(200),
})

export const esquemaCambioTienda = z
  .object({
    plan: z.enum(['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO']).optional(),
    activo: z.boolean().optional(),
  })
  .refine((datos) => datos.plan !== undefined || datos.activo !== undefined, 'No hay nada que cambiar')

export const esquemaBusqueda = z.object({ buscar: z.string().trim().max(80).optional() })

export const esquemaContrasena = z.object({
  contrasena: z.string().min(8, 'Tiene que tener al menos 8 caracteres').max(200),
})

export const esquemaOferta = z.object({
  precio: z.coerce.number().int().min(0).max(100_000_000),
  precioAnual: z.coerce.number().int().min(0).max(1_000_000_000),
  resumen: z.string().trim().min(1).max(200),
  incluye: z.array(z.string().trim().min(1).max(120)).max(12),
  destacado: z.boolean(),
})

const PLAN_VALIDO = z.enum(['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO'])

/**
 * Token de admin si el correo y la contraseña son los del .env; si no, null.
 * Lo usa también el ingreso normal del panel: el admin entra por el mismo login.
 */
export async function tokenSiEsAdmin(email: string, contrasena: string): Promise<string | null> {
  const configurado = Boolean(entorno.ADMIN_CORREO && entorno.ADMIN_CONTRASENA_HASH)
  const valido =
    configurado &&
    email.toLowerCase() === entorno.ADMIN_CORREO.toLowerCase() &&
    (await verificarContrasena(contrasena, entorno.ADMIN_CONTRASENA_HASH))
  return valido ? jwt.sign({ admin: true, email }, entorno.JWT_SECRETO, { expiresIn: '12h' }) : null
}

export async function ingresarAdmin(req: Request, res: Response): Promise<void> {
  const { email, contrasena } = req.body as z.infer<typeof esquemaIngresoAdmin>
  const token = await tokenSiEsAdmin(email, contrasena)
  if (!token) throw noAutorizado('Credenciales de administrador incorrectas')
  res.json({ token })
}

export function exigirAdmin(req: Request, _res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization
  const token = cabecera?.startsWith('Bearer ') ? cabecera.slice(7).trim() : ''
  try {
    const carga = jwt.verify(token, entorno.JWT_SECRETO) as { admin?: boolean }
    if (carga.admin !== true) throw new Error('No es admin')
    next()
  } catch {
    next(noAutorizado('Sesión de administrador inválida o vencida'))
  }
}

/** Cifras de toda la plataforma. */
export async function resumenAdmin(_req: Request, res: Response): Promise<void> {
  const haceUnaSemana = new Date(Date.now() - 7 * 24 * 3600 * 1000)

  const [tiendas, publicadas, suspendidas, productos, nuevas, porPlan] = await Promise.all([
    prisma.tenant.count(),
    prisma.tienda.count({ where: { publicada: true, tenant: { activo: true } } }),
    prisma.tenant.count({ where: { activo: false } }),
    prisma.producto.count(),
    prisma.tenant.count({ where: { creadoEn: { gte: haceUnaSemana } } }),
    prisma.tenant.groupBy({ by: ['plan'], _count: { _all: true } }),
  ])

  res.json({
    tiendas,
    publicadas,
    suspendidas,
    productos,
    nuevasEstaSemana: nuevas,
    porPlan: Object.fromEntries(porPlan.map((grupo) => [grupo.plan, grupo._count._all])),
  })
}

/** Todas las tiendas, de la más nueva a la más antigua, con búsqueda por nombre, dirección o correo. */
export async function listarTiendasAdmin(req: Request, res: Response): Promise<void> {
  const { buscar } = req.query as z.infer<typeof esquemaBusqueda>

  const tenants = await prisma.tenant.findMany({
    where: buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: 'insensitive' } },
            { subdominio: { contains: buscar, mode: 'insensitive' } },
            { usuarios: { some: { email: { contains: buscar, mode: 'insensitive' } } } },
          ],
        }
      : undefined,
    orderBy: { creadoEn: 'desc' },
    take: 200,
    select: {
      id: true,
      nombre: true,
      subdominio: true,
      plan: true,
      planVenceEn: true,
      activo: true,
      creadoEn: true,
      usuarios: {
        where: { rol: 'PROPIETARIO' },
        take: 1,
        select: { nombre: true, email: true, ultimoAccesoEn: true },
      },
      tienda: { select: { publicada: true, logoUrl: true, _count: { select: { productos: true } } } },
    },
  })

  res.json({
    tiendas: tenants.map(({ usuarios, tienda, ...tenant }) => ({
      ...tenant,
      propietario: usuarios[0] ?? null,
      publicada: tienda?.publicada ?? false,
      logoUrl: tienda?.logoUrl ?? null,
      productos: tienda?._count.productos ?? 0,
    })),
  })
}

/** Cambia el plan o suspende/reactiva una tienda. Suspendida, ni se sirve ni deja ingresar. */
export async function cambiarTiendaAdmin(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaCambioTienda>
  const id = req.params.id as string

  const existe = await prisma.tenant.findUnique({ where: { id }, select: { id: true } })
  if (!existe) throw noEncontrado('Esa tienda no existe')

  // Un plan puesto a mano no vence: es una cortesía, no un pago.
  const tenant = await prisma.tenant.update({
    where: { id },
    data: datos.plan ? { ...datos, planVenceEn: null } : datos,
    select: { id: true, plan: true, activo: true, planVenceEn: true },
  })
  res.json({ tenant })
}

/**
 * Pone una contraseña nueva al dueño de una tienda. Mientras no exista la
 * recuperación por correo, es la forma de devolverle el acceso a alguien.
 */
export async function cambiarContrasenaAdmin(req: Request, res: Response): Promise<void> {
  const { contrasena } = req.body as z.infer<typeof esquemaContrasena>
  const propietario = await prisma.usuario.findFirst({
    where: { tenantId: req.params.id as string, rol: 'PROPIETARIO' },
    select: { id: true, email: true },
  })
  if (!propietario) throw noEncontrado('Esa tienda no tiene dueño registrado')

  await prisma.usuario.update({
    where: { id: propietario.id },
    data: { contrasenaHash: await cifrarContrasena(contrasena) },
  })
  res.json({ email: propietario.email })
}

export async function listarOfertasAdmin(_req: Request, res: Response): Promise<void> {
  res.json({ planes: await listarOfertas() })
}

export async function guardarOfertaAdmin(req: Request, res: Response): Promise<void> {
  const plan = PLAN_VALIDO.safeParse(req.params.plan)
  if (!plan.success) throw noEncontrado('Ese plan no existe')
  const datos = req.body as z.infer<typeof esquemaOferta>

  // Sólo un plan puede ir destacado como "el más elegido".
  if (datos.destacado) {
    await prisma.ofertaPlan.updateMany({ where: { plan: { not: plan.data } }, data: { destacado: false } })
    const actuales = await listarOfertas()
    for (const oferta of actuales.filter((otra) => otra.plan !== plan.data && otra.destacado)) {
      await prisma.ofertaPlan.upsert({
        where: { plan: oferta.plan },
        create: { ...oferta, destacado: false },
        update: { destacado: false },
      })
    }
  }

  await prisma.ofertaPlan.upsert({
    where: { plan: plan.data },
    create: { plan: plan.data, ...datos },
    update: datos,
  })
  res.json({ planes: await listarOfertas() })
}
