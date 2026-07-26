import type { JobsOptions } from 'bullmq'

/**
 * Nombres y contratos de las colas. Vive aparte de las colas y los
 * trabajadores para que ambos lados compartan exactamente los mismos tipos.
 */
export const NOMBRES_COLAS = {
  imagenes: 'imagenes',
  pagos: 'pagos',
  facturas: 'facturas',
} as const

export type NombreCola = (typeof NOMBRES_COLAS)[keyof typeof NOMBRES_COLAS]

/** Trabajo de optimización de una foto de producto recién subida a R2. */
export interface TrabajoOptimizarImagen {
  tenantId: string
  tiendaId: string
  productoId?: string
  /** Clave del objeto original dentro del bucket de R2. */
  claveOriginal: string
  /** Anchos a generar, en píxeles. */
  anchos?: number[]
}

export const OPCIONES_TRABAJO_POR_DEFECTO: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2_000 },
  // Conservamos un histórico corto: lo suficiente para depurar, no tanto como
  // para que Redis crezca sin control.
  removeOnComplete: { age: 3_600, count: 500 },
  removeOnFail: { age: 24 * 3_600 },
}
