import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { PantallaCompra } from '@/componentes/tienda/carrito/PantallaCompra'
import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { vendeEnLinea } from '@/utilidades/sitio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } }

export default async function PaginaCarrito({ params }: { params: Promise<{ subdominio: string }> }) {
  const { subdominio } = await params
  const tienda = await obtenerTienda(hostDesdeIdentificador(subdominio))
  // Una página informativa no vende: sin catálogo, carrito ni pagos.
  if (!tienda || !vendeEnLinea(tienda.tipo)) notFound()

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <PantallaCompra nombreTienda={tienda.nombre} />
    </>
  )
}
