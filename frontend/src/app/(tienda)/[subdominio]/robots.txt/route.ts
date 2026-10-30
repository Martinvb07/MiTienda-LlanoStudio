import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'

export const revalidate = 300

/** robots.txt de cada tienda: indexa el catálogo, no el carrito ni el pago. */
export async function GET(_peticion: Request, { params }: { params: Promise<{ subdominio: string }> }) {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)
  const tienda = await obtenerTienda(host)

  const lineas = tienda
    ? ['User-agent: *', 'Allow: /', 'Disallow: /carrito', 'Disallow: /pago', 'Disallow: /buscar', 'Disallow: /cita/', '', `Sitemap: https://${host}/sitemap.xml`]
    : ['User-agent: *', 'Disallow: /']

  return new Response(`${lineas.join('\n')}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=300' },
  })
}
