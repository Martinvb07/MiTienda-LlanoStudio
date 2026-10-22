'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { SALIDA } from './ui/movimiento'

/** Cada pantalla del panel entra como las secciones de la portada: sube y se enfoca. */
export function TransicionPanel({ children }: { children: React.ReactNode }) {
  const ruta = usePathname()
  return (
    <motion.div
      key={ruta}
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      // Al terminar se quita el filtro: uno fijo, aunque sea blur(0), volvería
      // a este bloque el contenedor de cualquier `position: fixed` de adentro.
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ duration: 0.8, ease: SALIDA }}
    >
      {children}
    </motion.div>
  )
}
