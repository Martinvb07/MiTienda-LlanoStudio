import type { PropsVideo } from '@/tipos/bloques'
import { TituloSeccion } from './TituloSeccion'

/** De un enlace de YouTube o Vimeo saca la dirección para incrustarlo. */
export function direccionVideo(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export function Video({ titulo, url, texto }: PropsVideo) {
  const fuente = direccionVideo(url)

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={texto} />
      <div className="relative aspect-video overflow-hidden rounded-(--radius-marca) bg-tinta/5">
        {fuente ? (
          <iframe
            src={fuente}
            title={titulo || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <span className="grid h-full place-items-center px-6 text-center text-sm text-tinta/40">
            Pega el enlace de un video de YouTube o Vimeo
          </span>
        )}
      </div>
    </section>
  )
}
