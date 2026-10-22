'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/utilidades/clases'

const SALIDA = [0.16, 1, 0.3, 1] as const

/** Cierra al hacer clic afuera o con Escape. */
function useCerrarAfuera(abierto: boolean, cerrar: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!abierto) return
    const alClic = (evento: PointerEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) cerrar()
    }
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && cerrar()
    document.addEventListener('pointerdown', alClic)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alClic)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto, cerrar])
  return ref
}

/**
 * Selector propio en vez del <select> nativo: el menú del navegador no se
 * puede estilizar y rompe el panel oscuro. Se despliega con la curva out-expo.
 */
export function Selector<T extends string>({
  valor,
  opciones,
  alCambiar,
  etiqueta,
  deshabilitado = false,
  className,
}: {
  valor: T
  opciones: readonly { valor: T; etiqueta: string; detalle?: string }[]
  alCambiar: (valor: T) => void
  etiqueta: string
  deshabilitado?: boolean
  className?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const ref = useCerrarAfuera(abierto, () => setAbierto(false))
  const actual = opciones.find((opcion) => opcion.valor === valor)

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={deshabilitado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiqueta}
        onClick={() => setAbierto((estado) => !estado)}
        className={cn(
          'flex h-[34px] w-full items-center justify-between gap-3 rounded-lg border bg-sitio-campo pr-2.5 pl-3 text-[13px] text-white transition-colors disabled:opacity-50',
          abierto ? 'border-white/35' : 'border-sitio-borde hover:border-white/20',
        )}
      >
        <span className="truncate">{actual?.etiqueta ?? '—'}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 text-white/45 transition-transform duration-500 ease-salida', abierto && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.ul
            role="listbox"
            aria-label={etiqueta}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: SALIDA }}
            className="absolute top-[calc(100%+6px)] right-0 z-50 min-w-full origin-top overflow-hidden rounded-[10px] border border-white/12 bg-sitio-elevado/95 p-1 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            {opciones.map((opcion, indice) => {
              const elegida = opcion.valor === valor
              return (
                <motion.li
                  key={opcion.valor}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: indice * 0.025, ease: SALIDA }}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={elegida}
                    onClick={() => {
                      setAbierto(false)
                      if (!elegida) alCambiar(opcion.valor)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-6 rounded-md px-2.5 py-2 text-left text-[13px] whitespace-nowrap transition-colors',
                      elegida ? 'text-white' : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
                    )}
                  >
                    <span>
                      {opcion.etiqueta}
                      {opcion.detalle && <span className="ml-2 text-[11.5px] text-white/35">{opcion.detalle}</span>}
                    </span>
                    {elegida && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Menú de acciones de una fila (los tres puntos). */
export function MenuAcciones({
  disparador,
  acciones,
}: {
  disparador: ReactNode
  acciones: { etiqueta: string; icono?: ReactNode; peligro?: boolean; alElegir: () => void }[]
}) {
  const [abierto, setAbierto] = useState(false)
  const ref = useCerrarAfuera(abierto, () => setAbierto(false))

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Acciones"
        onClick={() => setAbierto((estado) => !estado)}
        className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        {disparador}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: SALIDA }}
            className="absolute top-[calc(100%+6px)] right-0 z-50 w-56 origin-top-right overflow-hidden rounded-[10px] border border-white/12 bg-sitio-elevado/95 p-1 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            {acciones.map((accion) => (
              <button
                key={accion.etiqueta}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false)
                  accion.alElegir()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                  accion.peligro
                    ? 'text-red-300/90 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-white/75 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                {accion.icono}
                {accion.etiqueta}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Ventana modal pequeña del panel, con la misma entrada que el modal de plantillas. */
export function ModalPanel({
  titulo,
  descripcion,
  alCerrar,
  children,
}: {
  titulo: string
  descripcion?: ReactNode
  alCerrar: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [alCerrar])

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={titulo}>
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: SALIDA }}
        onClick={alCerrar}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
        transition={{ duration: 0.6, ease: SALIDA }}
        className="relative w-full max-w-[440px] rounded-[14px] border border-white/10 bg-sitio-modal p-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)]"
      >
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar"
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
        <h2 className="pr-8 text-[22px] tracking-[-0.03em]">{titulo}</h2>
        {descripcion && <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{descripcion}</p>}
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  )
}
