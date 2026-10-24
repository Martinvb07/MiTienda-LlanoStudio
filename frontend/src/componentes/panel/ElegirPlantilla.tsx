'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { ArrowRight, Lock, Plus } from 'lucide-react'
import type { TipoSitio } from '@/tipos/tienda'
import { PLANES, planIncluye } from '@/utilidades/planes'
import { plantillasDe } from '@/utilidades/plantillasPagina'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { CURVA } from './ui/basicos'

/**
 * Lo primero después de crear la cuenta: elegir con qué plantilla arranca el
 * sitio (o empezar en blanco). Recién ahí se abre el editor, con ella puesta.
 */
export function ElegirPlantilla({
  tipo,
  alElegir,
  alSaltar,
}: {
  tipo: TipoSitio | undefined
  alElegir: (clave: string | null) => void
  alSaltar: () => void
}) {
  const plan = useSesion().sesion.tenant.plan
  const plantillas = plantillasDe(tipo)

  return (
    <>
      <CabeceraPanel
        titulo="Elige cómo empieza"
        descripcion="Toma una plantilla y cámbiale lo que quieras: textos, fotos, colores y secciones."
        accion={
          <button type="button" onClick={alSaltar} className="text-[12.5px] text-sitio-tenue transition-colors hover:text-white">
            Ahora no
          </button>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plantillas.map((plantilla, indice) => {
          const incluida = planIncluye(plan, plantilla.plan)
          return (
            <motion.li
              key={plantilla.clave}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: Math.min(indice, 8) * 0.05, ease: CURVA }}
            >
              <button
                type="button"
                disabled={!incluida}
                onClick={() => alElegir(plantilla.clave)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-[14px] border border-sitio-borde bg-sitio-superficie text-left transition-[border-color,transform] duration-500 ease-salida enabled:hover:-translate-y-1 enabled:hover:border-white/30 disabled:cursor-not-allowed"
              >
                <span className="relative block aspect-[16/10] overflow-hidden border-b border-sitio-borde bg-sitio-campo">
                  <Image
                    src={plantilla.captura}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover object-top transition-transform duration-700 ease-salida group-enabled:group-hover:scale-[1.03] group-disabled:opacity-40"
                  />
                </span>
                <span className="flex flex-1 items-center justify-between gap-3 p-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-medium">{plantilla.nombre}</span>
                    <span className="block truncate text-[12px] text-sitio-tenue">{plantilla.categoria}</span>
                  </span>
                  {incluida ? (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sitio-borde text-sitio-suave transition-colors group-hover:border-white group-hover:bg-white group-hover:text-black">
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] text-sitio-tenue">
                      <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                      Plan {PLANES[plantilla.plan].nombre}
                    </span>
                  )}
                </span>
              </button>
            </motion.li>
          )
        })}

        <motion.li
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: Math.min(plantillas.length, 8) * 0.05, ease: CURVA }}
        >
          <button
            type="button"
            onClick={() => alElegir(null)}
            className="group grid h-full min-h-[220px] w-full place-items-center rounded-[14px] border border-dashed border-sitio-borde text-center transition-colors duration-500 hover:border-white/30"
          >
            <span className="flex flex-col items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-sitio-borde text-sitio-suave transition-colors group-hover:border-white group-hover:text-white">
                <Plus aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="text-[14px]">Empezar en blanco</span>
              <span className="text-[12px] text-sitio-tenue">Arma tus secciones desde cero.</span>
            </span>
          </button>
        </motion.li>
      </ul>
    </>
  )
}
