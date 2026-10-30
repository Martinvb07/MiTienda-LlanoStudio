'use client'

import Link from 'next/link'
import type { Producto } from '@/tipos/tienda'
import { useFavoritos } from '@/utilidades/favoritos'
import { ListadoProductos } from './ListadoProductos'

/** Los productos que el comprador guardó con el corazón, en el orden en que los guardó. */
export function ListaFavoritos({ productos, moneda, categorias }: { productos: Producto[]; moneda: string; categorias: string[] }) {
  const { ids } = useFavoritos()
  const porId = new Map(productos.map((producto) => [producto.id, producto]))
  const guardados = ids.map((id) => porId.get(id)).filter((producto): producto is Producto => Boolean(producto))

  if (guardados.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Tus favoritos</h1>
        <p className="mt-3 text-tinta/60">Toca «Guardar» en un producto y lo encuentras aquí después.</p>
        <Link href="/buscar" className="mt-6 inline-block underline underline-offset-4">
          Ver todos los productos
        </Link>
      </main>
    )
  }

  return (
    <ListadoProductos
      titulo="Tus favoritos"
      subtitulo={`${guardados.length} ${guardados.length === 1 ? 'producto guardado' : 'productos guardados'} en este navegador`}
      productos={guardados}
      moneda={moneda}
      categorias={categorias}
    />
  )
}
