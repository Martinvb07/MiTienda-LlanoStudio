'use client'

import { motion } from 'motion/react'
import { Boton } from './Boton'
import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'

const PLANTILLAS = [
  {
    nombre: 'Colección de Moda',
    categoria: 'Ropa y accesorios',
    desde: 'from-[#1e293b]',
    hasta: 'to-[#475569]',
    columnas: 2,
  },
  {
    nombre: 'Tecnología & Gadgets',
    categoria: 'Electrónica',
    desde: 'from-sitio-azul',
    hasta: 'to-sitio-profundo',
    columnas: 3,
    destacada: true,
  },
  {
    nombre: 'Hogar & Estilo de Vida',
    categoria: 'Decoración',
    desde: 'from-[#b45309]',
    hasta: 'to-[#78350f]',
    columnas: 2,
  },
]

export function Plantillas() {
  return (
    <section id="plantillas" className="bg-white py-20 lg:py-28">
      <Contenedor>
        <Revelar className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Rotulo indice="—">Plantillas</Rotulo>
            <h2 className="mt-5 font-display text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-balance text-sitio-tinta sm:text-5xl">
              Empezá con un diseño que ya funciona
            </h2>
            <p className="mt-4 text-pretty text-sitio-suave">
              Cada plantilla es un punto de partida, no una jaula: podés mover, quitar y agregar
              bloques sin perder nada de lo que ya cargaste.
            </p>
          </div>
          <Boton href="/panel/ingresar" variante="secundario" flecha className="shrink-0">
            Ver todas
          </Boton>
        </Revelar>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANTILLAS.map((plantilla, indice) => (
            <Revelar key={plantilla.nombre} retardo={indice * 0.08}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="group h-full overflow-hidden rounded-2xl border border-sitio-borde bg-white"
              >
                {/* Miniatura: una tienda esquematizada, no una captura. */}
                <div className="relative overflow-hidden bg-sitio-crema p-4">
                  {plantilla.destacada && (
                    <span className="absolute top-6 right-6 z-10 rounded-full bg-sitio-tinta px-2.5 py-1 text-[11px] font-medium text-white">
                      Más usada
                    </span>
                  )}

                  <div className="space-y-2 rounded-xl bg-white p-2.5 shadow-sm">
                    <div
                      className={`h-20 rounded-lg bg-gradient-to-br ${plantilla.desde} ${plantilla.hasta} p-3`}
                    >
                      <div className="h-2 w-16 rounded-full bg-white/85" />
                      <div className="mt-1.5 h-1.5 w-24 rounded-full bg-white/45" />
                    </div>

                    <div
                      className={`grid gap-1.5 ${
                        plantilla.columnas === 3 ? 'grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      {Array.from({ length: plantilla.columnas * 2 }).map((_, celda) => (
                        <div
                          key={celda}
                          className="h-9 rounded bg-sitio-crema transition-colors duration-500 group-hover:bg-sitio-borde"
                        />
                      ))}
                    </div>

                    <div className="h-4 rounded bg-sitio-crema" />
                  </div>
                </div>

                <div className="border-t border-sitio-borde px-5 py-4">
                  <h3 className="font-display font-semibold text-sitio-tinta">{plantilla.nombre}</h3>
                  <p className="mt-0.5 text-sm text-sitio-tenue">{plantilla.categoria}</p>
                </div>
              </motion.article>
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
