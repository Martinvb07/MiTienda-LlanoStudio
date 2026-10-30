import type { NextFunction, Request, Response } from 'express'
import { entorno } from '../config/entorno.js'
import { ErrorHttp } from '../utilidades/errores.js'
import { registro } from '../utilidades/registro.js'
import { reportarError } from '../servicios/alertas.servicio.js'

/** 404 para rutas que no existen. Va montado después de todas las rutas. */
export function rutaNoEncontrada(req: Request, res: Response): void {
  res.status(404).json({
    error: { codigo: 'NO_ENCONTRADO', mensaje: `No existe la ruta ${req.method} ${req.originalUrl}` },
  })
}

/**
 * Manejador central de errores. Express 5 encamina aquí también los rechazos
 * de los handlers async, así que no hace falta envolverlos.
 */
export function manejadorErrores(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const esConocido = error instanceof ErrorHttp
  const estado = esConocido ? error.estado : 500

  if (estado >= 500) {
    registro.error({ err: error, ruta: req.originalUrl, host: req.headers.host }, 'Error no controlado')
    reportarError({
      hora: new Date().toISOString(),
      origen: 'api',
      metodo: req.method,
      ruta: req.originalUrl,
      mensaje: (error as Error)?.message ?? String(error),
      pila: (error as Error)?.stack?.split('\n').slice(0, 6).join('\n'),
    })
  } else {
    registro.warn({ ruta: req.originalUrl, mensaje: (error as Error)?.message }, 'Petición rechazada')
  }

  res.status(estado).json({
    error: {
      codigo: esConocido ? error.codigo : 'ERROR_INTERNO',
      // Nunca filtramos el mensaje real de un 500 al cliente.
      mensaje: esConocido ? error.message : 'Ocurrió un error inesperado',
      ...(esConocido && error.detalles ? { detalles: error.detalles } : {}),
      ...(!entorno.esProduccion && !esConocido
        ? { depuracion: (error as Error)?.message }
        : {}),
    },
  })
}
