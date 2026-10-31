'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Retardo en segundos, para escalonar elementos hermanos. */
  retardo?: number
  className?: string
}

/**
 * Aparición al entrar en pantalla, igual que en llanostudio.co: sube 34 px,
 * se enfoca desde un desenfoque de 6 px y llega frenando (curva out-expo, más
 * de un segundo). Es lenta a propósito: se asienta, no salta.
 */
export function Revelar({ children, retardo = 0, className }: Props) {
  return (
    <motion.div
      data-revelar=""
      className={className}
      initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        opacity: { duration: 1.1, delay: retardo, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 1.1, delay: retardo, ease: [0.16, 1, 0.3, 1] },
        y: { duration: 1.3, delay: retardo, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      {children}
    </motion.div>
  )
}
