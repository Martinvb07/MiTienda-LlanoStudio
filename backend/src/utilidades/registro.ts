import pino from 'pino'
import { entorno } from '../config/entorno.js'

/**
 * Logger de la aplicación. En producción escribe JSON en una línea, que es lo
 * que PM2 archiva y lo que cualquier agregador sabe leer; en desarrollo pasa
 * por pino-pretty para que sea legible en la terminal.
 */
export const registro = pino({
  level: entorno.esProduccion ? 'info' : 'debug',
  ...(entorno.esProduccion
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
})
