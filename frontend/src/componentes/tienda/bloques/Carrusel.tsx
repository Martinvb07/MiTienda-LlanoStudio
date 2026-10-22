'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PropsCarrusel } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'

const ALTOS = { bajo: 'h-[260px] sm:h-[340px]', medio: 'h-[340px] sm:h-[440px]', alto: 'h-[420px] sm:h-[560px]' }

/** Banners grandes que pasan solos, con flechas y puntos. Se detiene al pasar el mouse. */
export function Carrusel({ diapositivas, intervalo = 5, alto = 'medio' }: PropsCarrusel) {
  const [actual, setActual] = useState(0)
  const [pausa, setPausa] = useState(false)
  const toque = useRef<number | null>(null)
  const total = diapositivas.length

  const ir = useCallback((indice: number) => setActual(((indice % total) + total) % total), [total])

  useEffect(() => {
    if (!intervalo || pausa || total < 2) return
    const reloj = setInterval(() => setActual((valor) => (valor + 1) % total), intervalo * 1000)
    return () => clearInterval(reloj)
  }, [intervalo, pausa, total])

  if (total === 0) return null
  const diapositiva = diapositivas[Math.min(actual, total - 1)]!

  return (
    <section
      className={`relative overflow-hidden bg-tinta/5 ${ALTOS[alto]}`}
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      // En el celular las flechas se esconden: se pasa deslizando.
      onTouchStart={(evento) => (toque.current = evento.touches[0]!.clientX)}
      onTouchEnd={(evento) => {
        if (toque.current === null) return
        const delta = evento.changedTouches[0]!.clientX - toque.current
        toque.current = null
        if (Math.abs(delta) > 40) ir(actual + (delta < 0 ? 1 : -1))
      }}
      aria-roledescription="carrusel"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={diapositiva.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {diapositiva.imagenUrl ? (
            <>
              <Image
                src={diapositiva.imagenUrl}
                alt=""
                fill
                priority={actual === 0}
                sizes="100vw"
                unoptimized={esMedioLocal(diapositiva.imagenUrl)}
                className="object-cover"
              />
              {(diapositiva.titulo || diapositiva.subtitulo) && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />}
            </>
          ) : (
            <div className="absolute inset-0 bg-marca" />
          )}

          {(diapositiva.titulo || diapositiva.subtitulo || diapositiva.textoBoton) && (
            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={diapositiva.imagenUrl ? 'text-white' : 'text-marca-contraste'}
              >
                {diapositiva.titulo && (
                  <h2 className="max-w-xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    {diapositiva.titulo}
                  </h2>
                )}
                {diapositiva.subtitulo && <p className="mt-4 max-w-lg text-lg opacity-85">{diapositiva.subtitulo}</p>}
                {diapositiva.textoBoton && (
                  <a
                    href={diapositiva.enlaceBoton || '#productos'}
                    className="mt-7 inline-block rounded-(--radius-marca) bg-white px-6 py-3 font-medium text-black transition hover:opacity-90"
                  >
                    {diapositiva.textoBoton}
                  </a>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <>
          {[
            { lado: 'left-4', Icono: ChevronLeft, paso: -1, etiqueta: 'Anterior' },
            { lado: 'right-4', Icono: ChevronRight, paso: 1, etiqueta: 'Siguiente' },
          ].map(({ lado, Icono, paso, etiqueta }) => (
            <button
              key={etiqueta}
              type="button"
              aria-label={etiqueta}
              onClick={() => ir(actual + paso)}
              className={`absolute top-1/2 ${lado} hidden h-10 w-10 sm:grid -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black shadow transition hover:bg-white`}
            >
              <Icono aria-hidden="true" className="h-5 w-5" />
            </button>
          ))}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {diapositivas.map((item, indice) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ir a la diapositiva ${indice + 1}`}
                onClick={() => ir(indice)}
                className={`h-2 rounded-full bg-white transition-all duration-500 ${indice === actual ? 'w-6' : 'w-2 opacity-60'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
