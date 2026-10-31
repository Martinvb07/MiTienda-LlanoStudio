'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { GaleriaPlantillas } from './GaleriaPlantillas'
import { MENU_PLANTILLAS, type OpcionMenu } from './productos'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { PLANTILLAS_ENLACES } from '@/utilidades/plantillasEnlaces'
import { PLANTILLAS_PAGINA } from '@/utilidades/plantillasPagina'

const SALIDA = [0.16, 1, 0.3, 1] as const

/** Entra y sale como lo demás del sitio: con desenfoque y frenando. */
const CAMBIO = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
  transition: { duration: 0.6, ease: SALIDA },
} as const

/** En el celular no caben los nombres completos. */
const CORTOS: Record<OpcionMenu['clave'], string> = { tienda: 'Tienda', pagina: 'Página', enlaces: 'Enlaces' }

const TEXTOS: Record<OpcionMenu['clave'], { titulo: string; texto: string }> = {
  tienda: {
    titulo: 'Empieza con una tienda que ya vende',
    texto: `${PLANTILLAS_TIENDA.length} tiendas de ejemplo, cuatro de ellas pro. Abre una para verla completa.`,
  },
  pagina: {
    titulo: 'Una página hecha para tu oficio',
    texto: `${PLANTILLAS_PAGINA.length} páginas por oficio: abogados, salud, comida, belleza y más.`,
  },
  enlaces: {
    titulo: 'Un link de la bio con tu estilo',
    texto: `${PLANTILLAS_ENLACES.length} plantillas para creadores, artistas y negocios que viven en redes.`,
  },
}

/**
 * Adelanto en la portada: tres plantillas con su captura real, con pestañas
 * para ver las de la tienda, la página o los enlaces sin salir del inicio.
 */
export function Plantillas() {
  const [actual, setActual] = useState<OpcionMenu['clave']>('tienda')
  const opcion = MENU_PLANTILLAS.find((otra) => otra.clave === actual)!

  return (
    <section id="plantillas" className="py-[72px] md:py-[112px]">
      <Contenedor>
        <Revelar className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="antetitulo mb-[22px]">Plantillas</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2 key={actual} {...CAMBIO} className="titulo-2 max-w-[13ch]">
                {TEXTOS[actual].titulo}
              </motion.h2>
            </AnimatePresence>
          </div>
          <div className="md:max-w-[34ch]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={actual} {...CAMBIO} className="bajada">
                {TEXTOS[actual].texto}
              </motion.p>
            </AnimatePresence>
            <Boton href={opcion.href} variante="secundario" tamano="normal" flecha className="mt-6">
              Ver todas
            </Boton>
          </div>
        </Revelar>

        <Revelar className="mb-10">
          <div role="tablist" aria-label="Producto" className="relative isolate inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/12 bg-white/[0.03] p-1">
            {MENU_PLANTILLAS.map((otra) => {
              const elegido = otra.clave === actual
              return (
                <button
                  key={otra.clave}
                  type="button"
                  role="tab"
                  aria-selected={elegido}
                  onClick={() => setActual(otra.clave)}
                  className={cn(
                    'relative inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] tracking-[-0.005em] transition-colors duration-500 ease-salida sm:px-4',
                    elegido ? 'text-black' : 'text-white/60 hover:text-white',
                  )}
                >
                  {/* La píldora blanca se desliza de una pestaña a otra. */}
                  {elegido && (
                    <motion.span
                      layoutId="pestana-plantillas"
                      transition={{ duration: 0.7, ease: SALIDA }}
                      className="absolute inset-0 -z-10 rounded-full bg-white"
                    />
                  )}
                  <otra.icono aria-hidden="true" strokeWidth={1.6} className="h-[15px] w-[15px] shrink-0" />
                  <span className="whitespace-nowrap sm:hidden">{CORTOS[otra.clave]}</span>
                  <span className="hidden whitespace-nowrap sm:inline">{otra.nombre}</span>
                </button>
              )
            })}
          </div>
        </Revelar>

        {/*
          La galería anterior se desvanece mientras la nueva entra con sus
          tarjetas escalonadas. Comparten la misma celda para que la sección
          no se encoja en el cambio.
        */}
        <div className="grid">
          <AnimatePresence initial={false}>
            <motion.div
              key={actual}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: SALIDA }}
              className="[grid-area:1/1]"
            >
              <GaleriaPlantillas limite={3} tipo={actual} pro={actual === 'tienda' ? true : undefined} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Contenedor>
    </section>
  )
}
