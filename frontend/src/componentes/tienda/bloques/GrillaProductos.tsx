import Image from 'next/image'
import Link from 'next/link'
import type { PropsGrillaProductos } from '@/tipos/bloques'
import type { Producto } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'

const CLASES_COLUMNAS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const

interface Props extends PropsGrillaProductos {
  productos: Producto[]
  moneda: string
}

export function GrillaProductos({
  titulo,
  limite = 8,
  columnas = 3,
  productos,
  moneda,
}: Props) {
  const visibles = productos.slice(0, limite)

  return (
    <section id="productos" className="mx-auto max-w-6xl px-6 py-16">
      {titulo && <h2 className="mb-10 text-2xl font-semibold tracking-tight">{titulo}</h2>}

      {visibles.length === 0 ? (
        <p className="text-tinta/50">Todavía no hay productos publicados.</p>
      ) : (
        <div className={`grid grid-cols-1 gap-8 ${CLASES_COLUMNAS[columnas]}`}>
          {visibles.map((producto) => (
            <Link
              key={producto.id}
              href={`/productos/${producto.slug}`}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden rounded-(--radius-marca) bg-black/5">
                {producto.fotos[0] ? (
                  <Image
                    src={producto.fotos[0]}
                    alt={producto.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-tinta/30">
                    Sin foto
                  </div>
                )}
              </div>

              <h3 className="mt-4 font-medium">{producto.nombre}</h3>
              <p className="mt-1 text-tinta/70">{formatearPrecio(producto.precio, moneda)}</p>
              {producto.stock === 0 && (
                <p className="mt-1 text-sm text-tinta/40">Agotado</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
