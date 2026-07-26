import type { NextFunction, Request, Response } from 'express'
import { entorno } from '../config/entorno.js'
import { clasificarHost, type ClasificacionHost } from '../utilidades/dominios.js'
import { noEncontrado } from '../utilidades/errores.js'
import {
  buscarPorDominioPropio,
  buscarPorSubdominio,
  type ContextoTenant,
} from '../servicios/tenants.servicio.js'

declare module 'express-serve-static-core' {
  interface Request {
    /** Cómo se clasificó el Host de esta petición. */
    trafico?: ClasificacionHost
    /** Tenant resuelto. Ausente en peticiones del panel (ahí manda el JWT). */
    tenant?: ContextoTenant
  }
}

/**
 * Resuelve a qué tenant pertenece cada petición leyendo el header Host.
 *
 *   mitienda.llanostudio.co   -> panel de administración (sin tenant fijo)
 *   <tienda>.llanostudio.co   -> se busca la Tienda por subdominio
 *   cualquier otro dominio    -> se busca en la tabla de dominios propios
 *
 * Deja el resultado en `req.tenant` y `req.trafico`. No decide permisos: de eso
 * se encarga `autenticacion`.
 */
/**
 * Host a efectos de resolución.
 *
 * Normalmente es el header Host. La excepción es el renderizado en servidor de
 * Next: al llamar servidor a servidor, su Host es el de la API y no el de la
 * tienda, así que puede indicar el original en `x-mitienda-host`. Sólo se le
 * hace caso si acompaña el token interno; de lo contrario cualquiera podría
 * pedir los datos de la tienda que quisiera.
 */
function hostDeLaPeticion(req: Request): string | undefined {
  const anulacion = req.headers['x-mitienda-host']
  const token = req.headers['x-mitienda-interno']

  if (
    entorno.TOKEN_INTERNO &&
    typeof anulacion === 'string' &&
    anulacion.length > 0 &&
    token === entorno.TOKEN_INTERNO
  ) {
    return anulacion
  }

  return req.headers.host
}

export async function resolverTenant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const clasificacion = clasificarHost(hostDeLaPeticion(req), {
    dominioBase: entorno.DOMINIO_BASE,
    subdominioPanel: entorno.SUBDOMINIO_PANEL,
  })

  req.trafico = clasificacion

  switch (clasificacion.tipo) {
    case 'sitio':
    case 'panel':
      // Ni la web comercial ni el panel están atados a un tenant concreto:
      // en el panel, cuál se toca lo dice el token de sesión.
      next()
      return

    case 'tienda': {
      const contexto = await buscarPorSubdominio(clasificacion.subdominio!)
      if (!contexto) {
        next(noEncontrado(`No existe ninguna tienda en "${clasificacion.host}"`))
        return
      }
      req.tenant = contexto
      next()
      return
    }

    case 'dominio-propio': {
      const contexto = await buscarPorDominioPropio(clasificacion.dominio!)
      if (!contexto) {
        next(noEncontrado(`El dominio "${clasificacion.host}" no está conectado a ninguna tienda`))
        return
      }
      req.tenant = contexto
      next()
      return
    }

    default:
      next(noEncontrado(`Host no reconocido: "${clasificacion.host}"`))
  }
}

/**
 * Para rutas que sólo tienen sentido sobre una tienda concreta. Corta la
 * petición si `resolverTenant` no pudo determinar el tenant.
 */
export function exigirTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.tenant) {
    next(noEncontrado('Esta ruta debe consultarse desde el dominio de una tienda'))
    return
  }
  next()
}
