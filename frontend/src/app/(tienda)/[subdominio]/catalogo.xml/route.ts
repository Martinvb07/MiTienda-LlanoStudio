import { listarProductos, obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { esMedioLocal } from '@/utilidades/medios'
import { vendeEnLinea } from '@/utilidades/sitio'
import { escaparXml, respuestaXml } from '@/utilidades/xml'

export const revalidate = 300

const precio = (valor: string) => `${Number(valor).toFixed(2)} COP`

/**
 * Catálogo de productos en el formato de Meta y Google Merchant (RSS con los
 * campos g:). El dueño pega https://sutienda/catalogo.xml en Commerce Manager
 * y sus productos quedan etiquetables en Instagram y Facebook, sincronizados
 * solos: cada vez que Meta lo vuelve a leer, ve precios y stock al día.
 */
export async function GET(_peticion: Request, { params }: { params: Promise<{ subdominio: string }> }) {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)
  const tienda = await obtenerTienda(host)
  if (!tienda || !vendeEnLinea(tienda.tipo)) return new Response('No encontrado', { status: 404 })

  const base = `https://${host}`
  const absoluta = (url: string) => (esMedioLocal(url) ? `${base}${url}` : url)
  const productos = (await listarProductos(host)).filter((producto) => producto.fotos.length > 0)

  const items = productos.map((producto) => {
    const conDescuento = producto.precioComparacion && Number(producto.precioComparacion) > Number(producto.precio)
    const campos = [
      ['g:id', producto.id],
      ['g:title', producto.nombre],
      ['g:description', producto.descripcion?.trim() || producto.nombre],
      ['g:link', `${base}/productos/${encodeURIComponent(producto.slug)}`],
      ['g:image_link', absoluta(producto.fotos[0]!)],
      ...producto.fotos.slice(1, 10).map((foto) => ['g:additional_image_link', absoluta(foto)]),
      ['g:availability', producto.stock > 0 ? 'in stock' : 'out of stock'],
      ['g:condition', 'new'],
      ['g:price', precio(conDescuento ? producto.precioComparacion! : producto.precio)],
      ...(conDescuento ? [['g:sale_price', precio(producto.precio)]] : []),
      ['g:brand', tienda.nombre],
      ...(producto.categoria ? [['g:product_type', producto.categoria]] : []),
      ['g:inventory', String(Math.max(0, producto.stock))],
    ]
    return `    <item>\n${campos.map(([etiqueta, valor]) => `      <${etiqueta}>${escaparXml(valor!)}</${etiqueta}>`).join('\n')}\n    </item>`
  })

  const cuerpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${escaparXml(tienda.nombre)}</title>`,
    `    <link>${base}</link>`,
    `    <description>${escaparXml(tienda.descripcion ?? `Catálogo de ${tienda.nombre}`)}</description>`,
    ...items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  return respuestaXml(cuerpo)
}
