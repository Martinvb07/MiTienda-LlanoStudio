'use client'

/**
 * Eventos de compra para el pixel de Meta y Google Analytics de cada tienda.
 * Si la tienda no configuró ninguno, no hace nada. Los scripts los carga
 * <MedicionTienda> en el layout de la tienda.
 */

interface VentanaConMedicion {
  fbq?: (...argumentos: unknown[]) => void
  gtag?: (...argumentos: unknown[]) => void
}

export interface ArticuloMedido {
  id: string
  nombre: string
  precio: number
  cantidad: number
}

type Evento =
  | { tipo: 'ver-producto'; articulo: ArticuloMedido; moneda: string }
  | { tipo: 'agregar'; articulo: ArticuloMedido; moneda: string }
  | { tipo: 'iniciar-compra'; articulos: ArticuloMedido[]; total: number; moneda: string }
  | { tipo: 'compra'; articulos: ArticuloMedido[]; total: number; moneda: string; pedido: string }

const NOMBRES = {
  'ver-producto': { meta: 'ViewContent', google: 'view_item' },
  agregar: { meta: 'AddToCart', google: 'add_to_cart' },
  'iniciar-compra': { meta: 'InitiateCheckout', google: 'begin_checkout' },
  compra: { meta: 'Purchase', google: 'purchase' },
} as const

export function medir(evento: Evento): void {
  if (typeof window === 'undefined') return
  const { fbq, gtag } = window as VentanaConMedicion
  if (!fbq && !gtag) return

  const articulos = 'articulos' in evento ? evento.articulos : [evento.articulo]
  const valor = 'total' in evento ? evento.total : evento.articulo.precio * evento.articulo.cantidad
  const nombres = NOMBRES[evento.tipo]

  try {
    fbq?.('track', nombres.meta, {
      content_ids: articulos.map((articulo) => articulo.id),
      content_type: 'product',
      contents: articulos.map((articulo) => ({ id: articulo.id, quantity: articulo.cantidad })),
      value: valor,
      currency: evento.moneda,
    })
    gtag?.('event', nombres.google, {
      currency: evento.moneda,
      value: valor,
      ...(evento.tipo === 'compra' ? { transaction_id: evento.pedido } : {}),
      items: articulos.map((articulo) => ({ item_id: articulo.id, item_name: articulo.nombre, price: articulo.precio, quantity: articulo.cantidad })),
    })
  } catch {
    // Un script de terceros que falla no puede romper la compra.
  }
}
