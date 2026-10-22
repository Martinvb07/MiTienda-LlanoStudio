'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { ETIQUETAS_BLOQUE, type Bloque } from '@/tipos/bloques'
import type { AccionSeccion, MensajeAccionVista } from './mensajes'

function avisar(id: string, accion: AccionSeccion) {
  window.parent.postMessage({ tipo: 'mt-vista-accion', id, accion } satisfies MensajeAccionVista, window.location.origin)
}

/**
 * Sobre la vista previa: al pasar por una sección la marca y muestra una barra
 * con sus acciones; un clic en la sección la abre en el editor. Todo se le
 * pide al editor por postMessage: aquí no se cambia nada.
 */
export function BarraSeccion({ bloques }: { bloques: Bloque[] }) {
  const [sobre, setSobre] = useState<string | null>(null)
  const [caja, setCaja] = useState<DOMRect | null>(null)

  useEffect(() => {
    function alMover(evento: MouseEvent) {
      const objetivo = evento.target as HTMLElement
      if (objetivo.closest('[data-barra-seccion]')) return
      const seccion = objetivo.closest<HTMLElement>('[data-bloque]')
      setSobre(seccion?.dataset.bloque ?? null)
    }
    function alClic(evento: MouseEvent) {
      const objetivo = evento.target as HTMLElement
      if (objetivo.closest('[data-barra-seccion]')) return
      const seccion = objetivo.closest<HTMLElement>('[data-bloque]')
      if (seccion?.dataset.bloque) avisar(seccion.dataset.bloque, 'elegir')
    }
    function alSalir() {
      setSobre(null)
    }
    document.addEventListener('mouseover', alMover)
    document.addEventListener('click', alClic)
    document.documentElement.addEventListener('mouseleave', alSalir)
    return () => {
      document.removeEventListener('mouseover', alMover)
      document.removeEventListener('click', alClic)
      document.documentElement.removeEventListener('mouseleave', alSalir)
    }
  }, [])

  // La caja se mide en cada cuadro mientras haya una sección marcada: así sigue
  // al scroll, a las imágenes que cargan y a las animaciones de entrada.
  useEffect(() => {
    if (!sobre) {
      setCaja(null)
      return
    }
    let cuadro = 0
    const medir = () => {
      const nodo = document.querySelector(`[data-bloque="${CSS.escape(sobre)}"]`)
      setCaja(nodo ? nodo.getBoundingClientRect() : null)
      cuadro = requestAnimationFrame(medir)
    }
    medir()
    return () => cancelAnimationFrame(cuadro)
  }, [sobre])

  const indice = bloques.findIndex((bloque) => bloque.id === sobre)
  const bloque = bloques[indice]
  if (!sobre || !caja || !bloque) return null

  const acciones: { accion: AccionSeccion; etiqueta: string; Icono: typeof ArrowUp; deshabilitado?: boolean }[] = [
    { accion: 'elegir', etiqueta: 'Editar', Icono: Pencil },
    { accion: 'subir', etiqueta: 'Subir', Icono: ArrowUp, deshabilitado: indice === 0 },
    { accion: 'bajar', etiqueta: 'Bajar', Icono: ArrowDown, deshabilitado: indice === bloques.length - 1 },
    { accion: 'duplicar', etiqueta: 'Duplicar', Icono: Copy },
    { accion: 'ocultar', etiqueta: 'Ocultar', Icono: EyeOff },
    { accion: 'eliminar', etiqueta: 'Eliminar', Icono: Trash2 },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[90] rounded-[3px] outline-2 -outline-offset-2 outline-[#3b60ff]"
      style={{ top: caja.top, left: caja.left, width: caja.width, height: caja.height }}
    >
      <div
        data-barra-seccion
        className="pointer-events-auto absolute flex items-center gap-0.5 rounded-lg bg-[#111] p-1 font-sans text-white shadow-[0_10px_30px_-6px_rgba(0,0,0,0.6)]"
        style={{ top: Math.max(8, 8 - caja.top), right: 8 }}
      >
        <span className="px-2 text-[11px] font-medium whitespace-nowrap text-white/70">{ETIQUETAS_BLOQUE[bloque.tipo]}</span>
        {acciones.map(({ accion, etiqueta, Icono, deshabilitado }) => (
          <button
            key={accion}
            type="button"
            title={etiqueta}
            disabled={deshabilitado}
            onClick={() => avisar(bloque.id, accion)}
            className={`grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-white/15 disabled:opacity-30 ${
              accion === 'eliminar' ? 'hover:!bg-red-500/80' : ''
            }`}
          >
            <Icono className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
