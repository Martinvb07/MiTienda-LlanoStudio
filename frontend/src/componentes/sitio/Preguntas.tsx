'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'

interface Pregunta {
  pregunta: string
  respuesta: string
}

/**
 * Preguntas frecuentes en filas, como el índice de llanostudio.co. La respuesta
 * se despliega con la altura animada y el + gira hasta volverse ×.
 */
export function Preguntas({ titulo, preguntas }: { titulo: string; preguntas: Pregunta[] }) {
  const [abierta, setAbierta] = useState<number | null>(null)

  return (
    <section className="py-[110px] md:py-[150px]">
      <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Revelar>
          <span className="antetitulo mb-[22px]">Preguntas</span>
          <h2 className="titulo-2 max-w-[12ch]">{titulo}</h2>
        </Revelar>

        <Revelar retardo={0.1} className="border-b border-white/12">
          {preguntas.map((elemento, indice) => {
            const activa = abierta === indice
            return (
              <div key={elemento.pregunta} className="border-t border-white/12">
                <button
                  type="button"
                  aria-expanded={activa}
                  onClick={() => setAbierta(activa ? null : indice)}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] tracking-[-0.01em] text-white"
                >
                  <span className="transition-colors duration-500 group-hover:text-white/70">{elemento.pregunta}</span>
                  <Plus
                    aria-hidden="true"
                    strokeWidth={1.4}
                    className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-700 ease-salida ${
                      activa ? 'rotate-45 text-white' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {activa && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[60ch] pr-10 pb-7 text-[15px] leading-relaxed text-white/60">
                        {elemento.respuesta}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Revelar>
      </Contenedor>
    </section>
  )
}
