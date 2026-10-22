import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { obtenerProducto, obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { FichaProducto } from '@/componentes/tienda/FichaProducto'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'

export const revalidate = 60

interface Props {
  params: Promise<{ subdominio: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdominio, slug } = await params
  const host = hostDesdeIdentificador(subdominio)
  const producto = await obtenerProducto(host, slug)

  if (!producto) return { title: 'Producto no encontrado', robots: { index: false } }

  return {
    title: producto.nombre,
    description: producto.descripcion ?? `${producto.nombre} disponible en línea`,
    alternates: { canonical: `https://${host}/productos/${producto.slug}` },
    openGraph: {
      title: producto.nombre,
      description: producto.descripcion ?? undefined,
      type: 'website',
      images: producto.fotos.map((foto) => ({ url: foto })),
    },
  }
}

export default async function PaginaProducto({ params }: Props) {
  const { subdominio, slug } = await params
  const host = hostDesdeIdentificador(subdominio)

  const [tienda, producto] = await Promise.all([
    obtenerTienda(host),
    obtenerProducto(host, slug),
  ])

  if (!tienda || !producto) notFound()

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <FichaProducto producto={producto} nombreTienda={tienda.nombre} moneda={tienda.moneda} ajustes={tienda.ajustes} />
    </>
  )
}
