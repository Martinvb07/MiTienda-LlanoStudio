import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { noEncontrado } from '../../utilidades/errores.js'
import { registrarActividad } from '../../servicios/admins.servicio.js'
import { anunciarTicket, publicarMensaje, ticketParaBandeja } from '../../servicios/soporte.servicio.js'

export const esquemaFiltroTickets = z.object({
  estado: z.enum(['ABIERTO', 'EN_CURSO', 'RESUELTO']).optional(),
  buscar: z.string().trim().max(80).optional(),
})

/** Bandeja de tickets: los que esperan respuesta primero. */
export async function listarTickets(req: Request, res: Response): Promise<void> {
  const { estado, buscar } = esquemaFiltroTickets.parse(req.query)
  const ids = await prisma.ticketSoporte.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(buscar
        ? {
            OR: [
              { nombre: { contains: buscar, mode: 'insensitive' } },
              { email: { contains: buscar, mode: 'insensitive' } },
              { asunto: { contains: buscar, mode: 'insensitive' } },
              { tenant: { nombre: { contains: buscar, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    orderBy: [{ ultimoMensajeEn: 'desc' }],
    take: 200,
    select: { id: true },
  })
  const tickets = (await Promise.all(ids.map((fila) => ticketParaBandeja(fila.id)))).filter(Boolean)
  const [abiertos, enCurso] = await Promise.all([
    prisma.ticketSoporte.count({ where: { estado: 'ABIERTO' } }),
    prisma.ticketSoporte.count({ where: { estado: 'EN_CURSO' } }),
  ])
  res.json({ tickets, conteo: { abiertos, enCurso } })
}

export async function verTicket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const ticket = await prisma.ticketSoporte.findUnique({
    where: { id },
    include: {
      mensajes: { orderBy: { creadoEn: 'asc' } },
      tenant: { select: { id: true, nombre: true, subdominio: true, plan: true } },
    },
  })
  if (!ticket) throw noEncontrado('Ese ticket no existe')
  if (ticket.noLeidosAsesor > 0) {
    await prisma.ticketSoporte.update({ where: { id }, data: { noLeidosAsesor: 0 } })
    void anunciarTicket(id)
  }
  const { tokenVisitante: _token, ...publico } = ticket
  res.json({ ticket: { ...publico, noLeidosAsesor: 0 } })
}

export const esquemaCambioTicket = z.object({
  estado: z.enum(['ABIERTO', 'EN_CURSO', 'RESUELTO']).optional(),
  asignadoA: z.string().trim().max(160).nullable().optional(),
})

export async function cambiarTicket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const datos = req.body as z.infer<typeof esquemaCambioTicket>
  const antes = await prisma.ticketSoporte.findUnique({ where: { id }, select: { estado: true, numero: true } })
  if (!antes) throw noEncontrado('Ese ticket no existe')
  await prisma.ticketSoporte.update({
    where: { id },
    data: {
      ...datos,
      ...(datos.estado === 'RESUELTO' ? { cerradoEn: new Date() } : datos.estado ? { cerradoEn: null } : {}),
    },
  })
  if (datos.estado === 'RESUELTO' && antes.estado !== 'RESUELTO') {
    await publicarMensaje(id, 'SISTEMA', 'Mi Tienda', 'La conversación se marcó como resuelta. Si necesitas algo más, escríbenos aquí mismo.')
    registrarActividad(req, 'Resolvió un ticket', `#${antes.numero}`)
  }
  await anunciarTicket(id)
  res.json({ ticket: await ticketParaBandeja(id) })
}
