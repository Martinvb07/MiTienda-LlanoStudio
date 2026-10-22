import type { PropsAnuncio } from '@/tipos/bloques'

export function Anuncio({ texto, enlace }: PropsAnuncio) {
  const contenido = <span className="font-medium">{texto}</span>

  return (
    <div className="bg-marca px-6 py-2.5 text-center text-sm text-marca-contraste">
      {enlace ? (
        <a href={enlace} className="underline-offset-4 hover:underline">
          {contenido}
        </a>
      ) : (
        contenido
      )}
    </div>
  )
}
