import type { Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { noEncontrado } from '../utilidades/errores.js'
import { pasarelasActivas } from './pasarelas.controlador.js'

/**
 * Devuelve la configuración pública de la tienda del Host actual: es lo que
 * consume la parte (tienda) del frontend para renderizar los bloques.
 */
export async function obtenerTiendaPublica(req: Request, res: Response): Promise<void> {
  const contexto = req.tenant!

  const tienda = await prisma.tienda.findUnique({
    where: { id: contexto.tiendaId },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      logoUrl: true,
      faviconUrl: true,
      plantilla: true,
      tema: true,
      configuracionBloques: true,
      ajustes: true,
      moneda: true,
      publicada: true,
    },
  })

  if (!tienda || !tienda.publicada) {
    throw noEncontrado('Esta tienda todavía no está publicada')
  }

  // El plan viaja con la tienda: la marca del pie depende de él.
  // Las pasarelas conectadas viajan con los ajustes: el checkout ofrece pagar en línea.
  const pagosEnLinea = await pasarelasActivas(tienda.id)
  res.json({
    tienda: { ...tienda, ajustes: { ...(tienda.ajustes as object), pagosEnLinea }, plan: contexto.plan },
    subdominio: contexto.subdominio,
  })
}
