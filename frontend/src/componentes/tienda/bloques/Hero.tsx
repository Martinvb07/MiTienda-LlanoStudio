import Image from 'next/image'
import type { PropsHero } from '@/tipos/bloques'

export function Hero({ titulo, subtitulo, textoBoton, enlaceBoton, imagenUrl }: PropsHero) {
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
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-black/40" />
        </>
      )}

      <div className="mx-auto max-w-3xl text-center">
        <h1
          className={`text-4xl font-semibold tracking-tight text-balance sm:text-6xl ${
            imagenUrl ? 'text-white' : 'text-tinta'
          }`}
        >
          {titulo}
        </h1>

        {subtitulo && (
          <p
            className={`mt-6 text-lg text-pretty ${imagenUrl ? 'text-white/80' : 'text-tinta/70'}`}
          >
            {subtitulo}
          </p>
        )}

        {textoBoton && (
          <a
            href={enlaceBoton ?? '#productos'}
            className="mt-10 inline-block rounded-(--radius-marca) bg-marca px-6 py-3 font-medium text-marca-contraste transition hover:opacity-90"
          >
            {textoBoton}
          </a>
        )}
      </div>
    </section>
  )
}
