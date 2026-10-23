'use client'

import { useEffect, useState } from 'react'
import { ARRASTRE_PIEZA, ARRASTRE_SECCION, type MensajeSoltar } from './mensajes'

type Marca = { clase: 'pieza'; caja: DOMRect; x: number; y: number } | { clase: 'seccion'; arriba: number } | null

const esMovil = () => window.matchMedia('(max-width: 640px)').matches

/** La sección bajo el puntero y, para una sección nueva, antes de cuál va (null = al final). */
function ubicar(evento: DragEvent) {
  const secciones = [...document.querySelectorAll<HTMLElement>('[data-bloque]')].filter((nodo) => nodo.offsetHeight > 0)
  const bajo = (evento.target as HTMLElement | null)?.closest<HTMLElement>('[data-bloque]') ?? null
  const siguiente = secciones.find((nodo) => {
    const caja = nodo.getBoundingClientRect()
    return evento.clientY < caja.top + caja.height / 2
  })
  return { bajo, siguiente: siguiente ?? null, ultima: secciones.at(-1) ?? null }
}

/**
 * Recibe lo que se arrastra desde la paleta del editor: marca dónde va a caer
 * (una línea entre secciones, o la sección y el punto) y al soltar se lo
 * avisa al editor, que es el que cambia la página.
 */
export function SoltarEnVista() {
  const [marca, setMarca] = useState<Marca>(null)

  useEffect(() => {
    const claseDe = (evento: DragEvent) =>
      evento.dataTransfer?.types.includes(ARRASTRE_PIEZA) ? 'pieza' : evento.dataTransfer?.types.includes(ARRASTRE_SECCION) ? 'seccion' : null

    function alPasar(evento: DragEvent) {
      const clase = claseDe(evento)
      if (!clase) return
      evento.preventDefault()
      if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'copy'
      const { bajo, siguiente, ultima } = ubicar(evento)
      if (clase === 'pieza' && bajo) {
        const caja = bajo.getBoundingClientRect()
        setMarca({ clase, caja, x: evento.clientX, y: evento.clientY })
      } else if (clase === 'seccion') {
        const arriba = siguiente ? siguiente.getBoundingClientRect().top : (ultima?.getBoundingClientRect().bottom ?? 0)
        setMarca({ clase, arriba })
      }
    }
    function alSoltar(evento: DragEvent) {
      const clase = claseDe(evento)
      if (!clase) return
      evento.preventDefault()
      setMarca(null)
      const que = evento.dataTransfer?.getData(clase === 'pieza' ? ARRASTRE_PIEZA : ARRASTRE_SECCION) ?? ''
      const { bajo, siguiente } = ubicar(evento)
      let mensaje: MensajeSoltar
      if (clase === 'pieza') {
        if (!bajo) return
        const lienzo = bajo.querySelector<HTMLElement>('[data-lienzo]') ?? bajo
        const caja = lienzo.getBoundingClientRect()
        mensaje = {
          tipo: 'mt-soltar',
          clase,
          que,
          bloque: bajo.dataset.bloque ?? null,
          x: ((evento.clientX - caja.left) / caja.width) * 100,
          y: ((evento.clientY - caja.top) / caja.height) * 100,
          movil: esMovil(),
        }
      } else {
        mensaje = { tipo: 'mt-soltar', clase, que, bloque: siguiente?.dataset.bloque ?? null, movil: esMovil() }
      }
      window.parent.postMessage(mensaje, window.location.origin)
    }
    const limpiar = () => setMarca(null)
    const salir = (evento: DragEvent) => !evento.relatedTarget && limpiar()
    document.addEventListener('dragover', alPasar)
    document.addEventListener('drop', alSoltar)
    document.addEventListener('dragleave', salir)
    document.addEventListener('dragend', limpiar)
    return () => {
      document.removeEventListener('dragover', alPasar)
      document.removeEventListener('drop', alSoltar)
      document.removeEventListener('dragleave', salir)
      document.removeEventListener('dragend', limpiar)
    }
  }, [])

  if (!marca) return null
  if (marca.clase === 'seccion')
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-6 z-[95] -translate-y-1/2" style={{ top: marca.arriba }}>
        <div className="h-[3px] rounded-full bg-[#3b60ff] shadow-[0_0_14px_rgba(59,96,255,0.8)]" />
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3b60ff] px-2.5 py-0.5 font-sans text-[11px] font-medium text-white">
          Soltar aquí
        </span>
      </div>
    )
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[95] rounded-[3px] outline-2 -outline-offset-2 outline-[#3b60ff] outline-dashed"
        style={{ top: marca.caja.top, left: marca.caja.left, width: marca.caja.width, height: marca.caja.height }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none fixed z-[96] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3b60ff] ring-4 ring-[#3b60ff]/30"
        style={{ top: marca.y, left: marca.x }}
      />
    </>
  )
}
