'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Retardo en segundos, para escalonar elementos hermanos. */
  retardo?: number
  desplazamiento?: number
  className?: string
}

/**
 * Aparición al entrar en pantalla.
 *
 * La curva es un ease-out muy pronunciado: el elemento llega rápido y frena
 * al final, que es lo que hace que se lea como algo que se asienta y no como
 * algo que se desliza.
 */
export function Revelar({ children, retardo = 0, desplazamiento = 22, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: desplazamiento }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.7, delay: retardo, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
