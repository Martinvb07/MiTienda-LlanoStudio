import { randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import type { Prisma } from '../generado/prisma/client.js'
import { ErrorHttp, noEncontrado, solicitudInvalida } from '../utilidades/errores.js'
import { limitesDe } from '../utilidades/planes.js'
import {
  aFecha,
  buscarSeccionReservas,
  fechaLocal,
  horaLocal,
  horasLibres,
  sumarDias,
  type ConfigReservas,
  type Ocupada,
} from '../utilidades/reservas.js'
import { enviarCorreoDirecto, plantillaCorreo } from '../servicios/correos.servicio.js'
import { urlPanel } from '../servicios/suscripciones.servicio.js'
import { registro } from '../utilidades/registro.js'
import { entorno } from '../config/entorno.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha')
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Elige una hora')

export const esquemaDisponibilidad = z.object({
  servicio: z.string().min(1).max(40),
  fecha: fecha.optional(),
})

export const esquemaReserva = z.object({
  servicioId: z.string().min(1).max(40),
  fecha,
  hora,
  nombre: z.string().trim().min(2, 'Escribe tu nombre').max(80),
  telefono: z.string().trim().min(7, 'Escribe un celular de contacto').max(20),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160)]).optional(),
  notas: z.string().trim().max(500).optional(),
})

/** La dueña también agenda (citas por teléfono): puede pasar por encima del cupo. */
export const esquemaCitaPanel = esquemaReserva.extend({ forzar: z.boolean().optional() })

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'] as const

export const esquemaActualizarCita = z.object({
  estado: z.enum(ESTADOS).optional(),
  notaInterna: z.string().trim().max(1000).nullable().optional(),
})

