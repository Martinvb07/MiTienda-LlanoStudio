'use client'

import { useEffect, useRef } from 'react'
import { animate, createScope, type Scope } from 'animejs'
import { Contenedor } from './Contenedor'

/**
 * CONTENIDO DE MUESTRA — reemplazar por tiendas reales cuando las haya.
 *
 * Son nombres inventados a propósito: poner marcas ajenas aquí insinuaría que
 * ya usan la plataforma, y eso no sería cierto.
 */
const TIENDAS = [
  'Ropa Llanera',
  'Café del Quindío',
  'Artesanías Wayuu',
  'Bici Bogotá',
  'Herbal Boyacá',
  'Sabor Caribe',
]

export function Marquesina() {
  const raiz = useRef<HTMLDivElement>(null)
  const ambito = useRef<Scope | null>(null)

  useEffect(() => {
    if (!raiz.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    ambito.current = createScope({ root: raiz }).add(() => {
      // La pista lleva la lista dos veces; al desplazarla justo la mitad, el
      // salto de vuelta al inicio cae en un punto idéntico y no se nota.
      animate('[data-pista]', {
        x: ['0%', '-50%'],
        duration: 32000,
        ease: 'linear',
        loop: true,
      })
    })

    return () => {
      ambito.current?.revert()
    }
  }, [])

  return (
    <section className="border-y border-sitio-borde bg-white py-10">
      <Contenedor>
        <p className="text-center text-sm text-sitio-tenue">
          El tipo de negocio que ya vende con Llano Studio
        </p>
      </Contenedor>

      <div
        ref={raiz}
        className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        <div data-pista className="flex w-max items-center gap-14 px-7">
          {[...TIENDAS, ...TIENDAS].map((tienda, indice) => (
            <span
              key={`${tienda}-${indice}`}
              className="font-display text-xl font-semibold whitespace-nowrap text-sitio-tenue/70"
            >
              {tienda}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
