import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { solicitudInvalida } from '../utilidades/errores.js'

type Origen = 'body' | 'query' | 'params'

/**
 * Valida una parte de la petición contra un esquema de Zod y sustituye el
 * valor crudo por el ya parseado (con sus coerciones y valores por defecto).
 *
 *   router.post('/productos', validar(esquemaProducto), crearProducto)
 */
export function validar(esquema: ZodType, origen: Origen = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(req[origen])

    if (!resultado.success) {
      next(
        solicitudInvalida(
          'Los datos enviados no son válidos',
          resultado.error.issues.map((problema) => ({
            campo: problema.path.join('.'),
            mensaje: problema.message,
          })),
        ),
      )
      return
    }

    // req.query y req.params son de sólo lectura en Express 5.
    if (origen === 'body') {
      req.body = resultado.data
    } else {
      Object.defineProperty(req, origen, { value: resultado.data, writable: false })
    }

    next()
  }
}
