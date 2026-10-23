import Image from 'next/image'
import type { PropsEquipo } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'
import { TituloSeccion } from './TituloSeccion'

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]!.toUpperCase())
    .join('')

/** Quiénes atienden: foto (o iniciales), nombre, cargo y una línea. */
export function Equipo({ titulo, subtitulo, items }: PropsEquipo) {
  if (items.length === 0) return null
  const columnas = items.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={subtitulo} />
      <div className={`grid justify-center gap-x-6 gap-y-10 ${columnas}`}>
        {items.map((persona) => (
          <figure key={persona.id} className="flex flex-col items-center text-center">
            <span className="relative grid aspect-square w-36 place-items-center overflow-hidden rounded-full bg-marca/10 text-3xl font-semibold text-marca">
              {persona.fotoUrl ? (
                <Image src={persona.fotoUrl} alt={persona.nombre} fill sizes="144px" unoptimized={esMedioLocal(persona.fotoUrl)} className="object-cover" />
              ) : (
                <span aria-hidden="true" className="font-display">
                  {iniciales(persona.nombre)}
                </span>
              )}
            </span>
            <figcaption className="mt-5">
              <h3 className="font-display text-lg font-semibold tracking-tight">{persona.nombre}</h3>
              {persona.cargo && <p className="mt-1 text-sm text-tinta/60">{persona.cargo}</p>}
              {persona.texto && <p className="mx-auto mt-3 max-w-xs leading-relaxed text-tinta/70">{persona.texto}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
