import { randomBytes } from 'node:crypto'
import type { Server as ServidorHttp } from 'node:http'
import { Server, type Socket } from 'socket.io'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { leerSesionPanel } from '../middlewares/autenticacion.js'
import { registro } from '../utilidades/registro.js'
import { leerSesionAdmin, type SesionAdmin } from './admins.servicio.js'

/**
 * Chat de soporte en vivo (socket.io). Tres tipos de conexión:
 *  · cliente: quien escribió desde la web o desde su panel, con el token de su ticket;
 *  · asesor: admins de la plataforma, que ven todos los tickets.
 * Salas: `ticket:<id>` para cada conversación y `asesores` para la bandeja.
 *
 * Va bajo /api/tiempo-real para pasar por el mismo proxy de nginx que la API.
 */

export const RUTA_TIEMPO_REAL = '/api/tiempo-real'

let io: Server | null = null

export const nuevoTokenVisitante = () => randomBytes(24).toString('hex')

const CAMPOS_TICKET = {
  id: true,
  numero: true,
  origen: true,
  nombre: true,
  email: true,
  asunto: true,
  estado: true,
  asignadoA: true,
  calificacion: true,
  noLeidosAsesor: true,
  ultimoMensajeEn: true,
  creadoEn: true,
  tenant: { select: { id: true, nombre: true, subdominio: true, plan: true } },
  mensajes: { orderBy: { creadoEn: 'desc' as const }, take: 1, select: { texto: true, autor: true } },
} as const

export async function ticketParaBandeja(id: string) {
  const ticket = await prisma.ticketSoporte.findUnique({ where: { id }, select: CAMPOS_TICKET })
  if (!ticket) return null
  const { mensajes, ...resto } = ticket
  return { ...resto, ultimoMensaje: mensajes[0] ?? null }
}

/** Cuántos asesores tienen la bandeja abierta ahora mismo. */
async function asesoresEnLinea() {
  if (!io) return 0
  return (await io.in('asesores').fetchSockets()).length
}

async function avisarPresencia() {
  if (!io) return
  io.emit('asesores', { enLinea: (await asesoresEnLinea()) > 0 })
}

/**
 * Guarda un mensaje y lo reparte: a la conversación y a la bandeja de asesores.
 * Desde un cliente reabre el ticket si estaba resuelto.
 */
export async function publicarMensaje(
  ticketId: string,
  autor: 'CLIENTE' | 'ASESOR' | 'SISTEMA',
  nombreAutor: string,
  texto: string,
) {
  const limpio = texto.trim().slice(0, 4000)
  if (!limpio) return null
  const ahora = new Date()
  const [mensaje] = await prisma.$transaction([
    prisma.mensajeSoporte.create({ data: { ticketId, autor, nombreAutor, texto: limpio } }),
    prisma.ticketSoporte.update({
      where: { id: ticketId },
      data: {
        ultimoMensajeEn: ahora,
        ...(autor === 'CLIENTE'
          ? { noLeidosAsesor: { increment: 1 }, estado: undefined }
          : autor === 'ASESOR'
            ? { noLeidosCliente: { increment: 1 }, noLeidosAsesor: 0 }
            : {}),
      },
    }),
  ])
  if (autor === 'CLIENTE') {
    // Si el cliente escribe en un ticket resuelto, vuelve a la bandeja.
    await prisma.ticketSoporte.updateMany({ where: { id: ticketId, estado: 'RESUELTO' }, data: { estado: 'ABIERTO', cerradoEn: null } })
  }
  io?.to(`ticket:${ticketId}`).emit('mensaje', mensaje)
  const ticket = await ticketParaBandeja(ticketId)
  io?.to('asesores').emit('ticket', ticket)
  return mensaje
}

/** Avisa a la conversación y a la bandeja que el ticket cambió (estado, asesor…). */
export async function anunciarTicket(ticketId: string) {
  const ticket = await ticketParaBandeja(ticketId)
  io?.to('asesores').emit('ticket', ticket)
  io?.to(`ticket:${ticketId}`).emit('estado', { estado: ticket?.estado, asignadoA: ticket?.asignadoA })
}

interface DatosConexion {
  tipo: 'cliente' | 'asesor'
  ticketId?: string
  nombre: string
  asesor?: SesionAdmin
}