export const esquemaRangoCitas = z.object({
  desde: fecha.optional(),
  hasta: fecha.optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

const camposCita = {
  id: true,
  servicioId: true,
  servicio: true,
  duracion: true,
  precio: true,
  inicio: true,
  fin: true,
  clienteNombre: true,
  clienteTelefono: true,
  clienteEmail: true,
  notas: true,
  notaInterna: true,
  estado: true,
  codigo: true,
  creadoEn: true,
} as const

type CitaBd = Prisma.CitaGetPayload<{ select: typeof camposCita }>

const OCUPA = { estado: { notIn: ['CANCELADA', 'NO_ASISTIO'] as ('CANCELADA' | 'NO_ASISTIO')[] } }

/** Lo que ve el cliente de su cita: sin notas internas ni datos de otros. */
function citaPublica(cita: CitaBd) {
  return {
    codigo: cita.codigo,
    servicio: cita.servicio,
    duracion: cita.duracion,
    precio: cita.precio,
    fecha: fechaLocal(cita.inicio),
    hora: horaLocal(cita.inicio),
    estado: cita.estado,
    clienteNombre: cita.clienteNombre,
  }
}

async function configDeTienda(tiendaId: string) {
  const tienda = await prisma.tienda.findUnique({
    where: { id: tiendaId },
    select: { publicada: true, nombre: true, configuracionBloques: true, ajustes: true, tenantId: true, tenant: { select: { plan: true } } },
  })
  if (!tienda) throw noEncontrado('Este sitio no existe')
  return { tienda, config: buscarSeccionReservas(tienda.configuracionBloques, tienda.ajustes) }
}

function servicioDe(config: ConfigReservas | null, servicioId: string) {
  if (!config) throw noEncontrado('Este sitio no está recibiendo reservas')
  const servicio = config.servicios.find((otro) => otro.id === servicioId)
  if (!servicio) throw solicitudInvalida('Ese servicio ya no está disponible', [{ campo: 'servicioId', mensaje: 'Elige un servicio' }])
  return servicio
}

const ocupadasEntre = (tiendaId: string, desde: Date, hasta: Date): Promise<Ocupada[]> =>
  prisma.cita.findMany({
    where: { tiendaId, ...OCUPA, inicio: { lt: hasta }, fin: { gt: desde } },
    select: { inicio: true, fin: true },
  })

const nuevoCodigo = () => randomBytes(9).toString('base64url')

/** "martes 27 de octubre, 9:30 a. m." en español de Colombia. */
export function describirFecha(instante: Date) {
  return instante.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const hostDe = (req: Request) => String(req.headers['x-mitienda-host'] ?? req.headers.host ?? '')

/** Las citas creadas este mes, para el límite del plan. */
async function citasDelMes(tiendaId: string) {
  const hoy = fechaLocal(new Date())
  const inicioMes = aFecha(`${hoy.slice(0, 7)}-01`, '00:00')
  return prisma.cita.count({ where: { tiendaId, creadoEn: { gte: inicioMes } } })
}

/**
 * Crea la cita si el turno sigue libre. Un candado por tienda dentro de la
 * transacción evita que dos personas tomen el último cupo a la vez.
 */
async function crearCita(
  tiendaId: string,
  config: ConfigReservas,
  datos: z.infer<typeof esquemaReserva>,
  opciones: { forzar?: boolean; estado?: 'PENDIENTE' | 'CONFIRMADA'; ahora?: Date },
) {
  const servicio = servicioDe(config, datos.servicioId)
  const inicio = aFecha(datos.fecha, datos.hora)
  const fin = new Date(inicio.getTime() + servicio.duracion * 60_000)

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tiendaId}))`
    if (!opciones.forzar) {
      const ocupadas = await tx.cita.findMany({
        where: { tiendaId, ...OCUPA, inicio: { lt: aFecha(sumarDias(datos.fecha, 1), '00:00') }, fin: { gt: aFecha(datos.fecha, '00:00') } },
        select: { inicio: true, fin: true },
      })
      if (!horasLibres(config, servicio, datos.fecha, ocupadas, opciones.ahora).includes(datos.hora)) {
        throw new ErrorHttp(409, 'Esa hora acaba de ocuparse. Elige otra.', 'HORA_OCUPADA', [{ campo: 'hora', mensaje: 'Esa hora ya no está disponible' }])
      }
    }
    return tx.cita.create({
      data: {
        tiendaId,
        servicioId: servicio.id,
        servicio: servicio.nombre,
        duracion: servicio.duracion,
        precio: servicio.precio ?? null,
        inicio,
        fin,
        clienteNombre: datos.nombre,
        clienteTelefono: datos.telefono,
        clienteEmail: datos.email || null,
        notas: datos.notas || null,
        estado: opciones.estado ?? 'PENDIENTE',
        codigo: nuevoCodigo(),
      },
      select: camposCita,
    })
  })
}

/** Avisos por correo de una cita nueva: a la dueña y, si dejó correo, al cliente. */
async function avisarCitaNueva(tenantId: string, negocio: string, cita: CitaBd, host: string) {
  const cuando = describirFecha(cita.inicio)
  const duenas = await prisma.usuario.findMany({
    where: { tenantId, activo: true, rol: { in: ['PROPIETARIO', 'ADMINISTRADOR'] } },
    select: { email: true },
  })
  const html = plantillaCorreo(
    'Tienes una cita nueva',
    [`${cita.clienteNombre} agendó ${cita.servicio} para el ${cuando}.`, `Celular: ${cita.clienteTelefono}${cita.notas ? ` · Nota: ${cita.notas}` : ''}`],
    { texto: 'Ver la agenda', url: `${urlPanel()}/panel/agenda` },
  )
  for (const { email } of duenas) await enviarCorreoDirecto(email, `Cita nueva: ${cita.servicio}, ${cuando}`, html)

  if (cita.clienteEmail && host) {
    await enviarCorreoDirecto(
      cita.clienteEmail,
      `Tu cita en ${negocio}`,
      plantillaCorreo(
        `Tu cita quedó agendada`,
        [`${cita.servicio} en ${negocio}, el ${cuando}.`, 'Si no puedes ir, cancélala desde el botón para liberar el turno.'],
        { texto: 'Ver o cancelar mi cita', url: `https://${host}/cita/${cita.codigo}` },
      ),
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sitio público
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Días con algún turno libre (sin `fecha`) u horas libres de un día (con
 * `fecha`), para el servicio elegido.
 */
