import 'server-only'
import type { TipoSitio } from '@/tipos/tienda'

export interface PlanPublico {
  plan: 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'
  nombre: string
  precio: number
  precioAnual: number
  resumen: string
  incluye: string[]
  destacado: boolean
}

const URL_API = process.env.URL_API ?? 'http://localhost:4000'

/**
 * Oferta de planes que edita el admin. Si la API no responde (por ejemplo,
 * durante el build), la página de precios no se rompe: queda sin planes y se
 * vuelve a intentar al minuto.
 */
export async function obtenerPlanes(tipo: TipoSitio = 'tienda'): Promise<PlanPublico[]> {
  try {
    const respuesta = await fetch(`${URL_API}/api/planes?tipo=${tipo}`, { next: { revalidate: 60, tags: ['planes'] } })
    if (!respuesta.ok) return []
    const datos = (await respuesta.json()) as { tipo?: TipoSitio; planes: PlanPublico[] }
    // Una API vieja que no conoce el producto contesta con los precios de la
    // tienda: mejor sin planes un minuto que con los precios de otro producto.
    if ((datos.tipo ?? 'tienda') !== tipo) return []
    return datos.planes
  } catch {
    return []
  }
}
