import { UnrecoverableError, Worker, type Job } from 'bullmq'
import { crearConexionRedis } from '../../config/redis.js'
import { registro } from '../../utilidades/registro.js'
import { ErrorAlegra } from '../../servicios/facturacion/alegra.js'
import { emitirFactura, marcarErrorFactura } from '../../servicios/facturacion/facturacion.servicio.js'
import { NOMBRES_COLAS, type TrabajoFactura } from '../definiciones.js'

/**
 * Emite facturas electrónicas. Si Alegra rechaza los datos (4xx) no se
 * reintenta: el error queda en el pedido para que la dueña lo corrija. Si es
 * una caída (5xx, red), BullMQ reintenta con espera creciente.
 */
async function procesar(trabajo: Job<TrabajoFactura>): Promise<void> {
  try {
    await emitirFactura(trabajo.data.pedidoId)
  } catch (error) {
    if (error instanceof ErrorAlegra && error.definitivo) {
      await marcarErrorFactura(trabajo.data.pedidoId, error.message)
      throw new UnrecoverableError(error.message)
    }
    throw error
  }
}

export function crearTrabajadorFacturas(): Worker<TrabajoFactura> {
  const trabajador = new Worker<TrabajoFactura>(NOMBRES_COLAS.facturas, procesar, {
    connection: crearConexionRedis(),
    // De a una: Alegra limita las peticiones por minuto de cada cuenta.
    concurrency: 1,
  })

  trabajador.on('failed', (trabajo, error) => {
    if (!trabajo) return
    const agotado = trabajo.attemptsMade >= (trabajo.opts.attempts ?? 1)
    registro.warn({ trabajoId: trabajo.id, intento: trabajo.attemptsMade, err: error }, 'Falló la emisión de una factura')
    if (agotado && !(error instanceof UnrecoverableError)) {
      void marcarErrorFactura(trabajo.data.pedidoId, 'Alegra no respondió. Vuelve a intentarlo en un rato.').catch(() => undefined)
    }
  })

  return trabajador
}
