import type { PropsTexto } from '@/tipos/bloques'

export function Texto({ titulo, contenido, alineacion = 'izquierda' }: PropsTexto) {
  return (
    <section
      className={`mx-auto max-w-3xl px-6 py-16 ${alineacion === 'centro' ? 'text-center' : ''}`}
    >
      {titulo && <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">{titulo}</h2>}
      {/* El contenido es texto plano del editor; nada de HTML sin sanear. */}
      <p className="text-lg leading-relaxed whitespace-pre-line text-tinta/80">{contenido}</p>
    </section>
  )
}
