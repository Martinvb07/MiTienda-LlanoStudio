/** Citas agendadas desde la sección de reservas, como las ve el panel. */

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO'

export interface Cita {
  id: string
  servicioId: string
  servicio: string
  /** Minutos. */
  duracion: number
  precio: string | null
  inicio: string
  fin: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string | null
  notas: string | null
  notaInterna: string | null
  estado: EstadoCita
  codigo: string
  creadoEn: string
}

export interface AgendaPanel {
  citas: Cita[]
  servicios: { id: string; nombre: string; duracion: number; precio?: string }[]
  /** Hay una sección de reservas en el sitio. */
  activas: boolean
  mes: { usadas: number; limite: number | null }
}

export interface DatosCitaPanel {
  servicioId: string
  fecha: string
  hora: string
  nombre: string
  telefono: string
  email?: string
  notas?: string
  /** Agendar aunque el turno esté lleno. */
  forzar?: boolean
}
