import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { SeguimientoPedido } from '@/componentes/tienda/SeguimientoPedido'
import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { verPedido } from '../../acciones-sitio'

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false } }
export const dynamic = 'force-dynamic'

/** A donde llevan los correos del pedido: cómo va, con la guía cuando ya salió. */
export default async function PaginaPedido({ params }: { params: Promise<{ subdominio: string; codigo: string }> }) {
  const { subdominio, codigo } = await params
  const [tienda, pedido] = await Promise.all([obtenerTienda(hostDesdeIdentificador(subdominio)), verPedido(codigo)])
  if (!tienda || !pedido) notFound()

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <SeguimientoPedido pedido={pedido} moneda={tienda.moneda} tienda={tienda.nombre} whatsapp={tienda.ajustes.whatsapp} />
    </>
  )
}
