import Image from 'next/image'
import Link from 'next/link'
import type { Producto } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'

interface Props {
  producto: Producto
  nombreTienda: string
  moneda: string
}

/** Página de un producto. La usan la tienda pública y la vista previa del editor. */
export function FichaProducto({ producto, nombreTienda, moneda }: Props) {
  const [portada, ...resto] = producto.fotos

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/" className="text-sm text-tinta/60 transition hover:text-tinta">
        ← Volver a {nombreTienda}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-(--radius-marca) bg-tinta/5">
            {portada ? (
              <Image
                src={portada}
                alt={producto.nombre}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={esMedioLocal(portada)}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-tinta/30">Sin foto</div>
            )}
          </div>

          {resto.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {resto.map((foto) => (
                <div key={foto} className="relative aspect-square overflow-hidden rounded-(--radius-marca) bg-tinta/5">
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="12vw"
                    unoptimized={esMedioLocal(foto)}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{producto.nombre}</h1>

          <p className="mt-4 text-2xl">{formatearPrecio(producto.precio, moneda)}</p>
          {producto.precioComparacion && (
            <p className="mt-1 text-tinta/40 line-through">
              {formatearPrecio(producto.precioComparacion, moneda)}
            </p>
          )}

          {producto.descripcion && (
            <p className="mt-6 leading-relaxed whitespace-pre-line text-tinta/80">{producto.descripcion}</p>
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
