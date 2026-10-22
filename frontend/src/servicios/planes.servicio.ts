import 'server-only'

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
export async function obtenerPlanes(): Promise<PlanPublico[]> {
  try {
    const respuesta = await fetch(`${URL_API}/api/planes`, { next: { revalidate: 60, tags: ['planes'] } })
    if (!respuesta.ok) return []
    return ((await respuesta.json()) as { planes: PlanPublico[] }).planes
  } catch {
    return []
  }
}
