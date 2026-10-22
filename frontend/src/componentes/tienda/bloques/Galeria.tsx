import Image from 'next/image'
import type { PropsGaleria } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'
import { TituloSeccion } from './TituloSeccion'

const GRILLA = { 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' } as const

/** Fotos en cuadrícula pareja, mosaico con alturas alternas o una tira deslizable. */
export function Galeria({ titulo, disposicion = 'cuadricula', columnas = 3, imagenes }: PropsGaleria) {
  if (imagenes.length === 0) return null

  const foto = (imagen: PropsGaleria['imagenes'][number], clases: string, indice: number) => {
    const contenido = imagen.url ? (
      <Image
        src={imagen.url}
        alt=""
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        unoptimized={esMedioLocal(imagen.url)}
        className="object-cover transition duration-700 group-hover:scale-105"
      />
    ) : (
      <span className="grid h-full place-items-center text-sm text-tinta/30">Foto {indice + 1}</span>
    )
    const clase = `group relative block overflow-hidden rounded-(--radius-marca) bg-tinta/5 ${clases}`
    return imagen.enlace ? (
      <a key={imagen.id} href={imagen.enlace} className={clase}>
        {contenido}
      </a>
    ) : (
      <div key={imagen.id} className={clase}>
        {contenido}
      </div>
    )
  }

  return (
    <section className={disposicion === 'tira' ? 'py-16' : 'mx-auto max-w-6xl px-6 py-16'}>
      <div className={disposicion === 'tira' ? 'px-6' : ''}>
        <TituloSeccion titulo={titulo} />
      </div>
      {disposicion === 'tira' ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none]">
          {imagenes.map((imagen, indice) => foto(imagen, 'aspect-[4/5] w-[70%] shrink-0 snap-center sm:w-[32%] lg:w-[24%]', indice))}
        </div>
      ) : disposicion === 'mosaico' ? (
        <div className={`grid auto-rows-[160px] gap-3 sm:auto-rows-[200px] ${GRILLA[columnas]}`}>
          {imagenes.map((imagen, indice) => foto(imagen, indice % 3 === 0 ? 'row-span-2' : '', indice))}
        </div>
      ) : (
        <div className={`grid gap-3 ${GRILLA[columnas]}`}>
          {imagenes.map((imagen, indice) => foto(imagen, 'aspect-square', indice))}
        </div>
      )}
    </section>
  )
}
