import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { verificarContrasena } from '../utilidades/contrasenas.js'
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

export async function ingresarAdmin(req: Request, res: Response): Promise<void> {
  const { email, contrasena } = req.body as z.infer<typeof esquemaIngresoAdmin>

  const configurado = Boolean(entorno.ADMIN_CORREO && entorno.ADMIN_CONTRASENA_HASH)
  const valido =
    configurado &&
    email === entorno.ADMIN_CORREO.toLowerCase() &&
    (await verificarContrasena(contrasena, entorno.ADMIN_CONTRASENA_HASH))

  if (!valido) throw noAutorizado('Credenciales de administrador incorrectas')

  res.json({ token: jwt.sign({ admin: true, email }, entorno.JWT_SECRETO, { expiresIn: '12h' }) })
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

  const tenant = await prisma.tenant.update({
    where: { id },
    data: datos,
    select: { id: true, plan: true, activo: true },
  })
  res.json({ tenant })
}
