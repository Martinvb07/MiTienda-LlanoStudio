import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { ErrorHttp, noEncontrado } from '../utilidades/errores.js'
import { enviarCorreoDirecto, plantillaCorreo } from '../servicios/correos.servicio.js'
import { urlPanel } from '../servicios/suscripciones.servicio.js'
import { registro } from '../utilidades/registro.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaMensaje = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre').max(80),
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160)]).optional(),
    telefono: z.string().trim().max(20).optional(),
    motivo: z.string().trim().max(60).optional(),
    mensaje: z.string().trim().min(5, 'Cuéntanos un poco más').max(3000),
    pagina: z.string().trim().max(80).optional(),
    /** Trampa para robots: un campo oculto que una persona deja vacío. */
    sitioWeb: z.string().max(200).optional(),
  })
  .refine((datos) => Boolean(datos.email || datos.telefono), {
    message: 'Déjanos un correo o un celular para responderte',
    path: ['email'],
  })

export const esquemaActualizarMensaje = z.object({
  leido: z.boolean().optional(),
  archivado: z.boolean().optional(),
})

const camposMensaje = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  motivo: true,
  mensaje: true,
  pagina: true,
  leido: true,
  archivado: true,
  creadoEn: true,
} as const

/** Un sitio no recibe más de esto por hora: frena el spam sin molestar a nadie de verdad. */
const MAXIMO_POR_HORA = 40

// ─────────────────────────────────────────────────────────────────────────────
// Sitio público
// ─────────────────────────────────────────────────────────────────────────────

export async function recibirMensaje(req: Request, res: Response): Promise<void> {
  const { tiendaId, tenantId } = req.tenant!
  const datos = req.body as z.infer<typeof esquemaMensaje>

  // El robot llenó el campo oculto: se le responde como si nada, sin guardar.
  if (datos.sitioWeb) {
    res.status(201).json({ ok: true })
    return
  }

  const tienda = await prisma.tienda.findUnique({ where: { id: tiendaId }, select: { publicada: true, nombre: true } })
  if (!tienda?.publicada) throw noEncontrado('Este sitio no está publicado')

  const haceUnaHora = new Date(Date.now() - 3_600_000)
  const [enLaHora, repetidos] = await Promise.all([
    prisma.mensajeContacto.count({ where: { tiendaId, creadoEn: { gte: haceUnaHora } } }),
    prisma.mensajeContacto.count({
      where: {
        tiendaId,
        creadoEn: { gte: new Date(Date.now() - 10 * 60_000) },
        OR: [...(datos.email ? [{ email: datos.email }] : []), ...(datos.telefono ? [{ telefono: datos.telefono }] : [])],
      },
    }),
  ])
  if (enLaHora >= MAXIMO_POR_HORA || repetidos >= 3) {
    throw new ErrorHttp(429, 'Recibimos varios mensajes seguidos. Intenta de nuevo en unos minutos.', 'DEMASIADOS')
  }

  const mensaje = await prisma.mensajeContacto.create({
    data: {
      tiendaId,
      nombre: datos.nombre,
      email: datos.email || null,
      telefono: datos.telefono || null,
      motivo: datos.motivo || null,
      mensaje: datos.mensaje,
      pagina: datos.pagina || null,
    },
    select: camposMensaje,
  })

  avisarMensaje(tenantId, tienda.nombre, mensaje).catch((error: unknown) => registro.error({ err: error }, 'No se pudo avisar el mensaje nuevo'))
  res.status(201).json({ ok: true })
}

async function avisarMensaje(tenantId: string, negocio: string, mensaje: { nombre: string; email: string | null; telefono: string | null; motivo: string | null; mensaje: string }) {
  const duenas = await prisma.usuario.findMany({
    where: { tenantId, activo: true, rol: { in: ['PROPIETARIO', 'ADMINISTRADOR'] } },
    select: { email: true },
  })
  const html = plantillaCorreo(
    `${mensaje.nombre} te escribió`,
    [
      mensaje.mensaje.length > 600 ? `${mensaje.mensaje.slice(0, 600)}…` : mensaje.mensaje,
      [mensaje.motivo, mensaje.email, mensaje.telefono].filter(Boolean).join(' · '),
    ],
    { texto: 'Ver mensajes', url: `${urlPanel()}/panel/mensajes` },
  )
  for (const { email } of duenas) {
    await enviarCorreoDirecto(email, `Mensaje nuevo en ${negocio}${mensaje.motivo ? `: ${mensaje.motivo}` : ''}`, html)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────

async function tiendaDeLaSesion(req: Request) {
  const tienda = await prisma.tienda.findUnique({ where: { tenantId: req.sesion!.tenantId }, select: { id: true } })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene sitio')
  return tienda.id
}

export async function listarMensajes(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const mensajes = await prisma.mensajeContacto.findMany({
    where: { tiendaId },
    orderBy: { creadoEn: 'desc' },
    take: 500,
    select: camposMensaje,
  })
  res.json({ mensajes })
}

export async function actualizarMensaje(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaActualizarMensaje>
  const { count } = await prisma.mensajeContacto.updateMany({ where: { id: String(req.params.id), tiendaId }, data: datos })
  if (count === 0) throw noEncontrado('Ese mensaje no existe')
  const mensaje = await prisma.mensajeContacto.findUnique({ where: { id: String(req.params.id) }, select: camposMensaje })
  res.json({ mensaje })
}

export async function eliminarMensaje(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const { count } = await prisma.mensajeContacto.deleteMany({ where: { id: String(req.params.id), tiendaId } })
  if (count === 0) throw noEncontrado('Ese mensaje no existe')
  res.status(204).end()
}

/** Marca todos como leídos de una vez. */
export async function leerTodos(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  await prisma.mensajeContacto.updateMany({ where: { tiendaId, leido: false }, data: { leido: true } })
  res.status(204).end()
}
