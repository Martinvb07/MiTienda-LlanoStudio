'use client'

import { useEffect, useRef } from 'react'
import { createScope, createTimeline, type Scope } from 'animejs'

/**
 * Maqueta del editor de bloques que se demuestra sola.
 *
 * Es el argumento de venta convertido en imagen: en vez de contar que el
 * editor es de arrastrar y soltar, se ve un cursor agarrando un bloque,
 * moviéndolo y soltándolo, con la vista previa reordenándose a la par.
 *
 * Va con anime.js y no con Motion porque es una coreografía imperativa en
 * bucle, con media docena de elementos entrando y saliendo en momentos
 * distintos. Eso es justo lo que una línea de tiempo resuelve bien y lo que
 * un componente declarativo vuelve enrevesado.
 */

const PASO_CHIP = 52 // alto del chip (44) + separación (8)
const PASO_VISTA = 92 // alto del bloque (80) + separación (12)

export function MaquetaEditor() {
  const raiz = useRef<HTMLDivElement>(null)
  const ambito = useRef<Scope | null>(null)

  useEffect(() => {
    if (!raiz.current) return

    // Quien pidió menos movimiento en su sistema ve la maqueta quieta.
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (sinMovimiento) return

    ambito.current = createScope({ root: raiz }).add(() => {
      const linea = createTimeline({
        loop: true,
        defaults: { ease: 'inOut(2)', duration: 620 },
      })

      linea
        // El cursor entra y se posa sobre el bloque de texto.
        .add('[data-cursor]', { opacity: [0, 1], x: [24, 0], y: [34, 0], duration: 520 }, 300)
        // Lo agarra: se levanta un punto y aparece su sombra.
        .add('[data-chip="texto"]', { scale: [1, 1.04] }, 900)
        .add('[data-sombra]', { opacity: [0, 1] }, 900)
        // Lo sube una posición; la grilla baja para dejarle el hueco.
        .add('[data-chip="texto"]', { y: [0, -PASO_CHIP] }, 1150)
        .add('[data-chip="grilla"]', { y: [0, PASO_CHIP] }, 1150)
        .add('[data-cursor]', { y: [0, -PASO_CHIP] }, 1150)
        // La vista previa reordena lo mismo, a su propia escala.
        .add('[data-vista="texto"]', { y: [0, -PASO_VISTA] }, 1150)
        .add('[data-vista="grilla"]', { y: [0, PASO_VISTA] }, 1150)
        // Lo suelta.
        .add('[data-chip="texto"]', { scale: [1.04, 1] }, 1850)
        .add('[data-sombra]', { opacity: [1, 0] }, 1850)
        .add('[data-cursor]', { opacity: [1, 0], duration: 420 }, 2200)
        // Vuelve al estado inicial para que el bucle no dé un salto seco.
        .add('[data-chip="texto"]', { y: [-PASO_CHIP, 0] }, 3400)
        .add('[data-chip="grilla"]', { y: [PASO_CHIP, 0] }, 3400)
        .add('[data-vista="texto"]', { y: [-PASO_VISTA, 0] }, 3400)
        .add('[data-vista="grilla"]', { y: [PASO_VISTA, 0] }, 3400)
    })

    return () => {
      ambito.current?.revert()
    }
  }, [])

  return (
    <div ref={raiz} className="relative">
      {/* Réplica del editor real del panel: barra superior, secciones a la
          izquierda y la tienda en vivo a la derecha. */}
      <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#050505] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex h-12 items-center gap-3 border-b border-sitio-borde bg-[#0a0a0b] px-4">
          <span className="text-[11px] text-sitio-tenue">← Panel</span>
          <span className="text-[13px] font-medium">Ropa Llanera</span>
          <span className="rounded-full border border-sitio-verde/30 bg-sitio-verde/10 px-2 py-0.5 text-[9.5px] font-semibold text-sitio-verde">
            Publicada
          </span>
          <span className="ml-auto hidden rounded-md border border-sitio-borde bg-white/5 p-0.5 text-[10.5px] sm:flex">
            <span className="rounded bg-white/12 px-2 py-1 text-white">Escritorio</span>
            <span className="px-2 py-1 text-sitio-tenue">Móvil</span>
          </span>
          <span className="rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-black">Guardar</span>
        </div>

        <div className="flex">
          {/* Secciones */}
          <div className="w-[150px] shrink-0 border-r border-sitio-borde bg-[#0a0a0b] p-3 sm:w-[190px]">
            <p className="mb-3 text-[10px] tracking-[0.14em] text-sitio-tenue uppercase">Secciones</p>
            <div className="flex flex-col gap-2">
              <Chip nombre="Portada" />
              <Chip nombre="Productos" clave="grilla" />
              <Chip nombre="Texto" clave="texto" activo />
              <Chip nombre="Pie" />
            </div>
          </div>

          {/* Vista previa: la tienda del cliente, con su propio tema claro */}
          <div className="flex-1 bg-[radial-gradient(circle_at_50%_0%,#17171a,#0b0b0c_70%)] p-4 sm:p-6">
            <div className="overflow-hidden rounded-md bg-[#f7f5f0] p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
              <div className="flex flex-col gap-3">
                <div className="h-24 rounded bg-gradient-to-br from-[#1e2a5a] to-[#0a0f1c] p-4">
                  <div className="h-2.5 w-24 rounded-full bg-white/85" />
                  <div className="mt-2 h-1.5 w-32 rounded-full bg-white/45" />
                  <div className="mt-3 h-4 w-16 rounded-sm bg-white/90" />
                </div>

                <div data-vista="grilla" className="h-20 rounded bg-white p-3">
                  <div className="mb-2 h-1.5 w-14 rounded-full bg-black/15" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((indice) => (
                      <div key={indice} className="h-9 rounded-sm bg-[#ece8df]" />
                    ))}
                  </div>
                </div>

                <div data-vista="texto" className="h-20 rounded bg-white p-3">
                  <div className="h-1.5 w-16 rounded-full bg-black/15" />
                  <div className="mt-2.5 space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-[#ece8df]" />
                    <div className="h-1.5 w-5/6 rounded-full bg-[#ece8df]" />
                    <div className="h-1.5 w-2/3 rounded-full bg-[#ece8df]" />
                  </div>
                </div>

                <div className="h-10 rounded bg-white p-3">
                  <div className="h-1.5 w-20 rounded-full bg-[#ece8df]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cursor de la demostración */}
      <div
        data-cursor
        className="pointer-events-none absolute top-[188px] left-[112px] opacity-0 sm:left-[140px]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5 drop-shadow-md">
          <path d="M4 2l12 7-5.5 1.5L8 16 4 2z" fill="#ffffff" stroke="#000" strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  )
}

function Chip({ nombre, clave, activo = false }: { nombre: string; clave?: string; activo?: boolean }) {
  return (
    <div
      data-chip={clave}
      className={`relative flex h-11 items-center gap-2.5 rounded-lg border px-2.5 ${
        activo ? 'border-white/40 bg-white/[0.07]' : 'border-sitio-borde bg-[#121214]'
      }`}
    >
      {activo && (
        <span
          data-sombra
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 shadow-[0_12px_26px_-6px_rgba(59,96,255,0.55)]"
        />
      )}
      <span className="flex flex-col gap-[3px] text-sitio-tenue">
        <span className="block h-[2px] w-3 rounded bg-current" />
        <span className="block h-[2px] w-3 rounded bg-current" />
        <span className="block h-[2px] w-3 rounded bg-current" />
      </span>
      <span className="text-xs font-medium text-white">{nombre}</span>
    </div>
  )
}
