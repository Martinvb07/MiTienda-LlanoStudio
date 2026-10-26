import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { Prisma } from '../generado/prisma/client.js'
import { ErrorHttp, noEncontrado } from '../utilidades/errores.js'
import { enviarCorreoDirecto, plantillaCorreo } from '../servicios/correos.servicio.js'
import { urlPanel } from '../servicios/suscripciones.servicio.js'
import { registro } from '../utilidades/registro.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaResena = z.object({
  productoId: z.string().min(1).max(40),
  nombre: z.string().trim().min(2, 'Escribe tu nombre').max(60),
  email: z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160),
  ciudad: z.string().trim().max(60).optional(),
  estrellas: z.coerce.number().int().min(1, 'Elige de 1 a 5 estrellas').max(5),
  texto: z.string().trim().min(10, 'Cuéntanos un poco más').max(1500),
  /** Trampa para robots: un campo oculto que una persona deja vacío. */
  sitioWeb: z.string().max(200).optional(),
})

export const esquemaModerarResena = z.object({
  estado: z.enum(['PENDIENTE', 'APROBADA', 'RECHAZADA']).optional(),
  respuesta: z.string().trim().max(1000).nullable().optional(),
})

const camposPublicos = { id: true, nombre: true, ciudad: true, estrellas: true, texto: true, verificada: true, respuesta: true, creadoEn: true } as const

/** Promedio con un decimal y cuántas hay, por producto, de las aprobadas. */
export async function resumenResenas(tiendaId: string, productoIds?: string[]) {
  const grupos = await prisma.resena.groupBy({
    by: ['productoId'],
    where: { tiendaId, estado: 'APROBADA', ...(productoIds ? { productoId: { in: productoIds } } : {}) },
    _avg: { estrellas: true },
    _count: { _all: true },
  })
  return new Map(grupos.map((grupo) => [grupo.productoId, { promedio: Math.round((grupo._avg.estrellas ?? 0) * 10) / 10, total: grupo._count._all }]))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tienda pública
// ─────────────────────────────────────────────────────────────────────────────

/** Las reseñas aprobadas de un producto, con el resumen. */
export async function listarResenasPublicas(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const productoId = String(req.query.producto ?? '')
  if (!productoId) throw noEncontrado('Falta el producto')
  const [resenas, resumen] = await Promise.all([
    prisma.resena.findMany({
      where: { tiendaId, productoId, estado: 'APROBADA' },
      orderBy: { creadoEn: 'desc' },
      take: 100,
      select: camposPublicos,
    }),
    resumenResenas(tiendaId, [productoId]),
  ])
  res.json({ resenas, resumen: resumen.get(productoId) ?? { promedio: 0, total: 0 } })
}

export async function crearResenaPublica(req: Request, res: Response): Promise<void> {
  const { tiendaId, tenantId } = req.tenant!
  const datos = req.body as z.infer<typeof esquemaResena>
  if (datos.sitioWeb) {
    res.status(201).json({ ok: true })
    return
  }

  const producto = await prisma.producto.findFirst({ where: { id: datos.productoId, tiendaId, activo: true }, select: { id: true, nombre: true } })
  if (!producto) throw noEncontrado('Ese producto ya no está disponible')

  // Compra verificada: ese correo tiene un pedido (no cancelado) con el producto.
  const compro = await prisma.pedido.count({
    where: {
      tiendaId,
      clienteEmail: datos.email,
      estado: { notIn: ['CANCELADO', 'REEMBOLSADO'] },
      items: { some: { productoId: producto.id } },
    },
  })

  try {
    await prisma.resena.create({
      data: {
        tiendaId,
        productoId: producto.id,
        nombre: datos.nombre,
        email: datos.email,
        ciudad: datos.ciudad || null,
        estrellas: datos.estrellas,
        texto: datos.texto,
        verificada: compro > 0,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ErrorHttp(409, 'Ya dejaste tu opinión sobre este producto. ¡Gracias!', 'RESENA_REPETIDA')
    }
    throw error
  }

  avisarResena(tenantId, producto.nombre, datos).catch((error: unknown) => registro.error({ err: error }, 'No se pudo avisar la reseña nueva'))
  res.status(201).json({ ok: true })
}

async function avisarResena(tenantId: string, producto: string, datos: z.infer<typeof esquemaResena>) {
  const duenas = await prisma.usuario.findMany({
    where: { tenantId, activo: true, rol: { in: ['PROPIETARIO', 'ADMINISTRADOR'] } },
    select: { email: true },
  })
  const html = plantillaCorreo(
    `${'★'.repeat(datos.estrellas)}${'☆'.repeat(5 - datos.estrellas)} sobre ${producto}`,
    [`${datos.nombre} escribió: “${datos.texto.slice(0, 500)}”`, 'Sale en tu tienda cuando la apruebes.'],
    { texto: 'Revisar opiniones', url: `${urlPanel()}/panel/resenas` },
  )
  for (const { email } of duenas) await enviarCorreoDirecto(email, `Opinión nueva sobre ${producto}`, html)
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────

async function tiendaDeLaSesion(req: Request) {
  const tienda = await prisma.tienda.findUnique({ where: { tenantId: req.sesion!.tenantId }, select: { id: true } })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene tienda')
  return tienda.id
}

const camposPanel = {
  ...camposPublicos,
  email: true,
  estado: true,
  producto: { select: { id: true, nombre: true, slug: true, fotos: true } },
} as const

export async function listarResenasPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const resenas = await prisma.resena.findMany({
    where: { tiendaId },
    orderBy: { creadoEn: 'desc' },
    take: 500,
    select: camposPanel,
  })
  res.json({
    resenas: resenas.map(({ producto, ...resena }) => ({ ...resena, producto: { ...producto, foto: producto.fotos[0] ?? null, fotos: undefined } })),
  })
}

export async function moderarResena(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaModerarResena>
  const { count } = await prisma.resena.updateMany({
    where: { id: String(req.params.id), tiendaId },
    data: {
      ...(datos.estado ? { estado: datos.estado } : {}),
      ...(datos.respuesta !== undefined ? { respuesta: datos.respuesta || null } : {}),
    },
  })
  if (count === 0) throw noEncontrado('Esa reseña no existe')
  const resena = await prisma.resena.findUnique({ where: { id: String(req.params.id) }, select: camposPanel })
  res.json({ resena: resena && { ...resena, producto: { ...resena.producto, foto: resena.producto.fotos[0] ?? null, fotos: undefined } } })
}

export async function eliminarResena(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const { count } = await prisma.resena.deleteMany({ where: { id: String(req.params.id), tiendaId } })
  if (count === 0) throw noEncontrado('Esa reseña no existe')
  res.status(204).end()
}
