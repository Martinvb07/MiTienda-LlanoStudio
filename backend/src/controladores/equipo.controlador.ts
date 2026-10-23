import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { planDeLaSesion } from '../servicios/sesion.servicio.js'
import { cifrarContrasena } from '../utilidades/contrasenas.js'
import { ErrorHttp, noAutorizado, noEncontrado, prohibido, solicitudInvalida } from '../utilidades/errores.js'
import { fueraDelPlan } from '../utilidades/planes.js'

type Rol = 'PROPIETARIO' | 'ADMINISTRADOR' | 'EDITOR'

/**
 * Como exigirRol, pero con el rol que tiene hoy en la base de datos y no el
 * que traía el token: si la dueña le quita permisos a alguien, rige al instante.
 */
export function exigirRolActual(...roles: Rol[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const usuario = await prisma.usuario.findFirst({
        where: { id: req.sesion!.usuarioId, tenantId: req.sesion!.tenantId, activo: true },
        select: { rol: true },
      })
      if (!usuario) throw noAutorizado('La sesión ya no es válida')
      if (!roles.includes(usuario.rol)) throw prohibido('Tu rol no tiene acceso a esta sección')
      next()
    } catch (error) {
      next(error)
    }
  }
}

const campos = { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAccesoEn: true, creadoEn: true } as const

export async function listarEquipo(req: Request, res: Response): Promise<void> {
  const usuarios = await prisma.usuario.findMany({
    where: { tenantId: req.sesion!.tenantId },
    select: campos,
    orderBy: { creadoEn: 'asc' },
  })
  res.json({ usuarios })
}

export const esquemaMiembro = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre').max(80),
  email: z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160),
  rol: z.enum(['ADMINISTRADOR', 'EDITOR']),
  contrasena: z.string().min(8, 'Tiene que tener al menos 8 caracteres').max(200),
})

/** Agrega a alguien al panel con una contraseña inicial que la dueña le comparte. */
export async function agregarMiembro(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.sesion!
  const datos = req.body as z.infer<typeof esquemaMiembro>
  const plan = await planDeLaSesion(req)

  const activos = await prisma.usuario.count({ where: { tenantId, activo: true } })
  if (activos >= plan.usuarios) {
    throw fueraDelPlan(
      plan.usuarios === 1
        ? `Tu plan ${plan.nombre} es para una sola persona`
        : `Tu plan ${plan.nombre} admite ${plan.usuarios} personas en el panel`,
    )
  }
  const existe = await prisma.usuario.findUnique({ where: { email: datos.email }, select: { id: true } })
  if (existe) {
    throw new ErrorHttp(409, 'Ese correo ya tiene una cuenta en Mi Sitio', 'CORREO_EN_USO', [
      { campo: 'email', mensaje: 'Ese correo ya tiene una cuenta en Mi Sitio' },
    ])
  }

  const usuario = await prisma.usuario.create({
    data: {
      tenantId,
      nombre: datos.nombre,
      email: datos.email,
      rol: datos.rol,
      contrasenaHash: await cifrarContrasena(datos.contrasena),
    },
    select: campos,
  })
  res.status(201).json({ usuario })
}

export const esquemaCambioMiembro = z.object({
  rol: z.enum(['ADMINISTRADOR', 'EDITOR']).optional(),
  activo: z.boolean().optional(),
})

async function miembroEditable(req: Request) {
  const id = req.params.id as string
  if (id === req.sesion!.usuarioId) throw solicitudInvalida('No puedes cambiar tu propio acceso')
  const miembro = await prisma.usuario.findFirst({ where: { id, tenantId: req.sesion!.tenantId }, select: { rol: true } })
  if (!miembro) throw noEncontrado('Esa persona no está en tu equipo')
  if (miembro.rol === 'PROPIETARIO') throw prohibido('La cuenta dueña de la tienda no se puede cambiar')
  return id
}

export async function cambiarMiembro(req: Request, res: Response): Promise<void> {
  const id = await miembroEditable(req)
  const datos = req.body as z.infer<typeof esquemaCambioMiembro>
  if (datos.activo) {
    const plan = await planDeLaSesion(req)
    const activos = await prisma.usuario.count({ where: { tenantId: req.sesion!.tenantId, activo: true, id: { not: id } } })
    if (activos >= plan.usuarios) throw fueraDelPlan(`Tu plan ${plan.nombre} admite ${plan.usuarios} personas en el panel`)
  }
  const usuario = await prisma.usuario.update({ where: { id }, data: datos, select: campos })
  res.json({ usuario })
}

export async function quitarMiembro(req: Request, res: Response): Promise<void> {
  const id = await miembroEditable(req)
  await prisma.usuario.delete({ where: { id } })
  res.status(204).end()
}