export async function obtenerDisponibilidad(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const consulta = req.query as unknown as z.infer<typeof esquemaDisponibilidad>
  const { tienda, config } = await configDeTienda(tiendaId)
  if (!tienda.publicada) throw noEncontrado('Este sitio no está publicado')
  const servicio = servicioDe(config, consulta.servicio)
  const ahora = new Date()

  if (consulta.fecha) {
    const ocupadas = await ocupadasEntre(tiendaId, aFecha(consulta.fecha, '00:00'), aFecha(sumarDias(consulta.fecha, 1), '00:00'))
    res.json({ horas: horasLibres(config!, servicio, consulta.fecha, ocupadas, ahora) })
    return
  }

  const hoy = fechaLocal(ahora)
  const ultimo = sumarDias(hoy, config!.diasAdelante)
  const ocupadas = await ocupadasEntre(tiendaId, aFecha(hoy, '00:00'), aFecha(sumarDias(ultimo, 1), '00:00'))
  const dias: string[] = []
  for (let dia = hoy; dia <= ultimo; dia = sumarDias(dia, 1)) {
    if (horasLibres(config!, servicio, dia, ocupadas, ahora).length) dias.push(dia)
  }
  res.json({ dias })
}

export async function crearReservaPublica(req: Request, res: Response): Promise<void> {
  const { tiendaId, plan } = req.tenant!
  const datos = req.body as z.infer<typeof esquemaReserva>
  const { tienda, config } = await configDeTienda(tiendaId)
  if (!tienda.publicada || !config) throw noEncontrado('Este sitio no está recibiendo reservas')
  if (config.pedirCorreo && !datos.email) {
    throw solicitudInvalida('Escribe tu correo', [{ campo: 'email', mensaje: 'Escribe tu correo para enviarte la confirmación' }])
  }

  const limite = limitesDe(plan).citasMes
  if (limite !== null && (await citasDelMes(tiendaId)) >= limite) {
    throw new ErrorHttp(409, 'Este negocio no tiene más turnos en línea este mes. Escríbele directamente.', 'SIN_CUPO_PLAN')
  }

  const cita = await crearCita(tiendaId, config, datos, {})
  avisarCitaNueva(tienda.tenantId, tienda.nombre, cita, hostDe(req)).catch((error: unknown) =>
    registro.error({ err: error }, 'No se pudo avisar la cita nueva'),
  )
  res.status(201).json({ cita: citaPublica(cita) })
}

/** El cliente mira su cita desde el enlace del correo. */
export async function obtenerCitaPublica(req: Request, res: Response): Promise<void> {
  const cita = await prisma.cita.findFirst({ where: { codigo: String(req.params.codigo), tiendaId: req.tenant!.tiendaId }, select: camposCita })
  if (!cita) throw noEncontrado('No encontramos esa cita')
  res.json({ cita: citaPublica(cita) })
}

/** El cliente cancela su cita: el turno vuelve a quedar libre. */
export async function cancelarCitaPublica(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const actual = await prisma.cita.findFirst({ where: { codigo: String(req.params.codigo), tiendaId }, select: { id: true, estado: true, inicio: true } })
  if (!actual) throw noEncontrado('No encontramos esa cita')
  if (actual.inicio.getTime() < Date.now()) throw solicitudInvalida('Esa cita ya pasó')
  if (actual.estado !== 'PENDIENTE' && actual.estado !== 'CONFIRMADA') throw solicitudInvalida('Esa cita ya no se puede cancelar')
  const cita = await prisma.cita.update({ where: { id: actual.id }, data: { estado: 'CANCELADA' }, select: camposCita })
  res.json({ cita: citaPublica(cita) })
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────

async function tiendaDeLaSesion(req: Request) {
  const tienda = await prisma.tienda.findUnique({ where: { tenantId: req.sesion!.tenantId }, select: { id: true } })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene sitio')
  return tienda.id
}

/** Citas de un rango (por defecto, de una semana atrás a dos meses adelante) y cómo va el mes. */
export async function listarCitasPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const rango = req.query as unknown as z.infer<typeof esquemaRangoCitas>
  const hoy = fechaLocal(new Date())
  const desde = rango.desde ?? sumarDias(hoy, -7)
  const hasta = rango.hasta ?? sumarDias(hoy, 60)

  const [citas, { config, tienda }, usadas] = await Promise.all([
    prisma.cita.findMany({
      where: { tiendaId, inicio: { gte: aFecha(desde, '00:00'), lt: aFecha(sumarDias(hasta, 1), '00:00') } },
      orderBy: { inicio: 'asc' },
      take: 1000,
      select: camposCita,
    }),
    configDeTienda(tiendaId),
    citasDelMes(tiendaId),
  ])

  res.json({
    citas,
    servicios: config?.servicios ?? [],
    activas: Boolean(config),
    mes: { usadas, limite: limitesDe(tienda.tenant.plan).citasMes },
  })
}

