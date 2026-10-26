/**
 * Reservas: de la sección "Reservas" del sitio salen los servicios, los días
 * y las horas de atención; con eso y las citas ya tomadas se calculan los
 * horarios libres. Todo en hora de Colombia (UTC-5, sin horario de verano).
 *
 * Las props de la sección son JSON que guarda el editor: aquí se leen con
 * valores por defecto, sin confiar en que vengan completas.
 */

export const ZONA_HORARIA = '-05:00'
const MINUTO = 60_000

export interface ServicioReserva {
  id: string
  nombre: string
  /** Minutos. */
  duracion: number
  precio?: string
}

export interface DiaAtencion {
  /** 0 = domingo … 6 = sábado. */
  dia: number
  activo: boolean
  /** "08:00" */
  desde: string
  hasta: string
}

export interface ConfigReservas {
  servicios: ServicioReserva[]
  dias: DiaAtencion[]
  /** Cada cuántos minutos arranca un turno. */
  intervalo: number
  /** Citas a la misma hora (sillas, consultorios, profesionales). */
  capacidad: number
  /** Hasta cuántos días hacia adelante se puede agendar. */
  diasAdelante: number
  /** Horas mínimas entre ahora y la cita. */
  anticipacion: number
  pedirCorreo: boolean
  /** Fechas cerradas (festivos, vacaciones): "2026-12-25". */
  cerrado: string[]
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const FECHA = /^\d{4}-\d{2}-\d{2}$/

const entre = (valor: unknown, minimo: number, maximo: number, defecto: number) => {
  const numero = Number(valor)
  return Number.isFinite(numero) ? Math.min(maximo, Math.max(minimo, Math.round(numero))) : defecto
}

/** Lunes a viernes de 8 a 6 y sábados de 9 a 1: lo que trae la sección al nacer. */
export const DIAS_INICIALES: DiaAtencion[] = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
  dia,
  activo: dia >= 1 && dia <= 6,
  desde: dia === 6 ? '09:00' : '08:00',
  hasta: dia === 6 ? '13:00' : '18:00',
}))

/** Lee las props de una sección de reservas con valores seguros. */
export function leerConfig(props: Record<string, unknown>): ConfigReservas {
  const servicios = (Array.isArray(props.servicios) ? props.servicios : [])
    .filter((servicio): servicio is Record<string, unknown> => Boolean(servicio) && typeof servicio === 'object')
    .map((servicio) => ({
      id: String(servicio.id ?? '').slice(0, 40),
      nombre: String(servicio.nombre ?? '').trim().slice(0, 80),
      duracion: entre(servicio.duracion, 5, 600, 30),
      precio: typeof servicio.precio === 'string' && servicio.precio.trim() ? servicio.precio.trim().slice(0, 40) : undefined,
    }))
    .filter((servicio) => servicio.id && servicio.nombre)

  const guardados = Array.isArray(props.dias) ? (props.dias as Partial<DiaAtencion>[]) : []
  const dias = DIAS_INICIALES.map((inicial) => {
    const guardado = guardados.find((otro) => otro && Number(otro.dia) === inicial.dia)
    if (!guardado) return inicial
    const desde = typeof guardado.desde === 'string' && HORA.test(guardado.desde) ? guardado.desde : inicial.desde
    const hasta = typeof guardado.hasta === 'string' && HORA.test(guardado.hasta) ? guardado.hasta : inicial.hasta
    return { dia: inicial.dia, activo: Boolean(guardado.activo) && desde < hasta, desde, hasta }
  })

  return {
    servicios,
    dias,
    intervalo: entre(props.intervalo, 5, 240, 30),
    capacidad: entre(props.capacidad, 1, 50, 1),
    diasAdelante: entre(props.diasAdelante, 1, 120, 30),
    anticipacion: entre(props.anticipacion, 0, 168, 2),
    pedirCorreo: props.pedirCorreo !== false,
    cerrado: (Array.isArray(props.cerrado) ? props.cerrado : []).filter((fecha): fecha is string => typeof fecha === 'string' && FECHA.test(fecha)),
  }
}

interface BloqueGuardado {
  tipo?: unknown
  props?: unknown
  visible?: unknown
}

/**
 * La primera sección de reservas visible del sitio: en la página de inicio o
 * en una de las páginas aparte. Sin ella, el sitio no recibe reservas.
 */
export function buscarSeccionReservas(bloques: unknown, ajustes: unknown): ConfigReservas | null {
  const paginas = (ajustes as { paginas?: { bloques?: unknown }[] } | null)?.paginas ?? []
  const todos = [bloques, ...paginas.map((pagina) => pagina?.bloques)].flatMap((lista) => (Array.isArray(lista) ? (lista as BloqueGuardado[]) : []))
  const seccion = todos.find((bloque) => bloque?.tipo === 'reservas' && bloque.visible !== false)
  if (!seccion || !seccion.props || typeof seccion.props !== 'object') return null
  return leerConfig(seccion.props as Record<string, unknown>)
}

/** "2026-10-27" + "09:30" en hora de Colombia. */
export const aFecha = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00${ZONA_HORARIA}`)

/** La fecha de Colombia ("2026-10-27") de un instante. */
export function fechaLocal(instante: Date): string {
  return new Date(instante.getTime() - 5 * 60 * MINUTO).toISOString().slice(0, 10)
}

/** "09:30" en hora de Colombia. */
export function horaLocal(instante: Date): string {
  return new Date(instante.getTime() - 5 * 60 * MINUTO).toISOString().slice(11, 16)
}

/** Día de la semana (0 = domingo) de una fecha "AAAA-MM-DD". */
export const diaSemana = (fecha: string) => new Date(`${fecha}T12:00:00${ZONA_HORARIA}`).getUTCDay()

export function sumarDias(fecha: string, dias: number): string {
  return fechaLocal(new Date(aFecha(fecha, '12:00').getTime() + dias * 86_400_000))
}

export interface Ocupada {
  inicio: Date
  fin: Date
}

/**
 * Horas libres de un día para un servicio: cada turno arranca cada
 * `intervalo` minutos y cabe entero antes del cierre; está libre si a esa
 * hora hay menos citas que la capacidad y respeta la anticipación mínima.
 */
export function horasLibres(config: ConfigReservas, servicio: ServicioReserva, fecha: string, ocupadas: Ocupada[], ahora = new Date()): string[] {
  if (!FECHA.test(fecha) || config.cerrado.includes(fecha)) return []
  const hoy = fechaLocal(ahora)
  if (fecha < hoy || fecha > sumarDias(hoy, config.diasAdelante)) return []
  const atencion = config.dias.find((dia) => dia.dia === diaSemana(fecha))
  if (!atencion?.activo) return []

  const apertura = aFecha(fecha, atencion.desde).getTime()
  const cierre = aFecha(fecha, atencion.hasta).getTime()
  const minimo = ahora.getTime() + config.anticipacion * 60 * MINUTO
  const libres: string[] = []
  for (let inicio = apertura; inicio + servicio.duracion * MINUTO <= cierre; inicio += config.intervalo * MINUTO) {
    if (inicio < minimo) continue
    const fin = inicio + servicio.duracion * MINUTO
    const cruces = ocupadas.filter((cita) => cita.inicio.getTime() < fin && cita.fin.getTime() > inicio).length
    if (cruces < config.capacidad) libres.push(horaLocal(new Date(inicio)))
  }
  return libres
}
