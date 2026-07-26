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
      <div className="overflow-hidden rounded-2xl border border-sitio-borde bg-white shadow-[0_24px_60px_-24px_rgba(10,15,28,0.28)]">
        {/* Barra del navegador */}
        <div className="flex items-center gap-2 border-b border-sitio-borde bg-sitio-crema px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f4655a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5bd4f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#61c454]" />
          <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-[11px] text-sitio-tenue">
            tunegocio.llanostudio.co
          </div>
          <span className="rounded-md bg-sitio-azul px-2.5 py-1 text-[11px] font-medium text-white">
            Publicar
          </span>
        </div>

        <div className="flex">
          {/* Panel de bloques */}
          <div className="w-[168px] shrink-0 border-r border-sitio-borde bg-white p-3">
            <p className="mb-3 font-display text-[10px] font-medium tracking-[0.14em] text-sitio-tenue uppercase">
              Secciones
            </p>
            <div className="flex flex-col gap-2">
              <Chip nombre="Portada" tono="bg-sitio-azul" />
              <Chip nombre="Grilla" clave="grilla" tono="bg-[#7c9df0]" />
              <Chip nombre="Texto" clave="texto" tono="bg-[#a8bdf5]" activo />
              <Chip nombre="Pie" tono="bg-[#c9d6f9]" />
            </div>
          </div>

          {/* Vista previa */}
          <div className="flex-1 bg-sitio-crema p-4">
            <div className="flex flex-col gap-3">
              <div className="h-24 rounded-lg bg-gradient-to-br from-sitio-azul to-sitio-profundo p-4">
                <div className="h-2.5 w-24 rounded-full bg-white/85" />
                <div className="mt-2 h-1.5 w-32 rounded-full bg-white/45" />
                <div className="mt-3 h-4 w-16 rounded-full bg-white/90" />
              </div>

              <div data-vista="grilla" className="h-20 rounded-lg bg-white p-3">
                <div className="mb-2 h-1.5 w-14 rounded-full bg-sitio-borde-fuerte" />
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((indice) => (
                    <div key={indice} className="h-9 rounded bg-sitio-crema" />
                  ))}
                </div>
              </div>

              <div data-vista="texto" className="h-20 rounded-lg bg-white p-3">
                <div className="h-1.5 w-16 rounded-full bg-sitio-borde-fuerte" />
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-sitio-crema" />
                  <div className="h-1.5 w-5/6 rounded-full bg-sitio-crema" />
                  <div className="h-1.5 w-2/3 rounded-full bg-sitio-crema" />
                </div>
              </div>

              <div className="h-10 rounded-lg bg-white p-3">
                <div className="h-1.5 w-20 rounded-full bg-sitio-crema" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cursor de la demostración */}
      <div
        data-cursor
        className="pointer-events-none absolute top-[178px] left-[124px] opacity-0"
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5 drop-shadow-md">
          <path d="M4 2l12 7-5.5 1.5L8 16 4 2z" fill="#0a0f1c" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  )
}

function Chip({
  nombre,
  tono,
  clave,
  activo = false,
}: {
  nombre: string
  tono: string
  clave?: string
  activo?: boolean
}) {
  return (
    <div
      data-chip={clave}
      className={`relative flex h-11 items-center gap-2.5 rounded-lg border px-2.5 ${
        activo ? 'border-sitio-azul bg-blue-50/60' : 'border-sitio-borde bg-white'
      }`}
    >
      {activo && (
        <span
          data-sombra
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 shadow-[0_10px_22px_-6px_rgba(37,99,235,0.45)]"
        />
      )}
      <span className="flex flex-col gap-[3px] text-sitio-tenue">
        <span className="block h-[2px] w-3 rounded bg-current" />
        <span className="block h-[2px] w-3 rounded bg-current" />
        <span className="block h-[2px] w-3 rounded bg-current" />
      </span>
      <span className={`h-6 w-6 shrink-0 rounded ${tono}`} />
      <span className="text-xs font-medium text-sitio-tinta">{nombre}</span>
    </div>
  )
}
