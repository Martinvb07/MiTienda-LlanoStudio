import type { Producto, ResenaPublica, Tienda } from '@/tipos/tienda'
import { generarSlug } from './formato'
import { hrefEnlace } from './enlacesBio'
import { vendeEnLinea } from './sitio'

/**
 * Datos estructurados (schema.org en JSON-LD). Le dicen a Google qué es cada
 * página: con ellos un producto puede salir en los resultados con su precio,
 * si hay stock y sus estrellas, y un negocio con su dirección y teléfono.
 */

type Json = Record<string, unknown>

const absoluta = (host: string, url: string) => (url.startsWith('http') ? url : `https://${host}${url.startsWith('/') ? '' : '/'}${url}`)

function redes(tienda: Tienda): string[] {
  return (['instagram', 'facebook', 'tiktok'] as const)
    .filter((red) => tienda.ajustes[red])
    .map((red) => hrefEnlace({ url: '', icono: red }, tienda.ajustes))
    .filter((url) => url.startsWith('http'))
}

/** El negocio: tienda en línea o negocio local, según lo que arma la cuenta. */
export function datosNegocio(tienda: Tienda, host: string): Json {
  const { ajustes } = tienda
  const sameAs = redes(tienda)
  return {
    '@context': 'https://schema.org',
    '@type': vendeEnLinea(tienda.tipo) ? (ajustes.direccion ? 'Store' : 'OnlineStore') : 'LocalBusiness',
    name: tienda.nombre,
    url: `https://${host}`,
    ...(tienda.descripcion ? { description: tienda.descripcion } : {}),
    ...(tienda.logoUrl ? { logo: absoluta(host, tienda.logoUrl), image: absoluta(host, tienda.logoUrl) } : {}),
    ...(ajustes.whatsapp ? { telephone: ajustes.whatsapp } : {}),
    ...(ajustes.correo ? { email: ajustes.correo } : {}),
    ...(ajustes.direccion ? { address: { '@type': 'PostalAddress', streetAddress: ajustes.direccion, addressCountry: 'CO' } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    currenciesAccepted: tienda.moneda,
  }
}

/** Un producto con su oferta y, si tiene, sus opiniones. */
export function datosProducto(producto: Producto, tienda: Tienda, host: string, resenas: ResenaPublica[] = []): Json[] {
  const url = `https://${host}/productos/${producto.slug}`
  const precios = producto.variantes?.length
    ? producto.variantes.map((variante) => Number(variante.precio ?? producto.precio))
    : [Number(producto.precio)]
  const disponibilidad = producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  const oferta =
    precios.length > 1 && Math.min(...precios) !== Math.max(...precios)
      ? { '@type': 'AggregateOffer', lowPrice: Math.min(...precios), highPrice: Math.max(...precios), offerCount: precios.length }
      : { '@type': 'Offer', price: precios[0] }

  const productoJson: Json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: producto.nombre,
    url,
    sku: producto.id,
    ...(producto.descripcion ? { description: producto.descripcion } : {}),
    ...(producto.fotos.length ? { image: producto.fotos.map((foto) => absoluta(host, foto)) } : {}),
    ...(producto.categoria ? { category: producto.categoria } : {}),
    brand: { '@type': 'Brand', name: tienda.nombre },
    offers: { ...oferta, priceCurrency: tienda.moneda, availability: disponibilidad, url, seller: { '@type': 'Organization', name: tienda.nombre } },
    ...(producto.resenas && producto.resenas.total > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: producto.resenas.promedio, reviewCount: producto.resenas.total, bestRating: 5, worstRating: 1 } }
      : {}),
    ...(resenas.length
      ? {
          review: resenas.slice(0, 5).map((resena) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: resena.nombre },
            reviewRating: { '@type': 'Rating', ratingValue: resena.estrellas, bestRating: 5 },
            reviewBody: resena.texto,
          })),
        }
      : {}),
  }

  const migas: Json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tienda.nombre, item: `https://${host}` },
      ...(producto.categoria
        ? [{ '@type': 'ListItem', position: 2, name: producto.categoria, item: `https://${host}/categoria/${generarSlug(producto.categoria)}` }]
        : []),
      { '@type': 'ListItem', position: producto.categoria ? 3 : 2, name: producto.nombre, item: url },
    ],
  }

  return [productoJson, migas]
}
