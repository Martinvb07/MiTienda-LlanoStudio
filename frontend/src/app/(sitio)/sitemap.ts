import type { MetadataRoute } from 'next'
import { obtenerArticulos } from '@/servicios/contenido.servicio'

const BASE = 'https://misitio.llanostudio.co'

const PAGINAS = [
  '',
  '/caracteristicas',
  '/precios',
  '/precios/pagina',
  '/precios/enlaces',
  '/plantillas',
  '/plantillas/pagina',
  '/plantillas/enlaces',
  '/para-negocios',
  '/enlaces',
  '/blog',
  '/sobre-nosotros',
  '/contacto',
  '/terminos',
  '/privacidad',
]

export const revalidate = 3600

/** Mapa de la web de Mi Sitio con sus artículos del blog. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articulos = await obtenerArticulos()
  return [
    ...PAGINAS.map((ruta) => ({ url: `${BASE}${ruta}`, priority: ruta === '' ? 1 : 0.7 })),
    ...articulos.map((articulo) => ({ url: `${BASE}/blog/${articulo.slug}`, lastModified: articulo.fecha, priority: 0.6 })),
  ]
}
