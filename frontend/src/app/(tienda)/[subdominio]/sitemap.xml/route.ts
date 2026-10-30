import { listarProductos, obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { generarSlug } from '@/utilidades/formato'
import { paginasDe } from '@/utilidades/paginas'
import { vendeEnLinea } from '@/utilidades/sitio'
import { escaparXml, respuestaXml } from '@/utilidades/xml'

export const revalidate = 300

/**
 * Mapa del sitio de cada tienda (/sitemap.xml en su propio dominio). Le dice a
 * Google qué páginas existen, para que indexe cada producto sin depender de
 * encontrarlo navegando.
 */
export async function GET(_peticion: Request, { params }: { params: Promise<{ subdominio: string }> }) {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)
  const tienda = await obtenerTienda(host)
  if (!tienda) return new Response('No encontrado', { status: 404 })

  const base = `https://${host}`
  const urls: { ruta: string; prioridad: string }[] = [{ ruta: '/', prioridad: '1.0' }]

  for (const pagina of paginasDe(tienda)) urls.push({ ruta: `/${pagina.ruta}`, prioridad: '0.8' })

  if (vendeEnLinea(tienda.tipo)) {
    const productos = await listarProductos(host)
    const categorias = new Set(productos.map((producto) => producto.categoria).filter((categoria): categoria is string => Boolean(categoria)))
    for (const categoria of categorias) urls.push({ ruta: `/categoria/${generarSlug(categoria)}`, prioridad: '0.7' })
    for (const producto of productos) urls.push({ ruta: `/productos/${encodeURIComponent(producto.slug)}`, prioridad: producto.destacado ? '0.9' : '0.8' })
  }

  const cuerpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(({ ruta, prioridad }) => `  <url><loc>${escaparXml(base + ruta)}</loc><priority>${prioridad}</priority></url>`),
    '</urlset>',
  ].join('\n')

  return respuestaXml(cuerpo)
}
