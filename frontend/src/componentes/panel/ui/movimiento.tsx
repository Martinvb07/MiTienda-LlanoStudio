'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'motion/react'

/*
 * Movimiento del panel, el mismo de la portada: todo entra subiendo y
 * desenfocado con la curva out-expo, en cascada, y las cifras cuentan.
 */

export const SALIDA = [0.16, 1, 0.3, 1] as const

/** Bloque que entra subiendo y enfocándose. `orden` lo pone en la cascada. */
export function Aparecer({
  children,
  orden = 0,
  className,
}: {
  children: ReactNode
  orden?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ duration: 1, delay: 0.06 * orden, ease: SALIDA }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Cifra que cuenta desde cero hasta su valor cuando se ve por primera vez. */
export function Contador({ valor, formato }: { valor: number; formato?: (numero: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visto = useInView(ref, { once: true })
  const quieto = useReducedMotion()
  const pintar = formato ?? ((numero: number) => Math.round(numero).toLocaleString('es-CO'))

  useEffect(() => {
    const nodo = ref.current
    if (!nodo || !visto) return
    if (quieto) {
      nodo.textContent = pintar(valor)
      return
    }
    const control = animate(0, valor, {
      duration: 1.4,
      ease: SALIDA,
      onUpdate: (actual) => {
        nodo.textContent = pintar(actual)
      },
    })
    return () => control.stop()
    // `pintar` cambia en cada render; sólo importa el valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, visto, quieto])

  return <span ref={ref}>{pintar(0)}</span>
}
