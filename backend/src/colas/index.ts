import { Queue } from 'bullmq'
import { conexionRedis } from '../config/redis.js'
import { registro } from '../utilidades/registro.js'
import {
  NOMBRES_COLAS,
  OPCIONES_TRABAJO_POR_DEFECTO,
  type TrabajoOptimizarImagen,
} from './definiciones.js'

export * from './definiciones.js'

/**
 * Colas (lado productor). La API encola aquí y devuelve la respuesta enseguida;
 * el trabajo pesado lo hace el proceso de trabajadores, que corre aparte bajo
 * PM2 (ver src/colas/trabajadores/index.ts).
 */
export const colaImagenes = new Queue<TrabajoOptimizarImagen>(NOMBRES_COLAS.imagenes, {
  connection: conexionRedis,
  defaultJobOptions: OPCIONES_TRABAJO_POR_DEFECTO,
})

/**
 * Encola la optimización de una foto de producto. Se llama justo después de
 * confirmar la subida a R2, nunca dentro del request que sube el archivo.
 */
export async function encolarOptimizacionImagen(datos: TrabajoOptimizarImagen): Promise<string> {
  const trabajo = await colaImagenes.add('optimizar', datos)
  registro.debug({ trabajoId: trabajo.id, clave: datos.claveOriginal }, 'Imagen encolada')
  return trabajo.id ?? ''
}

const todasLasColas = [colaImagenes]

/** Cierra las colas al apagar el proceso, para no dejar trabajos a medias. */
export async function cerrarColas(): Promise<void> {
  await Promise.all(todasLasColas.map((cola) => cola.close()))
}
