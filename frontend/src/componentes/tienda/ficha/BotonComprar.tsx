'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { SelectorCantidad, useCarrito } from '../carrito/Carrito'

/** Opciones (talla, color…), cantidad, "Agregar al carrito" y "Comprar ahora". */
export function BotonComprar({ producto, moneda = 'COP' }: { producto: Producto; moneda?: string }) {
  const carrito = useCarrito()
  const router = useRouter()
  const opciones = producto.opciones ?? []
  const variantes = producto.variantes ?? []
  const [cantidad, setCantidad] = useState(1)
  // Arranca con la primera combinación que tenga stock.
  const [elegidos, setElegidos] = useState<Record<string, string>>(
    () => (variantes.find((variante) => variante.stock > 0) ?? variantes[0])?.valores ?? {},
  )

  const variante = variantes.length
    ? variantes.find((opcion) => opciones.every((o) => opcion.valores[o.nombre] === elegidos[o.nombre]))
    : undefined
  const stock = variantes.length ? (variante?.stock ?? 0) : producto.stock
  const precio = String(variante?.precio ?? producto.precio)
  const agotado = stock === 0

  /** Si con ese valor no existe ninguna combinación con stock, se marca tachado. */
  const disponible = (nombre: string, valor: string) =>
    variantes.some(
      (opcion) =>
        opcion.stock > 0 &&
        opcion.valores[nombre] === valor &&
        opciones.every((o) => o.nombre === nombre || opcion.valores[o.nombre] === elegidos[o.nombre]),
    )

  function agregar(irAPagar: boolean) {
    if (!carrito || agotado) return
    carrito.agregar(
      {
        productoId: producto.id,
        slug: producto.slug,
        nombre: producto.nombre,
        precio,
        foto: producto.fotos[0],
        cantidad,
        stock,
        variante: variante?.id,
        varianteNombre: variante?.nombre,
      },
      irAPagar ? null : document.querySelector('[data-foto-ficha]'),
    )
    if (irAPagar) {
      carrito.cerrar()
      router.push('/carrito')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {opciones.map((opcion) => (
        <fieldset key={opcion.nombre}>
          <legend className="mb-2 text-sm text-tinta/70">
            {opcion.nombre}: <span className="text-tinta">{elegidos[opcion.nombre]}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {opcion.valores.map((valor) => {
              const activo = elegidos[opcion.nombre] === valor
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => {
                    setElegidos((actuales) => ({ ...actuales, [opcion.nombre]: valor }))
                    setCantidad(1)
                  }}
                  className={`min-w-11 rounded-(--radius-marca) border px-3.5 py-2 text-sm transition ${
                    activo ? 'border-tinta bg-tinta text-superficie' : 'border-tinta/20 hover:border-tinta/60'
                  } ${disponible(opcion.nombre, valor) ? '' : 'text-tinta/35 line-through'}`}
                >
                  {valor}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      {!agotado && (
        <div className="self-start">
          <SelectorCantidad
            valor={cantidad}
            maximo={Math.min(stock, 99)}
            alCambiar={(valor) => setCantidad(Math.max(1, valor))}
          />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={agotado}
          onClick={() => agregar(false)}
          className="boton-tienda flex-1 rounded-(--radius-marca) bg-marca px-6 py-3.5 font-medium text-marca-contraste transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {agotado ? (variantes.length ? 'Agotado en esta opción' : 'Agotado') : 'Agregar al carrito'}
          {!agotado && variante?.precio != null && ` · ${formatearPrecio(precio, moneda)}`}
        </button>
        {!agotado && (
          <button
            type="button"
            onClick={() => agregar(true)}
            className="boton-tienda flex-1 rounded-(--radius-marca) border border-tinta/20 px-6 py-3.5 font-medium transition hover:bg-tinta/5"
          >
            Comprar ahora
          </button>
        )}
      </div>
    </div>
  )
}
