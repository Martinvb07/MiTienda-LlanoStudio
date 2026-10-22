'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { TriangleAlert } from 'lucide-react'
import { cn } from '@/utilidades/clases'

const SALIDA = [0.16, 1, 0.3, 1] as const

export interface OpcionesConfirmar {
  titulo: string
  mensaje?: string
  /** Texto del botón que acepta. Por defecto "Confirmar". */
  confirmar?: string
  cancelar?: string
  /** Acción que borra o pierde algo: botón rojo y un ícono de alerta. */
  peligro?: boolean
}

/** La de los editores al cerrar con cambios pendientes. */
export const SALIR_SIN_GUARDAR: OpcionesConfirmar = {
  titulo: '¿Salir sin guardar?',
  mensaje: 'Tienes cambios que todavía no guardas. Si sales ahora, se pierden.',
  confirmar: 'Salir sin guardar',
  cancelar: 'Seguir editando',
  peligro: true,
}

interface Pendiente extends OpcionesConfirmar {
  id: number
  responder: (respuesta: boolean) => void
}

// Una sola confirmación a la vez, guardada fuera de React para poder pedirla
// desde cualquier función (como window.confirm, pero con el estilo del panel).
let actual: Pendiente | null = null
let siguienteId = 1
const oyentes = new Set<() => void>()

function avisar() {
  for (const oyente of oyentes) oyente()
}

/**
 * Reemplazo de window.confirm con el modal del panel. Devuelve una promesa:
 *
 *   if (!(await confirmar({ titulo: '¿Eliminar?', peligro: true }))) return
 */
export function confirmar(opciones: OpcionesConfirmar): Promise<boolean> {
  // Si ya había una abierta, se da por cancelada.
  actual?.responder(false)
  return new Promise((resolver) => {
    const id = siguienteId++
    actual = {
      ...opciones,
      id,
      responder: (respuesta) => {
        if (actual?.id === id) {
          actual = null
          avisar()
        }
        resolver(respuesta)
      },
    }
    avisar()
  })
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** Va una vez en el layout del panel: pinta la confirmación pendiente. */
export function HostConfirmaciones() {
  const pendiente = useSyncExternalStore(
    suscribir,
    () => actual,
    () => null,
  )
  const botonAceptar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!pendiente) return
    botonAceptar.current?.focus()
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        pendiente?.responder(false)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [pendiente])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {pendiente && (
        <div
          key={pendiente.id}
          className="marco-oscuro fixed inset-0 z-[500] grid place-items-center p-5 font-sans"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirmar-titulo"
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: SALIDA }}
            onClick={() => pendiente.responder(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.55, ease: SALIDA }}
            className="relative w-full max-w-[420px] rounded-[16px] border border-white/10 bg-sitio-modal p-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)]"
          >
            {pendiente.peligro && (
              <span className="mb-5 grid h-10 w-10 place-items-center rounded-full border border-red-500/25 bg-red-500/[0.08] text-sitio-rojo">
                <TriangleAlert aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
            )}
            <h2 id="confirmar-titulo" className="text-[22px] leading-tight tracking-[-0.03em] text-white">
              {pendiente.titulo}
            </h2>
            {pendiente.mensaje && <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{pendiente.mensaje}</p>}
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => pendiente.responder(false)}
                className="boton boton-contorno boton-chico"
              >
                {pendiente.cancelar ?? 'Cancelar'}
              </button>
              <button
                ref={botonAceptar}
                type="button"
                onClick={() => pendiente.responder(true)}
                className={cn(
                  'boton boton-chico',
                  pendiente.peligro ? 'border-transparent bg-red-500 text-[#fff] hover:bg-red-600' : 'boton-primario',
                )}
              >
                {pendiente.confirmar ?? 'Confirmar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
