import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'

interface Pregunta {
  pregunta: string
  respuesta: string
}

/**
 * Preguntas frecuentes.
 *
 * Se usa <details> nativo en vez de un acordeón con estado: funciona sin
 * JavaScript, el navegador ya se encarga de la accesibilidad y el buscador lee
 * el contenido aunque esté plegado.
 */
export function Preguntas({ titulo, preguntas }: { titulo: string; preguntas: Pregunta[] }) {
  return (
    <section className="py-20 lg:py-24">
      <Contenedor>
        <Revelar className="max-w-2xl">
          <Rotulo>Preguntas</Rotulo>
          <h2 className="mt-5 titulo-2">
            {titulo}
          </h2>
        </Revelar>

        <div className="mt-12 max-w-3xl">
          {preguntas.map((elemento, indice) => (
            <Revelar key={elemento.pregunta} retardo={indice * 0.04}>
              <details className="group border-t border-sitio-borde-fuerte last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-medium text-sitio-tinta marker:content-none">
                  {elemento.pregunta}
                  <span className="relative h-4 w-4 shrink-0 text-sitio-azul">
                    <span className="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded bg-current" />
                    <span className="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rotate-90 rounded bg-current transition-transform duration-300 group-open:rotate-0" />
                  </span>
                </summary>
                <p className="pr-10 pb-5 leading-relaxed text-pretty text-sitio-suave">
                  {elemento.respuesta}
                </p>
              </details>
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
