'use client'

import { motion } from 'motion/react'
import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { MaquetaEditor } from './MaquetaEditor'

const ENTRADA = {
  oculto: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Trama tenue que se desvanece hacia abajo: da textura sin ensuciar. */}
      <div
        aria-hidden="true"
        className="trama-puntos pointer-events-none absolute inset-0 text-sitio-borde-fuerte [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />

      <Contenedor className="relative py-16 lg:py-24">
        <motion.div
          initial="oculto"
          animate="visible"
          transition={{ staggerChildren: 0.09, delayChildren: 0.05 }}
          className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16"
        >
          <div>
            <motion.div
              variants={ENTRADA}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-sitio-borde bg-white px-3 py-1.5 text-xs text-sitio-suave"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sitio-azul opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sitio-azul" />
              </span>
              Hecho en Colombia, para vender en Colombia
            </motion.div>

            <motion.h1
              variants={ENTRADA}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 font-display text-[2.75rem] leading-[1.03] font-bold tracking-[-0.035em] text-balance text-sitio-tinta sm:text-6xl"
            >
              Crea tu tienda online profesional en{' '}
              <span className="relative whitespace-nowrap text-sitio-azul">
                minutos
                {/* Subrayado dibujado a mano: rompe la rigidez del titular. */}
                <svg
                  viewBox="0 0 220 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-sitio-azul/35"
                >
                  <path
                    d="M2 8.5C40 3.5 92 2 130 4.5c30 2 58 4 88 1.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              .
            </motion.h1>

            <motion.p
              variants={ENTRADA}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-sitio-suave"
            >
              Diseña, personaliza y publica una tienda moderna sin escribir código. Arrastra
              bloques, sube tus productos y vende desde tu propio dominio.
            </motion.p>

            <motion.div
              variants={ENTRADA}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Boton href="/panel/crear-cuenta" tamano="grande" flecha>
                Comenzar gratis
              </Boton>
              <Boton href="/plantillas" variante="secundario" tamano="grande">
                Ver ejemplos
              </Boton>
            </motion.div>

            <motion.p
              variants={ENTRADA}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-sm text-sitio-tenue"
            >
              Sin tarjeta de crédito · Tu tienda en línea el mismo día
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <MaquetaEditor />
          </motion.div>
        </motion.div>
      </Contenedor>
    </section>
  )
}
