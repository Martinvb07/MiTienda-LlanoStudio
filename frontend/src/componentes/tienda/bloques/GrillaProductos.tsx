import Link from 'next/link'
import { generarSlug } from '@/utilidades/formato'
import type { PropsGrillaProductos } from '@/tipos/bloques'
import type { Producto } from '@/tipos/tienda'
import { TarjetaProducto } from '../TarjetaProducto'

export const CLASES_COLUMNAS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
} as const

interface Props extends PropsGrillaProductos {
  productos: Producto[]
  moneda: string
}

export function GrillaProductos({
  titulo,
  limite = 8,
  columnas = 3,
  categoria,
  estilo = 'simple',
  productos,
  moneda,
}: Props) {
  const filtrados = categoria
    ? productos.filter((producto) => producto.categoria?.toLowerCase() === categoria.toLowerCase())
    : productos
  const visibles = filtrados.slice(0, limite)

  return (
    <section id="productos" className="mx-auto max-w-6xl px-6 py-16">
      {titulo &&
        (estilo === 'tarjeta' ? (
          <div className="mb-8 flex items-center gap-6">
            <span className="h-px flex-1 bg-tinta/15" />
            <h2 className="font-display text-2xl font-semibold tracking-tight uppercase">{titulo}</h2>
            <span className="h-px flex-1 bg-tinta/15" />
          </div>
        ) : (
          <h2 className="mb-10 font-display text-2xl font-semibold tracking-tight">{titulo}</h2>
        ))}

      {visibles.length === 0 ? (
        <p className="text-tinta/50">Todavía no hay productos publicados.</p>
      ) : (
        <div className={`grid gap-4 sm:gap-6 ${estilo === 'simple' ? 'gap-y-10' : ''} ${CLASES_COLUMNAS[columnas]}`}>
          {visibles.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} moneda={moneda} estilo={estilo} />
          ))}
        </div>
      )}

      {filtrados.length > visibles.length && (
        <div className="mt-10 text-center">
          <Link
            href={categoria ? `/categoria/${generarSlug(categoria)}` : '/buscar'}
            className="inline-flex rounded-(--radius-marca) bg-marca px-7 py-3 text-sm font-medium text-marca-contraste transition hover:opacity-90"
          >
            Ver más productos
          </Link>
        </div>
      )}
    </section>
  )
}
