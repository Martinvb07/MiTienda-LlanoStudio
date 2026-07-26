import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { entorno } from '../config/entorno.js'
import { noAutorizado, prohibido } from '../utilidades/errores.js'

export interface SesionPanel {
  usuarioId: string
  tenantId: string
  email: string
  rol: 'PROPIETARIO' | 'ADMINISTRADOR' | 'EDITOR'
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Sesión del panel, presente sólo tras pasar por `exigirSesion`. */
    sesion?: SesionPanel
  }
}

function leerToken(req: Request): string | null {
  const cabecera = req.headers.authorization
  if (cabecera?.startsWith('Bearer ')) return cabecera.slice(7).trim()
  return null
}

/**
 * Verifica el JWT del panel y deja la sesión en `req.sesion`.
 *
 * El emisor del token (login, registro, refresco) todavía no está implementado
 * — llega con NextAuth/Auth.js en la fase del panel. Aquí sólo se valida.
 */
export function exigirSesion(req: Request, _res: Response, next: NextFunction): void {
  const token = leerToken(req)
  if (!token) {
    next(noAutorizado('Falta el token de sesión'))
    return
  }

  try {
    const carga = jwt.verify(token, entorno.JWT_SECRETO) as Partial<SesionPanel>
    if (!carga.usuarioId || !carga.tenantId) {
      next(noAutorizado('Token de sesión incompleto'))
      return
    }

    req.sesion = {
      usuarioId: carga.usuarioId,
      tenantId: carga.tenantId,
      email: carga.email ?? '',
      rol: carga.rol ?? 'EDITOR',
    }
    next()
  } catch {
    next(noAutorizado('Token de sesión inválido o vencido'))
  }
}

/** Restringe una ruta del panel a ciertos roles. */
export function exigirRol(...roles: SesionPanel['rol'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.sesion) {
      next(noAutorizado())
      return
    }
    if (!roles.includes(req.sesion.rol)) {
      next(prohibido(`Requiere uno de estos roles: ${roles.join(', ')}`))
      return
    }
    next()
  }
}

/**
 * Barrera de aislamiento multi-tenant: impide que una sesión toque datos de
 * otro tenant. Úsalo en cuanto una ruta del panel reciba un tenantId por
 * parámetro o por cuerpo.
 */
export function exigirMismoTenant(tenantIdObjetivo: string, req: Request): void {
  if (!req.sesion) throw noAutorizado()
  if (req.sesion.tenantId !== tenantIdObjetivo) {
    throw prohibido('El recurso pertenece a otro tenant')
  }
}
