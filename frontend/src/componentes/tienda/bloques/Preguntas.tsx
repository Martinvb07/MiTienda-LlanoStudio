import type { PropsPreguntas } from '@/tipos/bloques'
import { TituloSeccion } from './TituloSeccion'

/** Acordeón nativo: funciona sin JavaScript y se lee bien en buscadores. */
export function Preguntas({ titulo, items }: PropsPreguntas) {
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <TituloSeccion titulo={titulo} />
      <div className="border-t border-tinta/10">
        {items.map((item) => (
          <details key={item.id} className="group border-b border-tinta/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {item.pregunta}
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-tinta/15 text-tinta/60 transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-6 leading-relaxed whitespace-pre-line text-tinta/70">{item.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
