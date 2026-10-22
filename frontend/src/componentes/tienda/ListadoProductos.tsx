import Link from 'next/link'
import type { Producto } from '@/tipos/tienda'
import { generarSlug } from '@/utilidades/formato'
import { CLASES_COLUMNAS } from './bloques/GrillaProductos'
import { TarjetaProducto } from './TarjetaProducto'

interface Props {
  titulo: string
  subtitulo?: string
  productos: Producto[]
  moneda: string
  /** Todas las categorías del catálogo, para saltar entre ellas. */
  categorias: string[]
  categoriaActiva?: string
}

/** Página de listado: la usan la búsqueda y cada categoría. */
export function ListadoProductos({ titulo, subtitulo, productos, moneda, categorias, categoriaActiva }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-tinta/60">{subtitulo}</p>}

      {categorias.length > 0 && (
        <nav aria-label="Categorías" className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/buscar"
            className={`rounded-full border px-4 py-1.5 text-sm transition ${!categoriaActiva ? 'border-tinta bg-tinta text-superficie' : 'border-tinta/15 hover:border-tinta/40'}`}
          >
            Todo
          </Link>
          {categorias.map((categoria) => (
            <Link
              key={categoria}
              href={`/categoria/${generarSlug(categoria)}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${categoriaActiva === categoria ? 'border-tinta bg-tinta text-superficie' : 'border-tinta/15 hover:border-tinta/40'}`}
            >
              {categoria}
            </Link>
          ))}
        </nav>
      )}

      {productos.length === 0 ? (
        <p className="mt-16 text-center text-tinta/50">No encontramos productos.</p>
      ) : (
        <div className={`mt-10 grid gap-4 sm:gap-6 ${CLASES_COLUMNAS[4]}`}>
          {productos.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} moneda={moneda} estilo="tarjeta" />
          ))}
        </div>
      )}
    </main>
  )
}

export function categoriasDe(productos: Producto[]): string[] {
  return [...new Set(productos.map((p) => p.categoria?.trim()).filter((c): c is string => Boolean(c)))]
}
