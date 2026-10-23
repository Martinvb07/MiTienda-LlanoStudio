'use client'

import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import type { TipoElementoLienzo } from '@/tipos/bloques'
import { CURVA } from '../ui/basicos'
import { GRUPOS_PIEZAS } from './piezasLienzo'

/**
 * Columna a la derecha de la vista previa mientras se edita un lienzo libre:
 * todo lo que se le puede poner, a un clic. La pieza nueva aparece en el
 * centro, ya elegida, lista para moverla.
 */
export function PaletaLienzo({ alAgregar }: { alAgregar: (tipo: TipoElementoLienzo) => void }) {
  return (
    <motion.aside
      aria-label="Agregar al lienzo"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 84, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.45, ease: CURVA }}
      className="min-h-0 overflow-hidden border-l border-sitio-borde bg-sitio-lateral"
    >
      <div className="flex h-full w-[84px] flex-col overflow-y-auto overscroll-contain px-2 pt-3 pb-6">
        <p className="mb-2 flex items-center justify-center gap-1 text-[10.5px] font-medium text-sitio-suave">
          <Plus aria-hidden="true" className="h-3 w-3" />
          Agregar
        </p>
        {GRUPOS_PIEZAS.map((grupo, indiceGrupo) => (
          <div key={grupo.titulo} className="flex flex-col gap-1 border-t border-sitio-borde py-2.5 first-of-type:border-t-0">
            <span className="text-center text-[9.5px] tracking-[0.1em] text-sitio-tenue uppercase">{grupo.titulo}</span>
            {grupo.piezas.map(({ tipo, etiqueta, Icono, detalle }, indice) => (
              <motion.button
                key={tipo}
                type="button"
                title={detalle}
                onClick={() => alAgregar(tipo)}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.05 + (indiceGrupo * 3 + indice) * 0.015, ease: CURVA }}
                className="group flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] leading-tight text-sitio-suave transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <Icono aria-hidden="true" className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.6} />
                {etiqueta}
              </motion.button>
            ))}
          </div>
        ))}
      </div>
    </motion.aside>
  )
}
