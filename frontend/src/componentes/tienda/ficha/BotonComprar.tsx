'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/tipos/tienda'
import { SelectorCantidad, useCarrito } from '../carrito/Carrito'

/** Cantidad, "Agregar al carrito" y "Comprar ahora". */
export function BotonComprar({ producto }: { producto: Producto }) {
  const carrito = useCarrito()
  const router = useRouter()
  const [cantidad, setCantidad] = useState(1)
  const agotado = producto.stock === 0

  function agregar(irAPagar: boolean) {
    if (!carrito || agotado) return
    carrito.agregar({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      foto: producto.fotos[0],
      cantidad,
      stock: producto.stock,
    })
    if (irAPagar) {
      carrito.cerrar()
      router.push('/carrito')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!agotado && (
        <div className="self-start">
          <SelectorCantidad valor={cantidad} maximo={Math.min(producto.stock, 99)} alCambiar={(valor) => setCantidad(Math.max(1, valor))} />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={agotado}
          onClick={() => agregar(false)}
          className="boton-tienda flex-1 rounded-(--radius-marca) bg-marca px-6 py-3.5 font-medium text-marca-contraste transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {agotado ? 'Agotado' : 'Agregar al carrito'}
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
