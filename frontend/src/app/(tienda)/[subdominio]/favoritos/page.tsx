import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { categoriasDe } from '@/componentes/tienda/ListadoProductos'
import { ListaFavoritos } from '@/componentes/tienda/ListaFavoritos'
import { listarProductos, obtenerTienda } from '@/servicios/tiendas.servicio'
import { vendeEnLinea } from '@/utilidades/sitio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'

export const metadata: Metadata = { title: 'Mis favoritos', robots: { index: false } }

export default async function PaginaFavoritos({ params }: { params: Promise<{ subdominio: string }> }) {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)
  const [tienda, productos] = await Promise.all([obtenerTienda(host), listarProductos(host)])
  if (!tienda || !vendeEnLinea(tienda.tipo)) notFound()

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <ListaFavoritos productos={productos} moneda={tienda.moneda} categorias={categoriasDe(productos)} />
    </>
  )
}
