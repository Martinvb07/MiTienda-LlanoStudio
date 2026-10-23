'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import type { Producto } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'
import { useCarrito } from '../carrito/Carrito'

/**
 * Cuando el botón de compra queda arriba al bajar por la página, aparece esta
 * barra pegada abajo para comprar sin volver a subir. Con tallas o colores,
 * el botón lleva de vuelta a elegirlos.
 */
export function BarraCompraFija({ producto, moneda }: { producto: Producto; moneda: string }) {
  const carrito = useCarrito()
  const [visible, setVisible] = useState(false)
  const foto = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const objetivo = document.querySelector('[data-boton-comprar]')
    if (!objetivo) return
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada) setVisible(!entrada.isIntersecting && entrada.boundingClientRect.top < 0)
    })
    observador.observe(objetivo)
    return () => observador.disconnect()
  }, [])

  if (!carrito || producto.stock === 0) return null
  const conOpciones = (producto.opciones?.length ?? 0) > 0

  function comprar() {
    if (conOpciones) {
      document.querySelector('[data-boton-comprar]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
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
      foto.current,
    )
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-tinta/10 bg-superficie/95 text-tinta shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.4)] backdrop-blur"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <span ref={foto} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-tinta/5">
              {producto.fotos[0] && (
                <Image src={producto.fotos[0]} alt="" fill sizes="48px" unoptimized={esMedioLocal(producto.fotos[0])} className="object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{producto.nombre}</span>
              <span className="block text-sm text-[var(--precio,var(--tinta))]">{formatearPrecio(producto.precio, moneda)}</span>
            </span>
            <button
              type="button"
              onClick={comprar}
              className="boton-tienda shrink-0 bg-marca px-5 py-3 text-sm font-medium text-marca-contraste transition hover:opacity-90 active:scale-[0.98]"
            >
              {conOpciones ? 'Elegir opciones' : 'Agregar al carrito'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