export async function crearCitaPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaCitaPanel>
  const { config } = await configDeTienda(tiendaId)
  if (!config) throw solicitudInvalida('Agrega la sección "Reservas" a tu sitio para configurar tus servicios y horarios')
  // La dueña agenda aunque el turno sea ya mismo: sin anticipación mínima.
  const cita = await crearCita(tiendaId, { ...config, anticipacion: 0, diasAdelante: 365 }, datos, {
    forzar: datos.forzar,
    estado: 'CONFIRMADA',
  })
  res.status(201).json({ cita })
}

export async function actualizarCitaPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaActualizarCita>
  const actual = await prisma.cita.findFirst({ where: { id: String(req.params.id), tiendaId }, select: { id: true } })
  if (!actual) throw noEncontrado('Esa cita no existe')
  const cita = await prisma.cita.update({
    where: { id: actual.id },
    data: {
      ...(datos.estado ? { estado: datos.estado } : {}),
      ...(datos.notaInterna !== undefined ? { notaInterna: datos.notaInterna || null } : {}),
    },
    select: camposCita,
  })
  res.json({ cita })
}

// ─────────────────────────────────────────────────────────────────────────────
// Recordatorios
// ─────────────────────────────────────────────────────────────────────────────

/** Cada hora: un correo a quienes tienen cita entre 20 y 28 horas desde ahora. */
export async function enviarRecordatoriosCitas() {
  const ahora = Date.now()
  const citas = await prisma.cita.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      recordatorioEnviado: false,
      clienteEmail: { not: null },
      inicio: { gt: new Date(ahora + 20 * 3_600_000), lt: new Date(ahora + 28 * 3_600_000) },
    },
    select: { ...camposCita, tienda: { select: { nombre: true, tenant: { select: { subdominio: true } } } } },
    take: 500,
  })
  for (const cita of citas) {
    const host = `${cita.tienda.tenant.subdominio}.${entorno.DOMINIO_BASE}`
    const enviado = await enviarCorreoDirecto(
      cita.clienteEmail!,
      `Mañana tienes cita en ${cita.tienda.nombre}`,
      plantillaCorreo(
        'Te esperamos mañana',
        [`${cita.servicio} en ${cita.tienda.nombre}, el ${describirFecha(cita.inicio)}.`, 'Si ya no puedes ir, avísanos cancelando la cita.'],
        { texto: 'Ver o cancelar mi cita', url: `https://${host}/cita/${cita.codigo}` },
      ),
    )
    if (!enviado) return
    await prisma.cita.update({ where: { id: cita.id }, data: { recordatorioEnviado: true } })
  }
}

/** Para el resumen del panel: las citas de hoy que siguen en pie. */
export async function citasDeHoy(tiendaId: string) {
  const hoy = fechaLocal(new Date())
  return prisma.cita.count({
    where: { tiendaId, estado: { in: ['PENDIENTE', 'CONFIRMADA'] }, inicio: { gte: aFecha(hoy, '00:00'), lt: aFecha(sumarDias(hoy, 1), '00:00') } },
  })
}
