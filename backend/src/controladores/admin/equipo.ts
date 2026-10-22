import type { Request, Response } from 'express'
import { z } from 'zod'
import { entorno } from '../../config/entorno.js'
import { prisma } from '../../config/prisma.js'
import { cifrarContrasena, verificarContrasena } from '../../utilidades/contrasenas.js'
import { ErrorHttp, noEncontrado } from '../../utilidades/errores.js'
import { firmarAdmin, registrarActividad } from '../../servicios/admins.servicio.js'

const ROL = z.enum(['DUENO', 'SOPORTE', 'LECTURA'])
const CLAVE = z.string().min(10, 'Mínimo 10 caracteres').max(200)

export const esquemaMiContrasena = z.object({ actual: z.string().min(1).max(200), nueva: CLAVE })
export const esquemaNuevoAdmin = z.object({
  nombre: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  rol: ROL,
  contrasena: CLAVE,
})
export const esquemaCambioAdmin = z.object({
  nombre: z.string().trim().min(1).max(80).optional(),
  rol: ROL.optional(),
  activo: z.boolean().optional(),
  contrasena: CLAVE.optional(),
})

const CAMPOS = { id: true, email: true, nombre: true, rol: true, activo: true, ultimoAccesoEn: true, creadoEn: true } as const

export function yo(req: Request, res: Response): void {
  res.json({ admin: req.admin })
}

/**
 * Cambia la contraseña de quien está conectado. Si es el dueño del .env y aún
 * no tiene fila, se le crea una: desde entonces manda la de la base de datos.
 */
export async function cambiarMiContrasena(req: Request, res: Response): Promise<void> {
  const { actual, nueva } = req.body as z.infer<typeof esquemaMiContrasena>
  const sesion = req.admin!
  const fila = await prisma.adminPlataforma.findUnique({ where: { email: sesion.email } })
  const valida = fila
    ? await verificarContrasena(actual, fila.contrasenaHash)
    : sesion.email === entorno.ADMIN_CORREO.toLowerCase() && (await verificarContrasena(actual, entorno.ADMIN_CONTRASENA_HASH))
  if (!valida) {
    throw new ErrorHttp(400, 'La contraseña actual no es correcta', 'CONTRASENA_INCORRECTA', [
      { campo: 'actual', mensaje: 'La contraseña actual no es correcta' },
    ])
  }
  const contrasenaHash = await cifrarContrasena(nueva)
  await prisma.adminPlataforma.upsert({
    where: { email: sesion.email },
    create: { email: sesion.email, nombre: sesion.nombre, rol: sesion.rol, contrasenaHash },
    update: { contrasenaHash },
  })
  registrarActividad(req, 'Cambió su contraseña')
  res.json({ token: firmarAdmin(sesion) })
}

export async function listarAdmins(_req: Request, res: Response): Promise<void> {
  const admins = await prisma.adminPlataforma.findMany({ select: CAMPOS, orderBy: { creadoEn: 'asc' } })
  const delEntorno = entorno.ADMIN_CORREO.toLowerCase()
  res.json({
    admins,
    // El dueño del .env, si nunca se guardó en la tabla.
    delEntorno: delEntorno && !admins.some((admin) => admin.email === delEntorno) ? delEntorno : null,
  })
}

export async function crearAdmin(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaNuevoAdmin>
  const existe = await prisma.adminPlataforma.findUnique({ where: { email: datos.email }, select: { id: true } })
  if (existe) {
    throw new ErrorHttp(409, 'Ya hay un admin con ese correo', 'CORREO_EN_USO', [
      { campo: 'email', mensaje: 'Ya hay un admin con ese correo' },
    ])
  }
  const admin = await prisma.adminPlataforma.create({
    data: { nombre: datos.nombre, email: datos.email, rol: datos.rol, contrasenaHash: await cifrarContrasena(datos.contrasena) },
    select: CAMPOS,
  })
  registrarActividad(req, 'Agregó un admin', `${admin.email} (${admin.rol})`)
  res.status(201).json({ admin })
}

export async function cambiarAdmin(req: Request, res: Response): Promise<void> {
  const { contrasena, ...datos } = req.body as z.infer<typeof esquemaCambioAdmin>
  const id = req.params.id as string
  const fila = await prisma.adminPlataforma.findUnique({ where: { id } })
  if (!fila) throw noEncontrado('Ese admin no existe')
  if (fila.email === req.admin!.email && (datos.activo === false || (datos.rol && datos.rol !== 'DUENO'))) {
    throw new ErrorHttp(400, 'No puedes quitarte tus propios permisos', 'PROPIO')
  }
  const admin = await prisma.adminPlataforma.update({
    where: { id },
    data: { ...datos, ...(contrasena ? { contrasenaHash: await cifrarContrasena(contrasena) } : {}) },
    select: CAMPOS,
  })
  registrarActividad(req, 'Cambió un admin', admin.email)
  res.json({ admin })
}

export const esquemaFiltroActividad = z.object({ tenantId: z.string().max(40).optional() })

export async function listarActividad(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.query as z.infer<typeof esquemaFiltroActividad>
  const actividad = await prisma.actividadAdmin.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { creadoEn: 'desc' },
    take: 200,
  })
  const ids = [...new Set(actividad.map((fila) => fila.tenantId).filter(Boolean))] as string[]
  const tiendas = await prisma.tenant.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } })
  const nombres = new Map(tiendas.map((tienda) => [tienda.id, tienda.nombre]))
  res.json({ actividad: actividad.map((fila) => ({ ...fila, tienda: fila.tenantId ? (nombres.get(fila.tenantId) ?? null) : null })) })
}
