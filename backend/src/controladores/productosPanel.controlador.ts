import type { Request, Response } from 'express'
import type { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { ErrorHttp, noEncontrado } from '../utilidades/errores.js'
import type { limitesDe } from '../utilidades/planes.js';
import { fueraDelPlan } from '../utilidades/planes.js'
import type { esquemaProducto } from './panel.esquemas.js';
import { conStockDeVariantes } from './panel.esquemas.js'
import { planDeLaSesion, tiendaDeLaSesion } from './tiendaPanel.controlador.js'

/** Productos de la tienda desde el panel. */

const camposProducto = {
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
  activo: true,
  destacado: true,
  opciones: true,
  variantes: true,
  actualizadoEn: true,
} as const

type ProductoBd = {
  precio: { toString(): string }
  precioComparacion: { toString(): string } | null
}

function serializar<T extends ProductoBd>(producto: T) {
  return {
    ...producto,
    precio: producto.precio.toString(),
    precioComparacion: producto.precioComparacion?.toString() ?? null,
  }
}

export async function listarProductosPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const productos = await prisma.producto.findMany({
    where: { tiendaId },
    select: camposProducto,
    orderBy: [{ destacado: 'desc' }, { creadoEn: 'desc' }],
  })
  res.json({ productos: productos.map(serializar) })
}

async function slugLibre(tiendaId: string, slug: string, excepto?: string): Promise<void> {
  const existente = await prisma.producto.findFirst({
    where: { tiendaId, slug, ...(excepto ? { id: { not: excepto } } : {}) },
    select: { id: true },
  })
  if (existente) {
    throw new ErrorHttp(409, 'Ya tienes un producto con esa dirección', 'SLUG_EN_USO', [
      { campo: 'slug', mensaje: 'Ya tienes un producto con esa dirección' },
    ])
  }
}

function revisarVariantes(datos: z.infer<typeof esquemaProducto>, plan: ReturnType<typeof limitesDe>) {
  const usadas = datos.opciones?.length ?? 0
  if (usadas > plan.opcionesVariantes) {
    throw fueraDelPlan(
      plan.opcionesVariantes === 0
        ? `Las variantes (tallas, colores…) no están incluidas en tu plan ${plan.nombre}`
        : `Tu plan ${plan.nombre} admite ${plan.opcionesVariantes} ${plan.opcionesVariantes === 1 ? 'opción' : 'opciones'} de variante por producto`,
    )
  }
}

function revisarFotos(fotos: string[], plan: ReturnType<typeof limitesDe>) {
  if (fotos.length > plan.fotosPorProducto) {
    throw fueraDelPlan(`Tu plan ${plan.nombre} admite hasta ${plan.fotosPorProducto} fotos por producto`)
  }
}

export async function crearProductoPanel(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaProducto>
  const [tiendaId, plan] = await Promise.all([tiendaDeLaSesion(req), planDeLaSesion(req)])
  revisarFotos(datos.fotos, plan)
  revisarVariantes(datos, plan)
  if (plan.productos !== null) {
    const total = await prisma.producto.count({ where: { tiendaId } })
    if (total >= plan.productos) {
      throw fueraDelPlan(`Tu plan ${plan.nombre} admite hasta ${plan.productos} productos`)
    }
  }
  await slugLibre(tiendaId, datos.slug)

  const producto = await prisma.producto.create({
    data: {
      ...conStockDeVariantes(datos),
      categoria: datos.categoria || null,
      presentacion: datos.presentacion || null,
      tiendaId,
    },
    select: camposProducto,
  })
  res.status(201).json({ producto: serializar(producto) })
}

/** Busca el producto dentro de la tienda de la sesión: un id ajeno da 404. */
async function productoPropio(req: Request) {
  const tiendaId = await tiendaDeLaSesion(req)
  const id = req.params.id as string
  const producto = await prisma.producto.findFirst({ where: { id, tiendaId }, select: { id: true } })
  if (!producto) throw noEncontrado('Ese producto no existe')
  return { tiendaId, id }
}

export async function actualizarProductoPanel(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaProducto>
  const { tiendaId, id } = await productoPropio(req)
  const plan = await planDeLaSesion(req)
  revisarFotos(datos.fotos, plan)
  revisarVariantes(datos, plan)
  await slugLibre(tiendaId, datos.slug, id)

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      ...conStockDeVariantes(datos),
      categoria: datos.categoria || null,
      presentacion: datos.presentacion || null,
    },
    select: camposProducto,
  })
  res.json({ producto: serializar(producto) })
}

export async function eliminarProductoPanel(req: Request, res: Response): Promise<void> {
  const { id } = await productoPropio(req)
  await prisma.producto.delete({ where: { id } })
  res.status(204).end()
}
