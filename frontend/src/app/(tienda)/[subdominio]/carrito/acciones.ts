'use server'

import { headers } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { enviarApi } from '@/servicios/api'
import { CABECERA_HOST } from '@/middleware'
import type { CheckoutPago, EstadoPagoTienda, PedidoCreado, SolicitudPedido } from '@/tipos/pedidos'

export type ResultadoPedido =
  | { ok: true; pedido: PedidoCreado; checkout: CheckoutPago | null }
  | { ok: false; mensaje: string; campos: Record<string, string> }

/**
 * Crea el pedido en la API en nombre de la tienda que se está viendo. El Host
 * lo fija el middleware (no lo manda el navegador), así que un pedido sólo
 * puede ir a la tienda en la que se hizo.
 */
export interface CuponAplicado {
  codigo: string
  descuento: number
  envioGratis: boolean
  descripcion: string
}

/** Revisa un código de descuento antes de confirmar (el pedido lo vuelve a validar). */
export async function validarCupon(
  codigo: string,
  subtotal: number,
): Promise<{ ok: true; cupon: CuponAplicado } | { ok: false; mensaje: string }> {
  const host = (await headers()).get(CABECERA_HOST)
  if (!host) return { ok: false, mensaje: 'No sabemos en qué tienda estás.' }
  const respuesta = await enviarApi<{ cupon: CuponAplicado }>('/api/pedidos/cupon', { codigo, subtotal }, host)
  return respuesta.ok
    ? { ok: true, cupon: respuesta.datos.cupon }
    : { ok: false, mensaje: respuesta.campos.cupon ?? respuesta.mensaje }
}

export async function crearPedido(solicitud: SolicitudPedido): Promise<ResultadoPedido> {
  const host = (await headers()).get(CABECERA_HOST)
  if (!host) return { ok: false, mensaje: 'No sabemos en qué tienda estás.', campos: {} }

  const respuesta = await enviarApi<{ pedido: PedidoCreado; checkout: CheckoutPago | null }>('/api/pedidos', solicitud, host)
  if (!respuesta.ok) return { ok: false, mensaje: respuesta.mensaje, campos: respuesta.campos }

  // El stock cambió: que el catálogo y las fichas no muestren lo ya vendido.
  revalidateTag(`productos:${host}`)
  for (const item of respuesta.datos.pedido.items) {
    if (item.slug) revalidateTag(`producto:${host}:${item.slug}`)
  }

  return { ok: true, pedido: respuesta.datos.pedido, checkout: respuesta.datos.checkout ?? null }
}

/**
 * Cómo quedó el pago al volver de la pasarela. `idExterno` es el id que la
 * pasarela pone en la URL de regreso (Wompi ?id=, ePayco ?ref_payco=).
 */
export async function consultarPago(referencia: string, idExterno?: string): Promise<EstadoPagoTienda | null> {
  const host = (await headers()).get(CABECERA_HOST)
  if (!host) return null
  const parametros = new URLSearchParams(idExterno ? { id: idExterno, ref_payco: idExterno } : {})
  try {
    const respuesta = await fetch(
      `${process.env.URL_API ?? 'http://localhost:4000'}/api/pedidos/pagos/${encodeURIComponent(referencia)}?${parametros}`,
      {
        headers: {
          accept: 'application/json',
          'x-mitienda-host': host,
          ...(process.env.MITIENDA_TOKEN_INTERNO ? { 'x-mitienda-interno': process.env.MITIENDA_TOKEN_INTERNO } : {}),
        },
        cache: 'no-store',
      },
    )
    if (!respuesta.ok) return null
    return ((await respuesta.json()) as { pago: EstadoPagoTienda }).pago
  } catch {
    return null
  }
}
