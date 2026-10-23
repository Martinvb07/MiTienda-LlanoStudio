import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { categoriasDe, ListadoProductos } from '@/componentes/tienda/ListadoProductos'
import { listarProductos, obtenerTienda } from '@/servicios/tiendas.servicio'
import { vendeEnLinea } from '@/utilidades/sitio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'

export const metadata: Metadata = { title: 'Productos', robots: { index: false } }

interface Props {
  params: Promise<{ subdominio: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

/** Sin acentos ni mayúsculas: "cafe" encuentra "Café". */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default async function PaginaBuscar({ params, searchParams }: Props) {
  const [{ subdominio }, { q }] = await Promise.all([params, searchParams])
  const host = hostDesdeIdentificador(subdominio)
  const [tienda, productos] = await Promise.all([obtenerTienda(host), listarProductos(host)])
  // Una página informativa no vende: sin catálogo, carrito ni pagos.
  if (!tienda || !vendeEnLinea(tienda.tipo)) notFound()

  const consulta = (Array.isArray(q) ? q[0] : q)?.trim() ?? ''
  const terminos = normalizar(consulta).split(/\s+/).filter(Boolean)
  const encontrados = terminos.length
    ? productos.filter((p) => {
        const texto = normalizar([p.nombre, p.descripcion, p.categoria, p.presentacion].filter(Boolean).join(' '))
        return terminos.every((t) => texto.includes(t))
      })
    : productos

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <ListadoProductos
        titulo={consulta ? `Resultados para “${consulta}”` : 'Todos los productos'}
        subtitulo={`${encontrados.length} ${encontrados.length === 1 ? 'producto' : 'productos'}`}
        productos={encontrados}
        moneda={tienda.moneda}
        categorias={categoriasDe(productos)}
      />
    </>
  )
}
