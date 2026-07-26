import { Redis } from 'ioredis'
import { entorno } from './entorno.js'
import { registro } from '../utilidades/registro.js'

/**
 * Conexión a Redis compartida por las colas de BullMQ.
 *
 * `maxRetriesPerRequest: null` es un requisito de BullMQ: sus comandos
 * bloqueantes (BRPOPLPUSH y compañía) no deben abortarse por reintentos.
 */
export function crearConexionRedis(): Redis {
  const conexion = new Redis(entorno.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  conexion.on('error', (error: Error) => {
    registro.error({ err: error }, 'Error de conexión con Redis')
  })

  return conexion
}

/** Conexión por defecto, reutilizada por productores y trabajadores. */
export const conexionRedis = crearConexionRedis()

export async function cerrarRedis(): Promise<void> {
  await conexionRedis.quit()
}
