import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { planDeLaSesion, tiendaDeLaSesion } from '../servicios/sesion.servicio.js'
import { solicitudInvalida } from '../utilidades/errores.js'
import { fueraDelPlan } from '../utilidades/planes.js'

// ─────────────────────────────────────────────────────────────────────────────
// Acciones en grupo
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaLote = z.object({
  ids: z.array(z.string().min(1).max(40)).min(1).max(500),
  accion: z.enum(['mostrar', 'ocultar', 'destacar', 'quitar-destacado', 'categoria', 'eliminar']),
  categoria: z.string().trim().max(60).nullable().optional(),
})

/** Lo mismo a varios productos a la vez, siempre dentro de la tienda de la sesión. */
export async function loteProductos(req: Request, res: Response): Promise<void> {
  const [tiendaId, plan] = await Promise.all([tiendaDeLaSesion(req), planDeLaSesion(req)])
  if (!plan.accionesLote) throw fueraDelPlan(`Las acciones en grupo no están incluidas en tu plan ${plan.nombre}`)
  const { ids, accion, categoria } = req.body as z.infer<typeof esquemaLote>
  const donde = { tiendaId, id: { in: ids } }

  const { count } =
    accion === 'eliminar'
      ? await prisma.producto.deleteMany({ where: donde })
      : await prisma.producto.updateMany({
          where: donde,
          data:
            accion === 'mostrar'
              ? { activo: true }
              : accion === 'ocultar'
                ? { activo: false }
                : accion === 'destacar'
                  ? { destacado: true }
                  : accion === 'quitar-destacado'
                    ? { destacado: false }
                    : { categoria: categoria || null },
        })

  res.json({ afectados: count })
}

// ─────────────────────────────────────────────────────────────────────────────
// Importar
// ─────────────────────────────────────────────────────────────────────────────

const precio = z.coerce.number().min(0).max(9_999_999_999)

export const esquemaImportar = z.object({
  productos: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(120),
        precio,
        precioComparacion: precio.nullable().optional(),
        stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
        categoria: z.string().trim().max(60).nullable().optional(),
        presentacion: z.string().trim().max(60).nullable().optional(),
        descripcion: z.string().trim().max(4000).nullable().optional(),
        fotos: z.array(z.string().trim().url().max(600)).max(10).default([]),
      }),
    )
    .min(1)
    .max(1000),
})

function slugDe(texto: string) {
  return (
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'producto'
  )
}

/**
 * Crea muchos productos de una hoja de cálculo. Respeta el límite del plan y
 * genera direcciones únicas: "gorra", "gorra-2", "gorra-3"…
 */
export async function importarProductos(req: Request, res: Response): Promise<void> {
  const [tiendaId, plan] = await Promise.all([tiendaDeLaSesion(req), planDeLaSesion(req)])
  const { productos } = req.body as z.infer<typeof esquemaImportar>
  if (!plan.importarProductos) throw fueraDelPlan(`Importar productos no está incluido en tu plan ${plan.nombre}`)

  const existentes = await prisma.producto.findMany({ where: { tiendaId }, select: { slug: true } })
  if (plan.productos !== null && existentes.length + productos.length > plan.productos) {
    throw fueraDelPlan(
      `Tu plan ${plan.nombre} admite hasta ${plan.productos} productos y ya tienes ${existentes.length}. Puedes importar ${Math.max(0, plan.productos - existentes.length)} más.`,
    )
  }
  const demasiadasFotos = productos.find((producto) => producto.fotos.length > plan.fotosPorProducto)
  if (demasiadasFotos) {
    throw solicitudInvalida(`"${demasiadasFotos.nombre}" trae más de ${plan.fotosPorProducto} fotos, el máximo de tu plan`)
  }

  const usados = new Set(existentes.map((producto) => producto.slug))
  const datos = productos.map((producto) => {
    const base = slugDe(producto.nombre)
    let slug = base
    for (let numero = 2; usados.has(slug); numero++) slug = `${base}-${numero}`
    usados.add(slug)
    return {
      ...producto,
      slug,
      tiendaId,
      categoria: producto.categoria || null,
      presentacion: producto.presentacion || null,
      descripcion: producto.descripcion || null,
      precioComparacion: producto.precioComparacion || null,
    }
  })

  const { count } = await prisma.producto.createMany({ data: datos })
  res.status(201).json({ creados: count })
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaCategoria = z.object({
  de: z.string().trim().min(1).max(60),
  /** Nombre nuevo; null quita la categoría de esos productos. */
  a: z.string().trim().max(60).nullable(),
})

/** Renombra (o junta con otra, o quita) una categoría en todos sus productos. */
export async function renombrarCategoria(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const { de, a } = req.body as z.infer<typeof esquemaCategoria>
  const { count } = await prisma.producto.updateMany({
    where: { tiendaId, categoria: de },
    data: { categoria: a || null },
  })
  res.json({ afectados: count })
}
