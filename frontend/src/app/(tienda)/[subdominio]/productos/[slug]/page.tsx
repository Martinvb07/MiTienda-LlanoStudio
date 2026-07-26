import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { obtenerProducto, obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { formatearPrecio } from '@/utilidades/formato'

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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/" className="text-sm text-tinta/60 transition hover:text-tinta">
        ← Volver a {tienda.nombre}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-(--radius-marca) bg-black/5">
          {producto.fotos[0] ? (
            <Image
              src={producto.fotos[0]}
              alt={producto.nombre}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-tinta/30">
              Sin foto
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{producto.nombre}</h1>

          <p className="mt-4 text-2xl">{formatearPrecio(producto.precio, tienda.moneda)}</p>
          {producto.precioComparacion && (
            <p className="mt-1 text-tinta/40 line-through">
              {formatearPrecio(producto.precioComparacion, tienda.moneda)}
            </p>
          )}

          {producto.descripcion && (
            <p className="mt-6 leading-relaxed whitespace-pre-line text-tinta/80">
              {producto.descripcion}
            </p>
          )}

          {/* El carrito y el pago (Wompi/PSE) llegan en una fase posterior. */}
          <button
            type="button"
            disabled={producto.stock === 0}
            className="mt-8 w-full rounded-(--radius-marca) bg-marca px-6 py-3 font-medium text-marca-contraste transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {producto.stock === 0 ? 'Agotado' : 'Añadir al carrito'}
          </button>
        </div>
      </div>
    </main>
  )
}
