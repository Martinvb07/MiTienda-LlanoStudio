import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { validar } from '../middlewares/validacion.js'
import { leerSesionPanel } from '../middlewares/autenticacion.js'
import { noAutorizado, noEncontrado } from '../utilidades/errores.js'
import { leerAjuste } from '../servicios/plataforma.servicio.js'
import { anunciarTicket, nuevoTokenVisitante, publicarMensaje } from '../servicios/soporte.servicio.js'
import { limites } from '../middlewares/limiteIntentos.js'

/**
 * Chat de soporte, lado cliente. Desde la web cualquiera abre una
 * conversación con nombre y correo; desde el panel va ligada a la tienda.
 * Los mensajes después viajan por socket.io (servicios/soporte.servicio).
 */
const enrutador = Router()

const sesionDe = (req: Request) => {
  const cabecera = req.headers.authorization
  return leerSesionPanel(cabecera?.startsWith('Bearer ') ? cabecera.slice(7).trim() : null)
}

/** Respuestas rápidas que el chat muestra antes de hablar con un asesor. */
enrutador.get('/opciones', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ opciones: await leerAjuste('opcionesSoporte') })
})

const esquemaNuevo = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80).optional(),
  email: z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160).optional(),
  asunto: z.string().trim().max(160).optional(),
  mensaje: z.string().trim().min(1, 'Escribe tu mensaje').max(4000),
})

enrutador.post('/tickets', limites.formularioPublico, validar(esquemaNuevo), async (req, res) => {
  const datos = req.body as z.infer<typeof esquemaNuevo>
  const sesion = sesionDe(req)

  let nombre = datos.nombre
  let email = datos.email
  if (sesion) {
    const usuario = await prisma.usuario.findUnique({ where: { id: sesion.usuarioId }, select: { nombre: true, email: true } })
    nombre = usuario?.nombre ?? nombre
    email = usuario?.email ?? email
  }
  if (!nombre || !email) throw noAutorizado('Escribe tu nombre y tu correo para hablar con un asesor')

  const ticket = await prisma.ticketSoporte.create({
    data: {
      origen: sesion ? 'PANEL' : 'LANDING',
      tenantId: sesion?.tenantId ?? null,
      nombre,
      email,
      asunto: datos.asunto || datos.mensaje.slice(0, 80),
      tokenVisitante: nuevoTokenVisitante(),
    },
    select: { id: true, tokenVisitante: true },
  })
  await publicarMensaje(ticket.id, 'CLIENTE', nombre, datos.mensaje)
  await anunciarTicket(ticket.id)
  res.status(201).json({ token: ticket.tokenVisitante })
})

/** Reanuda una conversación con el token guardado en el navegador. */
enrutador.get('/tickets/:token', async (req, res) => {
  const ticket = await prisma.ticketSoporte.findUnique({
    where: { tokenVisitante: req.params.token },
    include: { mensajes: { orderBy: { creadoEn: 'asc' }, take: 300 } },
  })
  if (!ticket) throw noEncontrado('Esa conversación ya no existe')
  if (ticket.tenantId && sesionDe(req)?.tenantId !== ticket.tenantId) throw noEncontrado('Esa conversación ya no existe')
  res.json({
    ticket: {
      numero: ticket.numero,
      estado: ticket.estado,
      asignadoA: ticket.asignadoA ? ticket.asignadoA.split('@')[0] : null,
      calificacion: ticket.calificacion,
      mensajes: ticket.mensajes,
    },
  })
})

const esquemaCalificar = z.object({ calificacion: z.coerce.number().int().min(1).max(5) })

enrutador.post('/tickets/:token/calificar', validar(esquemaCalificar), async (req, res) => {
  const { calificacion } = req.body as z.infer<typeof esquemaCalificar>
  const { count } = await prisma.ticketSoporte.updateMany({
    where: { tokenVisitante: req.params.token as string },
    data: { calificacion },
  })
  if (count === 0) throw noEncontrado('Esa conversación ya no existe')
  res.json({ ok: true })
})

export default enrutador
