import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { listarProductos, obtenerProducto, obtenerResenas, obtenerTienda } from '@/servicios/tiendas.servicio'
import { vendeEnLinea } from '@/utilidades/sitio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { FichaProducto } from '@/componentes/tienda/FichaProducto'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { DatosEstructurados } from '@/componentes/comunes/DatosEstructurados'
import { datosProducto } from '@/utilidades/datosEstructurados'

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

  const [tienda, producto, catalogo] = await Promise.all([
    obtenerTienda(host),
    obtenerProducto(host, slug),
    listarProductos(host),
  ])

  if (!tienda || !producto || !vendeEnLinea(tienda.tipo)) notFound()
  const resenas = tienda.ajustes.paginaProducto?.resenas === false ? [] : await obtenerResenas(host, producto.id, producto.slug)

  return (
    <>
      <DatosEstructurados datos={datosProducto(producto, tienda, host, resenas)} />
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <FichaProducto producto={producto} nombreTienda={tienda.nombre} moneda={tienda.moneda} ajustes={tienda.ajustes} catalogo={catalogo} resenas={resenas} />
    </>
  )
}
