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

/**
 * Reoptimización de una foto de producto ya guardada (las que se subieron
 * antes de que el panel las optimizara al subirlas, o las que entran por URL
 * firmada directo a R2).
 */
export interface TrabajoOptimizarImagen {
  tenantId: string
  tiendaId: string
  /** Producto cuya lista de fotos se actualiza con la nueva URL. */
  productoId?: string
  /** Clave del objeto original (en R2 o en la carpeta local). */
  claveOriginal: string
  /** Lado mayor en píxeles. Por defecto, ANCHO_MAXIMO. */
  anchoMaximo?: number
}

export const OPCIONES_TRABAJO_POR_DEFECTO: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2_000 },
  // Conservamos un histórico corto: lo suficiente para depurar, no tanto como
  // para que Redis crezca sin control.
  removeOnComplete: { age: 3_600, count: 500 },
  removeOnFail: { age: 24 * 3_600 },
}
