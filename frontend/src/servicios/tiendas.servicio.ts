import 'server-only'
import { pedirApi, ErrorApi } from './api'
import { normalizarBloques } from '@/tipos/bloques'
import type { Producto, ResenaPublica, Tienda } from '@/tipos/tienda'
import { ajustarAlPlan, temaAlPlan } from '@/utilidades/planes'

interface RespuestaTienda {
  tienda: Omit<Tienda, 'configuracionBloques' | 'tema' | 'ajustes'> & {
    configuracionBloques: unknown
    tema: unknown
    ajustes?: unknown
  }
  subdominio: string
}

/**
 * Carga la tienda servida en `host`. Devuelve null cuando no existe o no está
 * publicada, para que la página responda 404 en vez de reventar.
 */
export async function obtenerTienda(host: string): Promise<Tienda | null> {
  try {
    const { tienda } = await pedirApi<RespuestaTienda>('/api/tienda', {
      host,
      etiquetas: [`tienda:${host}`],
    })

    // La tienda pública sólo muestra lo que su plan incluye.
    const { ajustes, bloques } = ajustarAlPlan(
      tienda.plan,
      (tienda.ajustes ?? {}) as Tienda['ajustes'],
      normalizarBloques(tienda.configuracionBloques),
    )
    return {
      ...tienda,
      tema: temaAlPlan(tienda.plan, (tienda.tema ?? {}) as Tienda['tema']),
      ajustes,
      configuracionBloques: bloques,
    }
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return null
    throw error
  }
}

export async function listarProductos(host: string): Promise<Producto[]> {
  try {
    const { productos } = await pedirApi<{ productos: Producto[] }>('/api/productos', {
      host,
      etiquetas: [`productos:${host}`],
    })
    return productos
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return []
    throw error
  }
}

export async function obtenerProducto(host: string, slug: string): Promise<Producto | null> {
  try {
    const { producto } = await pedirApi<{ producto: Producto }>(
      `/api/productos/${encodeURIComponent(slug)}`,
      { host, etiquetas: [`producto:${host}:${slug}`] },
    )
    return producto
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return null
    throw error
  }
}

/** Opiniones aprobadas de un producto. Se refrescan con la ficha (misma etiqueta). */
export async function obtenerResenas(host: string, productoId: string, slug: string): Promise<ResenaPublica[]> {
  try {
    const { resenas } = await pedirApi<{ resenas: ResenaPublica[] }>(`/api/resenas?producto=${encodeURIComponent(productoId)}`, {
      host,
      etiquetas: [`producto:${host}:${slug}`],
    })
    return resenas
  } catch {
    return []
  }
}
