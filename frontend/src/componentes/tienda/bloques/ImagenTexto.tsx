import Image from 'next/image'
import type { PropsImagenTexto } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'

export function ImagenTexto({
  titulo,
  contenido,
  imagenUrl,
  textoBoton,
  enlaceBoton,
  lado = 'izquierda',
}: PropsImagenTexto) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16">
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-(--radius-marca) bg-tinta/5 ${
          lado === 'derecha' ? 'md:order-2' : ''
        }`}
      >
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={esMedioLocal(imagenUrl)}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-tinta/30">Sin imagen</div>
        )}
      </div>

      <div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">{titulo}</h2>
        {contenido && (
          <p className="mt-4 text-lg leading-relaxed whitespace-pre-line text-tinta/75">{contenido}</p>
        )}
        {textoBoton && (
          <a
            href={enlaceBoton || '#productos'}
            className="mt-8 inline-block rounded-(--radius-marca) bg-marca px-6 py-3 font-medium text-marca-contraste transition hover:opacity-90"
          >
            {textoBoton}
          </a>
        )}
      </div>
    </section>
  )
}
