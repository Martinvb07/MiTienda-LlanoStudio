'use client'

import { motion } from 'motion/react'
import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { MaquetaEditor } from './MaquetaEditor'

const CIFRAS = [
  { valor: '0', etiqueta: 'líneas de código' },
  { valor: '1 día', etiqueta: 'para tener tu tienda en línea' },
  { valor: '0%', etiqueta: 'de comisión por venta' },
]

/**
 * Portada al estilo de llanostudio.co: titular enorme y centrado, un solo
 * botón, y el editor real como imagen protagonista debajo.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-[150px] md:pt-[190px]">
      <div aria-hidden="true" className="halo" />
      <div
        aria-hidden="true"
        className="cuadricula pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_55%_at_50%_0%,black,transparent)]"
      />

      <div className="entrada flex flex-col items-center px-5 text-center">
        <span className="antetitulo mb-[22px]">Hecho en Colombia, para vender en Colombia</span>
        <h1 className="titulo-1">
          Tu tienda en línea,
          <br />
          lista hoy
        </h1>
        <p className="bajada mx-auto mt-[22px] !text-base">
          Diseña tu tienda arrastrando bloques, sube tus productos y vende desde tu propio dominio.
          Sin escribir una sola línea de código.
        </p>
        <div className="mt-[34px] flex flex-wrap justify-center gap-3">
          <Boton href="/panel/crear-cuenta" flecha>
            Crear mi tienda gratis
          </Boton>
          <Boton href="/plantillas" variante="secundario">
            Ver plantillas
          </Boton>
        </div>
        <p className="mt-5 text-xs text-white/45">Sin tarjeta de crédito · Tu tienda en línea el mismo día</p>
      </div>

      <Contenedor className="mt-20 md:mt-24">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-[10%] -top-10 -z-10 h-40 rounded-full bg-sitio-azul/25 blur-[90px]"
          />
          <MaquetaEditor />
        </motion.div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 border-t border-sitio-borde pt-10 text-center">
          {CIFRAS.map((cifra) => (
            <div key={cifra.etiqueta}>
              <dt className="sr-only">{cifra.etiqueta}</dt>
              <dd className="text-[clamp(28px,4vw,44px)] leading-none font-normal tracking-[-0.04em]">
                {cifra.valor}
              </dd>
              <dd className="mt-2 text-xs text-sitio-tenue">{cifra.etiqueta}</dd>
            </div>
          ))}
        </dl>
      </Contenedor>
    </section>
  )
}
