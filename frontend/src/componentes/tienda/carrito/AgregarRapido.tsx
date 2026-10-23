'use client'

import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus } from 'lucide-react'
import type { Producto } from '@/tipos/tienda'
import { useCarrito } from './Carrito'

/**
 * "Agregar" sin entrar al producto. Sólo aparece si la tienda lo activó (y su
 * plan lo incluye). Si el producto tiene opciones (talla, color…), lleva a su
 * página para elegirlas en vez de agregar a ciegas.
 *
 * Va dentro del enlace de la tarjeta: por eso corta el clic antes de que navegue.
 */
export function AgregarRapido({ producto, forma }: { producto: Producto; forma: 'boton' | 'flotante' }) {
  const carrito = useCarrito()
  const router = useRouter()
  const [listo, setListo] = useState(false)
  if (!carrito?.agregarRapido || producto.stock === 0) return null

  const conOpciones = (producto.opciones?.length ?? 0) > 0

  function alClic(evento: MouseEvent<HTMLButtonElement>) {
    evento.preventDefault()
    evento.stopPropagation()
    if (conOpciones) {
      router.push(`/productos/${producto.slug}`)
      return
    }
    const foto = evento.currentTarget.closest('.tarjeta-producto')?.querySelector('.tarjeta-foto')
    carrito!.agregar(
      {
        productoId: producto.id,
        slug: producto.slug,
        nombre: producto.nombre,
        precio: String(producto.precio),
        foto: producto.fotos[0],
        cantidad: 1,
        stock: producto.stock,
      },
      foto,
    )
    setListo(true)
    setTimeout(() => setListo(false), 1500)
  }

  const contenido = listo ? (
    <>
      <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.6} />
      Agregado
    </>
  ) : (
    <>
      {!conOpciones && <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />}
      {conOpciones ? 'Elegir opciones' : 'Agregar'}
    </>
  )

  if (forma === 'boton') {
    return (
      <button
        type="button"
        onClick={alClic}
        className="boton-tienda mt-3 flex h-10 w-full items-center justify-center gap-1.5 bg-marca text-sm font-medium text-marca-contraste transition hover:opacity-90 active:scale-[0.98]"
      >
        {contenido}
      </button>
    )
  }

  // Sobre la foto: aparece al pasar el cursor; en pantallas táctiles siempre se ve.
  return (
    <button
      type="button"
      onClick={alClic}
      className="boton-tienda absolute inset-x-2 bottom-2 z-[2] flex h-10 translate-y-2 items-center justify-center gap-1.5 bg-superficie/95 text-sm font-medium text-tinta opacity-0 shadow-md backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-marca hover:text-marca-contraste [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
    >
      {contenido}
    </button>
  )
}
