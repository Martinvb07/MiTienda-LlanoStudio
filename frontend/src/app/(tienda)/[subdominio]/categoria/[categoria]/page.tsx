import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { categoriasDe, ListadoProductos } from '@/componentes/tienda/ListadoProductos'
import { listarProductos, obtenerTienda } from '@/servicios/tiendas.servicio'
import { vendeEnLinea } from '@/utilidades/sitio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { generarSlug } from '@/utilidades/formato'

export const revalidate = 60

interface Props {
  params: Promise<{ subdominio: string; categoria: string }>
}

async function cargar({ params }: Props) {
  const { subdominio, categoria } = await params
  const host = hostDesdeIdentificador(subdominio)
  const [tienda, productos] = await Promise.all([obtenerTienda(host), listarProductos(host)])
  const categorias = categoriasDe(productos)
  // Si aún no hay productos en esa categoría (un menú recién armado con una
  // plantilla), la página sale vacía con el nombre legible en vez de un 404.
  const nombre =
    categorias.find((c) => generarSlug(c) === categoria) ??
    decodeURIComponent(categoria)
      .replace(/-/g, ' ')
      .replace(/^./, (letra) => letra.toUpperCase())
  return { tienda, productos, categorias, nombre }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { nombre } = await cargar(props)
  return { title: nombre }
}

export default async function PaginaCategoria(props: Props) {
  const { tienda, productos, categorias, nombre } = await cargar(props)
  // Una página informativa no vende: sin catálogo, carrito ni pagos.
  if (!tienda || !vendeEnLinea(tienda.tipo)) notFound()

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <ListadoProductos
        titulo={nombre}
        productos={productos.filter((p) => p.categoria?.trim() === nombre)}
        moneda={tienda.moneda}
        categorias={categorias}
        categoriaActiva={nombre}
      />
    </>
  )
}
