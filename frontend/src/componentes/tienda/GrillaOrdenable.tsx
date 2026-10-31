'use client'

import { useMemo, useState } from 'react'
import type { Producto } from '@/tipos/tienda'
import { CLASES_COLUMNAS } from './bloques/GrillaProductos'
import { TarjetaProducto } from './TarjetaProducto'

const ORDENES = [
  { valor: 'destacados', etiqueta: 'Destacados' },
  { valor: 'menor', etiqueta: 'Menor precio' },
  { valor: 'mayor', etiqueta: 'Mayor precio' },
  { valor: 'nombre', etiqueta: 'Nombre (A–Z)' },
] as const

type Orden = (typeof ORDENES)[number]['valor']

const precio = (producto: Producto) => Number(producto.precio)

/** Ordena y filtra en el navegador: la página sigue saliendo de caché (ISR) para Google. */
export function ordenarProductos(productos: Producto[], orden: Orden, soloDisponibles: boolean): Producto[] {
  const lista = soloDisponibles ? productos.filter((producto) => producto.stock > 0) : [...productos]
  if (orden === 'menor') lista.sort((a, b) => precio(a) - precio(b))
  if (orden === 'mayor') lista.sort((a, b) => precio(b) - precio(a))
  if (orden === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return lista
}

/** Grilla de un listado con "Ordenar por" y "Sólo disponibles". */
export function GrillaOrdenable({ productos, moneda }: { productos: Producto[]; moneda: string }) {
  const [orden, setOrden] = useState<Orden>('destacados')
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const visibles = useMemo(() => ordenarProductos(productos, orden, soloDisponibles), [productos, orden, soloDisponibles])
  const hayAgotados = productos.some((producto) => producto.stock === 0)

  if (productos.length === 0) return <p className="mt-16 text-center text-tinta/50">No encontramos productos.</p>

  return (
    <>
      {productos.length > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-tinta/70">
            Ordenar por
            <select
              value={orden}
              onChange={(evento) => setOrden(evento.target.value as Orden)}
              className="rounded-(--radius-marca) border border-tinta/20 bg-transparent px-3 py-1.5 text-tinta outline-none focus:border-tinta/60"
            >
              {ORDENES.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </label>
          {hayAgotados && (
            <label className="flex items-center gap-2 text-tinta/70">
              <input type="checkbox" checked={soloDisponibles} onChange={(evento) => setSoloDisponibles(evento.target.checked)} className="accent-current" />
              Sólo disponibles
            </label>
          )}
        </div>
      )}
      {visibles.length === 0 ? (
        <p className="mt-16 text-center text-tinta/50">Todo lo de aquí está agotado por ahora.</p>
      ) : (
        <div className={`mt-6 grid gap-4 sm:gap-6 ${CLASES_COLUMNAS[4]}`}>
          {visibles.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} moneda={moneda} estilo="tarjeta" />
          ))}
        </div>
      )}
    </>
  )
}
