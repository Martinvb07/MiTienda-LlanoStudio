'use client'

import { motion } from 'motion/react'
import { PLANES } from '@/utilidades/planes'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { MiniaturaPlantilla } from './MiniaturaPlantilla'

/**
 * Tarjeta de plantilla del sitio: miniatura con sus colores, categoría y desde
 * qué plan está. Recibe la clave y no el objeto, porque la plantilla lleva una
 * función y los componentes de servidor no pueden pasarle funciones a este.
 */
export function TarjetaPlantilla({ clave }: { clave: string }) {
  const plantilla = PLANTILLAS_TIENDA.find((opcion) => opcion.clave === clave)
  if (!plantilla) return null

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group baldosa h-full overflow-hidden"
    >
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#17171a,#0b0b0c_70%)] p-5">
        {plantilla.destacada && (
          <span className="absolute top-6 right-6 z-10 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-black">
            Más usada
          </span>
        )}
        <MiniaturaPlantilla plantilla={plantilla} />
      </div>

      <div className="flex items-start justify-between gap-3 border-t border-sitio-borde px-5 py-4">
        <div>
          <h3 className="font-medium tracking-[-0.01em] text-sitio-tinta">{plantilla.nombre}</h3>
          <p className="mt-0.5 text-sm text-sitio-tenue">{plantilla.categoria}</p>
        </div>
        <span
          className={
            plantilla.plan === 'GRATIS'
              ? 'rounded-full border border-sitio-verde/30 bg-sitio-verde/10 px-2.5 py-1 text-[11px] text-sitio-verde'
              : 'rounded-full border border-sitio-azul-claro/30 bg-sitio-azul/10 px-2.5 py-1 text-[11px] text-sitio-azul-claro'
          }
        >
          {plantilla.plan === 'GRATIS' ? 'Gratis' : `Plan ${PLANES[plantilla.plan].nombre}`}
        </span>
      </div>
    </motion.article>
  )
}
