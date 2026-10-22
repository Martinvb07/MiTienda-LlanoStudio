'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/utilidades/clases'

export type Tema = 'oscuro' | 'claro'

const CLAVE = 'mt-tema'

/**
 * Se pega en el <head> del layout raíz: pone el tema guardado antes de pintar,
 * para que la página no parpadee en oscuro al cargar en claro.
 */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem('${CLAVE}');if(t==='claro'||t==='oscuro')document.documentElement.dataset.tema=t}catch(e){}`

function aplicar(tema: Tema) {
  document.documentElement.dataset.tema = tema
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Sin almacenamiento: dura lo que dure la pestaña.
  }
}

/**
 * Sol y luna, como el de arbicrypto: el ícono gira al cambiar y la página nueva
 * se revela en un círculo que nace del botón (View Transitions donde existe;
 * en los demás navegadores cambia directo).
 */
export function BotonTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema>('oscuro')

  useEffect(() => {
    setTema(document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro')
  }, [])

  function cambiar(evento: React.MouseEvent<HTMLButtonElement>) {
    const nuevo: Tema = tema === 'oscuro' ? 'claro' : 'oscuro'
    const caja = evento.currentTarget.getBoundingClientRect()
    const x = caja.left + caja.width / 2
    const y = caja.top + caja.height / 2
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const documento = document as Document & { startViewTransition?: (cambio: () => void) => { ready: Promise<void> } }
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!documento.startViewTransition || quieto) {
      aplicar(nuevo)
      setTema(nuevo)
      return
    }
    const transicion = documento.startViewTransition(() => {
      aplicar(nuevo)
      setTema(nuevo)
    })
    void transicion.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  const claro = tema === 'claro'

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={claro ? 'Modo oscuro' : 'Modo claro'}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-sitio-borde text-sitio-suave transition-colors hover:border-white/25 hover:text-white',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={tema}
          initial={{ rotate: -90, scale: 0.4, opacity: 0, y: 6 }}
          animate={{ rotate: 0, scale: 1, opacity: 1, y: 0 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid place-items-center"
        >
          {claro ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
