'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { EstiloSeccion } from '@/tipos/bloques'

/**
 * Aplica a una sección la apariencia que se eligió en el editor. El espaciado
 * y el ancho se resuelven con atributos data-* en globals.css, porque cada
 * bloque trae su propio padding y ancho máximo y aquí sólo se ajustan.
 */
export function EnvolturaSeccion({
  id,
  estilo,
  children,
}: {
  id: string
  estilo?: EstiloSeccion
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const animacion = estilo?.animacion && estilo.animacion !== 'ninguna' ? estilo.animacion : null
  const [visible, setVisible] = useState(!animacion)

  useEffect(() => {
    const nodo = ref.current
    if (!animacion || !nodo) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setVisible(true)
          observador.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [animacion])

  const tarjeta = estilo?.forma === 'tarjeta'
  const variables: CSSProperties = {
    ...(estilo?.fondo ? { background: estilo.fondo } : {}),
    ...(estilo?.texto ? ({ '--tinta': estilo.texto, color: estilo.texto } as CSSProperties) : {}),
  }

  const contenido = (
    <>
      {estilo?.imagenFondo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- fondo decorativo de tamaño libre */}
          <img src={estilo.imagenFondo} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <span className="absolute inset-0 -z-10" style={{ background: `rgb(0 0 0 / ${(estilo.oscurecer ?? 40) / 100})` }} />
        </>
      )}
      {children}
    </>
  )

  return (
    <div
      ref={ref}
      id={estilo?.ancla || undefined}
      data-bloque={id}
      data-espaciado={estilo?.espaciado && estilo.espaciado !== 'normal' ? estilo.espaciado : undefined}
      data-ancho={estilo?.ancho && estilo.ancho !== 'normal' ? estilo.ancho : undefined}
      data-animacion={animacion ?? undefined}
      data-visible={animacion ? visible : undefined}
      className={[
        'relative scroll-mt-24',
        estilo?.imagenFondo ? 'isolate text-white [--tinta:#fff]' : '',
        estilo?.dispositivos === 'movil' ? 'md:hidden' : '',
        estilo?.dispositivos === 'escritorio' ? 'max-md:hidden' : '',
        tarjeta ? 'mx-3 my-4 overflow-hidden rounded-[calc(var(--radio)*2+12px)] md:mx-8' : '',
      ].join(' ')}
      style={variables}
    >
      {contenido}
    </div>
  )
}
