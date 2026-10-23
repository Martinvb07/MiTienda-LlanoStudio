import Image from 'next/image'
import { IconoBloque, claveIcono } from '@/componentes/comunes/IconoBloque'
import type { PropsColumnas } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'
import { TituloSeccion } from './TituloSeccion'

const GRILLA = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' } as const

/** Beneficios o servicios en columnas, cada uno con ícono o foto. */
export function Columnas({ titulo, subtitulo, columnas = 3, alineacion = 'centro', items }: PropsColumnas) {
  if (items.length === 0) return null
  const centrado = alineacion === 'centro'

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={subtitulo} />
      <div className={`grid gap-8 ${GRILLA[columnas]}`}>
        {items.map((item) => (
          <div key={item.id} className={centrado ? 'flex flex-col items-center text-center' : ''}>
            {item.imagenUrl ? (
              <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden rounded-(--radius-marca) bg-tinta/5">
                <Image
                  src={item.imagenUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  unoptimized={esMedioLocal(item.imagenUrl)}
                  className="object-cover"
                />
              </div>
            ) : (
              claveIcono(item.icono) && (
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-(--radius-marca) bg-marca/10 text-marca">
                  <IconoBloque valor={item.icono} className="h-6 w-6" />
                </span>
              )
            )}
            <h3 className="font-display text-lg font-semibold tracking-tight">{item.titulo}</h3>
            {item.texto && <p className="mt-2 leading-relaxed text-tinta/70">{item.texto}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
