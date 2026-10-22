'use client'

import { useEffect, useState } from 'react'
import type { PropsCuentaRegresiva } from '@/tipos/bloques'

function restante(fecha: string) {
  const fin = new Date(fecha).getTime()
  if (!Number.isFinite(fin)) return null
  const total = Math.max(0, fin - Date.now())
  return {
    total,
    dias: Math.floor(total / 86_400_000),
    horas: Math.floor(total / 3_600_000) % 24,
    minutos: Math.floor(total / 60_000) % 60,
    segundos: Math.floor(total / 1000) % 60,
  }
}

/** Reloj hasta una fecha: oferta que vence, lanzamiento, fin de temporada. */
export function CuentaRegresiva({ titulo, subtitulo, fecha, textoBoton, enlaceBoton, textoFinal }: PropsCuentaRegresiva) {
  // Arranca en null para que el HTML del servidor y el del navegador coincidan.
  const [tiempo, setTiempo] = useState<ReturnType<typeof restante>>(null)

  useEffect(() => {
    setTiempo(restante(fecha))
    const reloj = setInterval(() => setTiempo(restante(fecha)), 1000)
    return () => clearInterval(reloj)
  }, [fecha])

  const terminado = tiempo !== null && tiempo.total === 0
  const unidades = [
    { valor: tiempo?.dias, etiqueta: 'días' },
    { valor: tiempo?.horas, etiqueta: 'horas' },
    { valor: tiempo?.minutos, etiqueta: 'min' },
    { valor: tiempo?.segundos, etiqueta: 'seg' },
  ]

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 text-center">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">{terminado && textoFinal ? textoFinal : titulo}</h2>
      {subtitulo && !terminado && <p className="mt-3 text-lg text-tinta/70">{subtitulo}</p>}
      {!fecha ? (
        <p className="mt-8 text-sm text-tinta/40">Elige la fecha de cierre en el editor.</p>
      ) : (
        !terminado && (
          <div className="mt-10 flex justify-center gap-3 sm:gap-5">
            {unidades.map((unidad) => (
              <div key={unidad.etiqueta} className="w-[72px] rounded-(--radius-marca) bg-marca px-2 py-4 text-marca-contraste sm:w-24 sm:py-5">
                <span className="block font-display text-3xl font-semibold tabular-nums sm:text-4xl">
                  {unidad.valor === undefined ? '--' : String(unidad.valor).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-xs tracking-wide uppercase opacity-80">{unidad.etiqueta}</span>
              </div>
            ))}
          </div>
        )
      )}
      {textoBoton && !terminado && (
        <a
          href={enlaceBoton || '#productos'}
          className="mt-10 inline-block rounded-(--radius-marca) border border-tinta/20 px-6 py-3 font-medium transition hover:bg-tinta/5"
        >
          {textoBoton}
        </a>
      )}
    </section>
  )
}
