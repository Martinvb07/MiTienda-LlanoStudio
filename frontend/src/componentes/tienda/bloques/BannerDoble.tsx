import Image from 'next/image'
import type { PropsBannerDoble } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'

const ALTOS = { bajo: 'min-h-[220px]', medio: 'min-h-[320px]', alto: 'min-h-[440px]' } as const

/** Dos o tres banners de promoción lado a lado. */
export function BannerDoble({ alto = 'medio', items }: PropsBannerDoble) {
  if (items.length === 0) return null

  return (
    <section className={`mx-auto grid max-w-6xl gap-4 px-6 py-10 ${items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      {items.map((item) => {
        const Contenedor = item.enlace ? 'a' : 'div'
        return (
          <Contenedor
            key={item.id}
            {...(item.enlace ? { href: item.enlace } : {})}
            className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-(--radius-marca) bg-marca p-7 text-marca-contraste ${ALTOS[alto]}`}
          >
            {item.imagenUrl && (
              <>
                <Image
                  src={item.imagenUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={esMedioLocal(item.imagenUrl)}
                  className="-z-10 object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </>
            )}
            <div className={item.imagenUrl ? 'text-white' : ''}>
              {item.titulo && <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{item.titulo}</h3>}
              {item.subtitulo && <p className="mt-1.5 opacity-85">{item.subtitulo}</p>}
              {item.textoBoton && (
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase underline-offset-4 group-hover:underline">
                  {item.textoBoton} →
                </span>
              )}
            </div>
          </Contenedor>
        )
      })}
    </section>
  )
}
