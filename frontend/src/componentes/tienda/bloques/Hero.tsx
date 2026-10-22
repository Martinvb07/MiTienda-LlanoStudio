import Image from 'next/image'
import type { PropsHero } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'

export function Hero({
  titulo,
  subtitulo,
  textoBoton,
  enlaceBoton,
  imagenUrl,
  alineacion = 'centro',
}: PropsHero) {
  const centrado = alineacion === 'centro'

  return (
    <section className="relative isolate overflow-hidden px-6 py-24 sm:py-32">
      {imagenUrl && (
        <>
          <Image
            src={imagenUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized={esMedioLocal(imagenUrl)}
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-black/40" />
        </>
      )}

      <div className={centrado ? 'mx-auto max-w-3xl text-center' : 'mx-auto max-w-6xl'}>
        <h1
          className={`font-display text-4xl font-semibold tracking-tight text-balance sm:text-6xl ${!centrado ? 'max-w-3xl' : ''} ${
            imagenUrl ? 'text-white' : 'text-tinta'
          }`}
        >
          {titulo}
        </h1>

        {subtitulo && (
          <p
            className={`mt-6 max-w-2xl text-lg text-pretty ${centrado ? 'mx-auto' : ''} ${imagenUrl ? 'text-white/80' : 'text-tinta/70'}`}
          >
            {subtitulo}
          </p>
        )}

        {textoBoton && (
          <a
            href={enlaceBoton ?? '#productos'}
            className="boton-tienda mt-10 inline-block rounded-(--radius-marca) bg-marca px-6 py-3 font-medium text-marca-contraste transition hover:opacity-90"
          >
            {textoBoton}
          </a>
        )}
      </div>
    </section>
  )
}
