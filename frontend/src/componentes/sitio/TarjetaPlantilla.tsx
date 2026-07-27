'use client'

import { motion } from 'motion/react'
import type { DatosPlantilla } from './datosPlantillas'

/**
 * Miniatura de plantilla. La usan tanto la portada como el catálogo completo,
 * así que vive aparte en vez de duplicarse en las dos.
 *
 * Los datos están en datosPlantillas.ts, fuera de este archivo: aquí no pueden
 * estar porque este módulo es de cliente.
 */
export function TarjetaPlantilla({ plantilla }: { plantilla: DatosPlantilla }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full overflow-hidden rounded-2xl border border-sitio-borde bg-white"
    >
      {/* Tienda esquematizada, no una captura: pesa nada y no envejece. */}
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
            className={`grid gap-1.5 ${plantilla.columnas === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
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
  )
}
