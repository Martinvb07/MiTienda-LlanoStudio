import Image from 'next/image'
import type { PropsLogos } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'

export function Logos({ titulo, animado = false, items }: PropsLogos) {
  if (items.length === 0) return null

  const logo = (item: PropsLogos['items'][number], clave: string) => (
    <div key={clave} className="flex h-16 w-36 shrink-0 items-center justify-center px-4 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0">
      {item.imagenUrl ? (
        <span className="relative block h-full w-full">
          <Image src={item.imagenUrl} alt={item.nombre ?? ''} fill sizes="144px" unoptimized={esMedioLocal(item.imagenUrl)} className="object-contain" />
        </span>
      ) : (
        <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap">{item.nombre}</span>
      )}
    </div>
  )

  return (
    <section className="py-14">
      {titulo && <p className="mb-8 px-6 text-center text-sm tracking-[0.14em] text-tinta/55 uppercase">{titulo}</p>}
      {animado ? (
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          {/* Dos copias seguidas: al llegar a la mitad la cinta vuelve al inicio sin salto. */}
          <div className="flex w-max animate-[mt-cinta_30s_linear_infinite] hover:[animation-play-state:paused]">
            {[...items, ...items].map((item, indice) => logo(item, `${item.id}-${indice}`))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 px-6">{items.map((item) => logo(item, item.id))}</div>
      )}
    </section>
  )
}
