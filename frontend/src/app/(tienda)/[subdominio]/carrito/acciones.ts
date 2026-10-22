'use server'

import { headers } from 'next/headers'
import { revalidateTag } from 'next/cache'
import { enviarApi } from '@/servicios/api'
import { CABECERA_HOST } from '@/middleware'
import type { PedidoCreado, SolicitudPedido } from '@/tipos/pedidos'

export type ResultadoPedido =
  | { ok: true; pedido: PedidoCreado }
  | { ok: false; mensaje: string; campos: Record<string, string> }

/**
 * Crea el pedido en la API en nombre de la tienda que se está viendo. El Host
 * lo fija el middleware (no lo manda el navegador), así que un pedido sólo
 * puede ir a la tienda en la que se hizo.
 */
export async function crearPedido(solicitud: SolicitudPedido): Promise<ResultadoPedido> {
  const host = (await headers()).get(CABECERA_HOST)
  if (!host) return { ok: false, mensaje: 'No sabemos en qué tienda estás.', campos: {} }

  const respuesta = await enviarApi<{ pedido: PedidoCreado }>('/api/pedidos', solicitud, host)
  if (!respuesta.ok) return { ok: false, mensaje: respuesta.mensaje, campos: respuesta.campos }

  // El stock cambió: que el catálogo y las fichas no muestren lo ya vendido.
  revalidateTag(`productos:${host}`)
  for (const item of respuesta.datos.pedido.items) {
    if (item.slug) revalidateTag(`producto:${host}:${item.slug}`)
  }

  return { ok: true, pedido: respuesta.datos.pedido }
}