async function autenticar(socket: Socket): Promise<DatosConexion | null> {
  const auth = socket.handshake.auth as { tipo?: string; token?: string; panel?: string }
  if (auth.tipo === 'asesor') {
    const asesor = leerSesionAdmin(auth.token)
    return asesor ? { tipo: 'asesor', nombre: asesor.nombre, asesor } : null
  }
  if (!auth.token) return null
  const ticket = await prisma.ticketSoporte.findUnique({
    where: { tokenVisitante: auth.token },
    select: { id: true, nombre: true, tenantId: true },
  })
  if (!ticket) return null
  // Un ticket del panel sólo se abre con la sesión de esa misma tienda.
  if (ticket.tenantId) {
    const sesion = leerSesionPanel(auth.panel)
    if (sesion?.tenantId !== ticket.tenantId) return null
  }
  return { tipo: 'cliente', ticketId: ticket.id, nombre: ticket.nombre }
}

export function iniciarTiempoReal(servidor: ServidorHttp) {
  io = new Server(servidor, {
    path: RUTA_TIEMPO_REAL,
    // Sin "/" final: Next la quita con una redirección y el handshake se perdería.
    addTrailingSlash: false,
    cors: { origin: entorno.origenesPermitidos, credentials: true },
    // Mientras nginx no pase el Upgrade, el polling largo sigue funcionando.
    transports: ['websocket', 'polling'],
  })

  io.use((socket, next) => {
    autenticar(socket)
      .then((datos) => {
        if (!datos) return next(new Error('NO_AUTORIZADO'))
        socket.data = datos
        next()
      })
      .catch(() => next(new Error('NO_AUTORIZADO')))
  })

  io.on('connection', (socket) => {
    const datos = socket.data as DatosConexion

    if (datos.tipo === 'cliente') {
      void socket.join(`ticket:${datos.ticketId}`)
      void asesoresEnLinea().then((cuantos) => socket.emit('asesores', { enLinea: cuantos > 0 }))

      socket.on('mensaje', (texto: unknown) => {
        if (typeof texto !== 'string') return
        publicarMensaje(datos.ticketId!, 'CLIENTE', datos.nombre, texto).catch((error: unknown) =>
          registro.warn({ err: error }, 'No se pudo guardar el mensaje de soporte'),
        )
      })
      socket.on('escribiendo', () => {
        io?.to('asesores').emit('escribiendo', { ticketId: datos.ticketId, quien: 'cliente' })
      })
      socket.on('leido', () => {
        void prisma.ticketSoporte.update({ where: { id: datos.ticketId }, data: { noLeidosCliente: 0 } }).catch(() => undefined)
      })
      return
    }

    // Asesor
    void socket.join('asesores')
    void avisarPresencia()
    socket.on('disconnect', () => void avisarPresencia())

    socket.on('unirse', (ticketId: unknown) => {
      if (typeof ticketId !== 'string') return
      for (const sala of socket.rooms) if (sala.startsWith('ticket:')) void socket.leave(sala)
      void socket.join(`ticket:${ticketId}`)
    })
    socket.on('mensaje', (carga: { ticketId?: unknown; texto?: unknown }) => {
      if (datos.asesor?.rol === 'LECTURA') return
      if (typeof carga?.ticketId !== 'string' || typeof carga.texto !== 'string') return
      const ticketId = carga.ticketId
      void (async () => {
        // Responder un ticket sin asesor lo asigna y lo pone en curso.
        await prisma.ticketSoporte.updateMany({
          where: { id: ticketId, asignadoA: null },
          data: { asignadoA: datos.asesor!.email },
        })
        await prisma.ticketSoporte.updateMany({ where: { id: ticketId, estado: 'ABIERTO' }, data: { estado: 'EN_CURSO' } })
        await publicarMensaje(ticketId, 'ASESOR', datos.nombre, carga.texto as string)
        await anunciarTicket(ticketId)
      })().catch((error: unknown) => registro.warn({ err: error }, 'No se pudo enviar la respuesta de soporte'))
    })
    socket.on('escribiendo', (ticketId: unknown) => {
      if (typeof ticketId === 'string') socket.to(`ticket:${ticketId}`).emit('escribiendo', { quien: 'asesor', nombre: datos.nombre })
    })
  })

  registro.info({ ruta: RUTA_TIEMPO_REAL }, 'Chat de soporte en tiempo real listo')
  return io
}

export async function cerrarTiempoReal() {
  await io?.close()
}
