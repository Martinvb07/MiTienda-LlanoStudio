'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { EstiloSeccion } from '@/tipos/bloques'
import type { EsquemaColor } from '@/tipos/tienda'
import { variablesEsquema } from '@/utilidades/tema'

/**
 * Aplica a una sección la apariencia que se eligió en el editor. El espaciado
 * y el ancho se resuelven con atributos data-* en globals.css, porque cada
 * bloque trae su propio padding y ancho máximo y aquí sólo se ajustan.
 */
export function EnvolturaSeccion({
  id,
  estilo,
  esquemas,
  animarPorDefecto = false,
  children,
}: {
  id: string
  estilo?: EstiloSeccion
  /** Esquemas de color del tema, para resolver estilo.esquema. */
  esquemas?: EsquemaColor[]
  /** El tema pide animar todas las secciones que no digan otra cosa. */
  animarPorDefecto?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const elegida = estilo?.animacion ?? (animarPorDefecto ? 'aparecer' : 'ninguna')
  const animacion = elegida !== 'ninguna' ? elegida : null
  const esquema = estilo?.esquema ? esquemas?.find((opcion) => opcion.id === estilo.esquema) : undefined
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
    ...(esquema ? variablesEsquema(esquema) : {}),
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
