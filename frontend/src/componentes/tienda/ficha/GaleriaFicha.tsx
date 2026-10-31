'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { esMedioLocal } from '@/utilidades/medios'
import { FotoSegura } from '../FotoSegura'

/** Lo dispara BotonComprar al elegir una variante con foto propia (detail = URL). */
export const EVENTO_FOTO_VARIANTE = 'mt-foto-variante'

/** Fotos del producto: grande con miniaturas, en cuadrícula o una debajo de otra. */
export function GaleriaFicha({
  fotos,
  nombre,
  disposicion,
  zoom = false,
}: {
  fotos: string[]
  nombre: string
  disposicion: 'miniaturas' | 'cuadricula' | 'apiladas'
  /** Lupa: al pasar el cursor la foto se agranda siguiéndolo. */
  zoom?: boolean
}) {
  const [activa, setActiva] = useState(0)

  useEffect(() => {
    const alElegir = (evento: Event) => {
      const indice = fotos.indexOf((evento as CustomEvent<string>).detail)
      if (indice < 0) return
      setActiva(indice)
      // En cuadrícula o apiladas no hay foto "activa": se lleva la vista hasta ella.
      if (disposicion !== 'miniaturas') document.querySelector(`[data-foto-indice="${indice}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.addEventListener(EVENTO_FOTO_VARIANTE, alElegir)
    return () => window.removeEventListener(EVENTO_FOTO_VARIANTE, alElegir)
  }, [fotos, disposicion])

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-(--radius-marca) bg-tinta/5 text-sm text-tinta/30">Sin foto</div>
    )
  }

  const foto = (src: string, indice: number, clases = 'aspect-square') => (
    <div
      key={src + indice}
      data-foto-ficha
      data-foto-indice={indice}
      onMouseMove={
        zoom
          ? (evento) => {
              const caja = evento.currentTarget.getBoundingClientRect()
              evento.currentTarget.style.setProperty('--zx', `${((evento.clientX - caja.left) / caja.width) * 100}%`)
              evento.currentTarget.style.setProperty('--zy', `${((evento.clientY - caja.top) / caja.height) * 100}%`)
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-(--radius-marca) bg-tinta/5 ${zoom ? 'group/zoom cursor-zoom-in' : ''} ${clases}`}
    >
      <FotoSegura
        respaldo={<span className="flex h-full items-center justify-center text-sm text-tinta/30">Sin foto</span>}
        src={src}
        alt={indice === 0 ? nombre : ''}
        fill
        priority={indice === 0}
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={esMedioLocal(src)}
        className={`object-cover ${
          zoom
            ? '[transform-origin:var(--zx,50%)_var(--zy,50%)] transition-transform duration-300 ease-out group-hover/zoom:scale-[1.9]'
            : ''
        }`}
      />
    </div>
  )

  if (disposicion === 'apiladas') return <div className="flex flex-col gap-3">{fotos.map((src, indice) => foto(src, indice))}</div>

  if (disposicion === 'cuadricula') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {fotos.map((src, indice) => foto(src, indice, indice === 0 ? 'col-span-2 aspect-square' : 'aspect-square'))}
      </div>
    )
  }

  return (
    <div>
      {foto(fotos[activa] ?? fotos[0]!, 0)}
      {fotos.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {fotos.map((src, indice) => (
            <button
              key={src + indice}
              type="button"
              onClick={() => setActiva(indice)}
              aria-label={`Ver foto ${indice + 1}`}
              className={`relative aspect-square overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-tinta/5 ring-offset-2 ring-offset-superficie transition ${
                indice === activa ? 'ring-2 ring-tinta' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill sizes="10vw" unoptimized={esMedioLocal(src)} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
