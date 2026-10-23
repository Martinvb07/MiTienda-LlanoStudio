import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { verificarContrasena } from '../utilidades/contrasenas.js'
import { noAutorizado, prohibido } from '../utilidades/errores.js'
import { registro } from '../utilidades/registro.js'

/**
 * Admins de la plataforma. Hay dos fuentes: la tabla admins_plataforma y el
 * correo del .env (ADMIN_CORREO), que entra como dueño. Si el correo del .env
 * también está en la tabla, manda la tabla: así el dueño puede cambiar su
 * contraseña desde el panel sin tocar el servidor.
 */

export type RolAdmin = 'DUENO' | 'SOPORTE' | 'LECTURA'

export interface SesionAdmin {
  email: string
  nombre: string
  rol: RolAdmin
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Admin de la plataforma, presente tras `exigirAdmin`. */
    admin?: SesionAdmin
  }
}

export function firmarAdmin(sesion: SesionAdmin) {
  return jwt.sign({ admin: true, ...sesion }, entorno.JWT_SECRETO, { expiresIn: '12h' })
}

/** Token de admin si las credenciales son de un admin; si no, null. */
export async function tokenSiEsAdmin(email: string, contrasena: string): Promise<string | null> {
  const correo = email.trim().toLowerCase()
  const fila = await prisma.adminPlataforma.findUnique({ where: { email: correo } })

  if (fila) {
    if (!fila.activo || !(await verificarContrasena(contrasena, fila.contrasenaHash))) return null
    await prisma.adminPlataforma.update({ where: { id: fila.id }, data: { ultimoAccesoEn: new Date() } })
    return firmarAdmin({ email: fila.email, nombre: fila.nombre, rol: fila.rol })
  }

  const delEntorno =
    Boolean(entorno.ADMIN_CORREO && entorno.ADMIN_CONTRASENA_HASH) &&
    correo === entorno.ADMIN_CORREO.toLowerCase() &&
    (await verificarContrasena(contrasena, entorno.ADMIN_CONTRASENA_HASH))
  return delEntorno ? firmarAdmin({ email: correo, nombre: 'Equipo Mi Sitio', rol: 'DUENO' }) : null
}

/** Lee el token de admin. También lo usa el chat de soporte para los asesores. */
export function leerSesionAdmin(token: string | undefined | null): SesionAdmin | null {
  if (!token) return null
  try {
    const carga = jwt.verify(token, entorno.JWT_SECRETO) as Partial<SesionAdmin> & { admin?: boolean }
    if (carga.admin !== true || !carga.email) return null
    return { email: carga.email, nombre: carga.nombre ?? carga.email, rol: carga.rol ?? 'DUENO' }
  } catch {
    return null
  }
}

export function exigirAdmin(req: Request, _res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization
  const sesion = leerSesionAdmin(cabecera?.startsWith('Bearer ') ? cabecera.slice(7).trim() : null)
  if (!sesion) {
    next(noAutorizado('Sesión de administrador inválida o vencida'))
    return
  }
  req.admin = sesion
  next()
}

/** Restringe a ciertos roles. El dueño pasa siempre. */
export function exigirRolAdmin(...roles: RolAdmin[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const rol = req.admin?.rol
    if (rol === 'DUENO' || (rol && roles.includes(rol))) next()
    else next(prohibido('Tu rol no tiene acceso a esta sección'))
  }
}

/** Escritura: todo menos los de sólo lectura. */
export const puedeEscribir = exigirRolAdmin('SOPORTE')
export const soloDueno = exigirRolAdmin()

/** Deja constancia de lo que hizo un admin. Nunca rompe la petición. */
export function registrarActividad(req: Request, accion: string, detalle?: string, tenantId?: string) {
  prisma.actividadAdmin
    .create({ data: { admin: req.admin?.email ?? 'sistema', accion, detalle, tenantId } })
    .catch((error: unknown) => registro.warn({ err: error }, 'No se pudo registrar la actividad'))
}
