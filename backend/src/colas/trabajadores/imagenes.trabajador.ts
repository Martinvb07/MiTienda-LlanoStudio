import { Worker, type Job } from 'bullmq'
import { crearConexionRedis } from '../../config/redis.js'
import { registro } from '../../utilidades/registro.js'
import { NOMBRES_COLAS, type TrabajoOptimizarImagen } from '../definiciones.js'

/**
 * Trabajador de imágenes de producto.
 *
 * El cableado está completo (consume la cola, reintenta, registra y apaga
 * limpio); el procesamiento en sí queda pendiente a propósito.
 *
 * TODO — al implementar la subida de fotos:
 *   1. npm i sharp
 *   2. descargar `claveOriginal` desde R2 (src/almacenamiento/r2.ts)
 *   3. generar los anchos pedidos en WebP/AVIF con sharp
 *   4. subir cada variante a R2
 *   5. actualizar Producto.fotos con las URLs públicas resultantes
 */
async function procesar(trabajo: Job<TrabajoOptimizarImagen>): Promise<{ pendiente: boolean }> {
  const { claveOriginal, tiendaId, anchos } = trabajo.data

  registro.info(
    { trabajoId: trabajo.id, tiendaId, claveOriginal, anchos: anchos ?? [320, 640, 1280] },
    'Trabajo de imagen recibido (procesamiento aún sin implementar)',
  )

  return { pendiente: true }
}

export function crearTrabajadorImagenes(): Worker<TrabajoOptimizarImagen> {
  // BullMQ exige una conexión propia por trabajador: sus comandos de espera
  // son bloqueantes y no pueden compartir la conexión de los productores.
  const trabajador = new Worker<TrabajoOptimizarImagen>(NOMBRES_COLAS.imagenes, procesar, {
    connection: crearConexionRedis(),
    concurrency: 3,
  })

  trabajador.on('failed', (trabajo, error) => {
    registro.error(
      { trabajoId: trabajo?.id, intento: trabajo?.attemptsMade, err: error },
      'Falló un trabajo de imagen',
    )
  })

  return trabajador
}
