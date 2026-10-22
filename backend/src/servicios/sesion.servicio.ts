import type { Request } from 'express'
import { prisma } from '../config/prisma.js'
import { noEncontrado } from '../utilidades/errores.js'
import { limitesDe } from '../utilidades/planes.js'

/** Tienda de quien tiene la sesión del panel. */
export async function tiendaDeLaSesion(req: Request): Promise<string> {
  const tienda = await prisma.tienda.findUnique({
    where: { tenantId: req.sesion!.tenantId },
    select: { id: true },
  })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene tienda')
  return tienda.id
}

export async function planDeLaSesion(req: Request) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.sesion!.tenantId }, select: { plan: true } })
  return limitesDe(tenant?.plan ?? 'GRATIS')
}
