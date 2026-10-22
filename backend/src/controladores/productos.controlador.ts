import type { Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { noEncontrado } from '../utilidades/errores.js'

/**
 * Los importes viajan como texto: Decimal no cabe siempre en un número de
 * JavaScript y no queremos redondeos silenciosos en precios.
 */
function serializarProducto(producto: {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  precio: { toString(): string }
  precioComparacion: { toString(): string } | null
  stock: number
  fotos: string[]
  categoria: string | null
  presentacion: string | null
}) {
  return {
    ...producto,
    precio: producto.precio.toString(),
    precioComparacion: producto.precioComparacion?.toString() ?? null,
  }
}

const camposPublicos = {
  id: true,
  nombre: true,
  slug: true,
  descripcion: true,
  precio: true,
  precioComparacion: true,
  stock: true,
  fotos: true,
  categoria: true,
  presentacion: true,
} as const

/** Catálogo público de la tienda del Host actual. */
export async function listarProductosPublicos(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!

  const productos = await prisma.producto.findMany({
    where: { tiendaId, activo: true },
    select: camposPublicos,
    orderBy: { creadoEn: 'desc' },
    take: 200,
  })

  res.json({ productos: productos.map(serializarProducto) })
}

/** Ficha pública de un producto por slug. */
export async function obtenerProductoPublico(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const slug = req.params.slug as string

  const producto = await prisma.producto.findFirst({
    where: { tiendaId, slug, activo: true },
    select: camposPublicos,
  })

  if (!producto) throw noEncontrado(`No existe el producto "${slug}"`)

  res.json({ producto: serializarProducto(producto) })
}
