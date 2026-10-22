'use client'

import { useState } from 'react'
import Image from 'next/image'
import { esMedioLocal } from '@/utilidades/medios'

/** Fotos del producto: grande con miniaturas, en cuadrícula o una debajo de otra. */
export function GaleriaFicha({
  fotos,
  nombre,
  disposicion,
}: {
  fotos: string[]
  nombre: string
  disposicion: 'miniaturas' | 'cuadricula' | 'apiladas'
}) {
  const [activa, setActiva] = useState(0)

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-(--radius-marca) bg-tinta/5 text-sm text-tinta/30">Sin foto</div>
    )
  }

  const foto = (src: string, indice: number, clases = 'aspect-square') => (
    <div key={src + indice} className={`relative overflow-hidden rounded-(--radius-marca) bg-tinta/5 ${clases}`}>
      <Image
        src={src}
        alt={indice === 0 ? nombre : ''}
        fill
        priority={indice === 0}
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={esMedioLocal(src)}
        className="object-cover"
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
