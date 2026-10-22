import Image from 'next/image'
import type { PropsTestimonios } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'
import { TituloSeccion } from './TituloSeccion'

export function Testimonios({ titulo, items }: PropsTestimonios) {
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <figure key={item.id} className="flex flex-col rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-6">
            {item.estrellas ? (
              <div className="mb-4 flex gap-0.5 text-lg text-amber-400" aria-label={`${item.estrellas} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, indice) => (
                  <span key={indice} className={indice < item.estrellas! ? '' : 'opacity-25'}>
                    ★
                  </span>
                ))}
              </div>
            ) : null}
            <blockquote className="flex-1 leading-relaxed text-tinta/80">“{item.texto}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              {item.fotoUrl ? (
                <span className="relative h-10 w-10 overflow-hidden rounded-full bg-tinta/10">
                  <Image src={item.fotoUrl} alt="" fill sizes="40px" unoptimized={esMedioLocal(item.fotoUrl)} className="object-cover" />
                </span>
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-marca text-sm font-semibold text-marca-contraste">
                  {item.nombre.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <span className="block font-medium">{item.nombre}</span>
                {item.detalle && <span className="block text-sm text-tinta/55">{item.detalle}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
