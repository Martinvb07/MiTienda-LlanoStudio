import Image from 'next/image'
import Link from 'next/link'
import type { PropsCategorias } from '@/tipos/bloques'
import { generarSlug } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'

/** Cuadros con foto que llevan a la página de cada categoría del catálogo. */
export function Categorias({ titulo, items }: PropsCategorias) {
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      {titulo && (
        <div className="mb-8 flex items-center gap-6">
          <span className="h-px flex-1 bg-tinta/15" />
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase">{titulo}</h2>
          <span className="h-px flex-1 bg-tinta/15" />
        </div>
      )}
      {/* Centradas: con pocas categorías no quedan pegadas a la izquierda. */}
      <div className="flex flex-wrap justify-center gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/categoria/${generarSlug(item.nombre)}`}
            className={`group relative aspect-[4/3] w-[calc(50%-6px)] overflow-hidden rounded-(--radius-marca) bg-tinta/10 sm:w-[calc(33.333%-8px)] ${items.length <= 4 ? 'lg:w-[calc(25%-9px)]' : 'lg:w-[calc(16.666%-10px)]'}`}
          >
            {item.imagenUrl && (
              <Image
                src={item.imagenUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                unoptimized={esMedioLocal(item.imagenUrl)}
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-2 bottom-2.5 text-center font-display text-sm font-semibold tracking-wide text-white uppercase drop-shadow">
              {item.nombre}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
