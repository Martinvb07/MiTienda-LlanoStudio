import type { NextFunction, Request, Response } from 'express'
import { entorno } from '../config/entorno.js'
import { ErrorHttp } from '../utilidades/errores.js'

/**
 * Tope de intentos por ventana de tiempo, para que nadie pruebe contraseñas sin
 * parar ni llene de spam los formularios públicos de las tiendas.
 *
 * Vive en memoria: la API corre como un solo proceso (ver ecosystem.config.cjs).
 * Si algún día se escala a varias instancias, los contadores tendrían que
 * pasar a Redis para que todas compartan la cuenta.
 */

interface Contador {
  intentos: number
  reiniciaEn: number
}

export interface OpcionesLimite {
  /** Separa los contadores de cada uso (ingreso, reseñas, …). */
  nombre: string
  ventanaMs: number
  maximo: number
  mensaje?: string
  /** Por defecto, la IP del visitante. */
  clave?: (req: Request) => string | undefined
}

const contadores = new Map<string, Contador>()

// Limpieza periódica: sin esto el mapa crece con cada IP que pasó alguna vez.
const limpieza = setInterval(() => {
  const ahora = Date.now()
  for (const [clave, contador] of contadores) if (contador.reiniciaEn <= ahora) contadores.delete(clave)
}, 60_000)
limpieza.unref()

/**
 * IP real del visitante.
 *
 *   · Desde una Server Action de Next la llamada es servidor a servidor, así que
 *     Next manda la IP original en `x-mitienda-ip` junto al token interno.
 *   · Desde el navegador entra por nginx, que fija `X-Real-IP` (pisa lo que
 *     mande el cliente, y la API sólo escucha en 127.0.0.1).
 */
export function ipCliente(req: Request): string {
  const token = req.headers['x-mitienda-interno']
  const reenviada = req.headers['x-mitienda-ip']
  if (entorno.TOKEN_INTERNO && token === entorno.TOKEN_INTERNO && typeof reenviada === 'string' && reenviada) {
    return reenviada.split(',')[0]!.trim()
  }
  const real = req.headers['x-real-ip']
  if (typeof real === 'string' && real) return real.trim()
  return req.ip ?? 'desconocida'
}

/** Suma un intento y dice si sigue dentro del tope (y cuánto falta para reiniciar). */
export function registrarIntento(clave: string, ventanaMs: number, maximo: number, ahora = Date.now()) {
  let contador = contadores.get(clave)
  if (!contador || contador.reiniciaEn <= ahora) {
    contador = { intentos: 0, reiniciaEn: ahora + ventanaMs }
    contadores.set(clave, contador)
  }
  contador.intentos += 1
  return { permitido: contador.intentos <= maximo, restanteMs: contador.reiniciaEn - ahora }
}

/** Sólo para los tests. */
export function reiniciarContadores(): void {
  contadores.clear()
}

export function limitarIntentos(opciones: OpcionesLimite) {
  const { nombre, ventanaMs, maximo, mensaje = 'Hiciste demasiados intentos. Espera un momento y vuelve a probar.' } = opciones

  return (req: Request, res: Response, next: NextFunction): void => {
    // En los tests de integración no se quiere pelear con el tope.
    if (entorno.NODE_ENV === 'test') return next()

    const parte = opciones.clave ? opciones.clave(req) : ipCliente(req)
    if (!parte) return next()

    const { permitido, restanteMs } = registrarIntento(`${nombre}:${parte}`, ventanaMs, maximo)
    if (permitido) return next()

    res.setHeader('Retry-After', String(Math.ceil(restanteMs / 1000)))
    next(new ErrorHttp(429, mensaje, 'DEMASIADOS_INTENTOS'))
  }
}

const MINUTO = 60_000

/** Correo que viene en el cuerpo, para frenar a quien ataca una cuenta desde muchas IP. */
const correoDelCuerpo = (req: Request) => {
  const correo = (req.body as { email?: unknown } | undefined)?.email
  return typeof correo === 'string' ? correo.trim().toLowerCase() : undefined
}

/** Topes que usan las rutas. Juntos para que se vean y se ajusten en un solo sitio. */
export const limites = {
  ingresoPorIp: limitarIntentos({ nombre: 'ingreso-ip', ventanaMs: 15 * MINUTO, maximo: 10, mensaje: 'Demasiados intentos de ingreso. Espera 15 minutos y vuelve a probar.' }),
  ingresoPorCorreo: limitarIntentos({ nombre: 'ingreso-correo', ventanaMs: 60 * MINUTO, maximo: 20, clave: correoDelCuerpo, mensaje: 'Esta cuenta tuvo demasiados intentos de ingreso. Espera un rato y vuelve a probar.' }),
  registro: limitarIntentos({ nombre: 'registro', ventanaMs: 60 * MINUTO, maximo: 5, mensaje: 'Ya creaste varias cuentas seguidas. Espera un rato y vuelve a probar.' }),
  formularioPublico: limitarIntentos({ nombre: 'formulario', ventanaMs: 10 * MINUTO, maximo: 8, mensaje: 'Enviaste muchos mensajes seguidos. Espera unos minutos y vuelve a probar.' }),
  pedido: limitarIntentos({ nombre: 'pedido', ventanaMs: 10 * MINUTO, maximo: 15 }),
  cupon: limitarIntentos({ nombre: 'cupon', ventanaMs: 10 * MINUTO, maximo: 20, mensaje: 'Probaste muchos códigos seguidos. Espera unos minutos.' }),
  carrito: limitarIntentos({ nombre: 'carrito', ventanaMs: MINUTO, maximo: 30 }),
}
