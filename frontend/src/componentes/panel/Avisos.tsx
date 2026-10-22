'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, PackageX, Receipt, Ticket, TriangleAlert } from 'lucide-react'
import { obtenerAvisos, type Avisos } from '@/servicios/panel'
import { formatearPrecio } from '@/utilidades/formato'
import { cn } from '@/utilidades/clases'
import { CURVA } from './ui/basicos'

interface ContextoAvisos {
  avisos: Avisos | null
  total: number
  recargar: () => void
}

const Contexto = createContext<ContextoAvisos>({ avisos: null, total: 0, recargar: () => undefined })

export const useAvisos = () => useContext(Contexto)

/**
 * Pide los avisos al entrar, cada minuto y al volver a la pestaña. Con pedidos
 * nuevos, el título de la pestaña lo dice: "(2) Pedidos · Mi Tienda".
 */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Avisos | null>(null)

  const recargar = useCallback(() => {
    obtenerAvisos()
      .then(setAvisos)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    recargar()
    const reloj = setInterval(recargar, 60_000)
    const alVolver = () => document.visibilityState === 'visible' && recargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [recargar])

  const nuevos = avisos?.pedidosNuevos ?? 0
  useEffect(() => {
    const limpio = document.title.replace(/^\(\d+\) /, '')
    document.title = nuevos > 0 ? `(${nuevos}) ${limpio}` : limpio
  })

  const total = nuevos + (avisos?.agotados ? 1 : 0) + (avisos?.stockBajo.length ?? 0) + (avisos?.cuponesPorVencer.length ?? 0)

  return <Contexto.Provider value={{ avisos, total, recargar }}>{children}</Contexto.Provider>
}

/** Campanita con el número de avisos y su lista desplegable. */
export function CampanaAvisos({ abajo = false }: { abajo?: boolean }) {
  const { avisos, total } = useAvisos()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alClic = (evento: PointerEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) setAbierto(false)
    }
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && setAbierto(false)
    document.addEventListener('pointerdown', alClic)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alClic)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  const filas: { icono: ReactNode; texto: ReactNode; href: string; clave: string }[] = [
    ...(avisos?.ultimos ?? []).map((pedido) => ({
      clave: pedido.id,
      href: '/panel/pedidos',
      icono: <Receipt aria-hidden="true" className="h-4 w-4 text-sitio-ambar" />,
      texto: (
        <>
          Pedido nuevo <strong className="font-medium text-white">#{pedido.numero}</strong> de {pedido.clienteNombre.split(' ')[0]} ·{' '}
          {formatearPrecio(pedido.total)}
        </>
      ),
    })),
    ...(avisos?.agotados
      ? [
          {
            clave: 'agotados',
            href: '/panel/productos?filtro=agotados',
            icono: <PackageX aria-hidden="true" className="h-4 w-4 text-sitio-rojo" />,
            texto: (
              <>
                <strong className="font-medium text-white">{avisos.agotados}</strong> {avisos.agotados === 1 ? 'producto agotado' : 'productos agotados'} y
                visibles
              </>
            ),
          },
        ]
      : []),
    ...(avisos?.stockBajo ?? []).map((producto) => ({
      clave: producto.id,
      href: '/panel/productos',
      icono: <TriangleAlert aria-hidden="true" className="h-4 w-4 text-sitio-ambar" />,
      texto: (
        <>
          Quedan <strong className="font-medium text-white">{producto.stock}</strong> de {producto.nombre}
        </>
      ),
    })),
    ...(avisos?.cuponesPorVencer ?? []).map((cupon) => ({
      clave: cupon.id,
      href: '/panel/descuentos',
      icono: <Ticket aria-hidden="true" className="h-4 w-4 text-sitio-azul-claro" />,
      texto: (
        <>
          El cupón <strong className="font-mono font-medium text-white">{cupon.codigo}</strong> vence{' '}
          {new Date(cupon.venceEn).toLocaleDateString('es-CO', { weekday: 'long' })}
        </>
      ),
    })),
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-label={`Avisos${total ? `, ${total} nuevos` : ''}`}
        aria-expanded={abierto}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-sitio-borde text-sitio-suave transition-colors hover:border-white/25 hover:text-white"
      >
        <motion.span
          key={total}
          animate={total ? { rotate: [0, -16, 14, -10, 6, 0] } : undefined}
          transition={{ duration: 0.7 }}
          className="grid place-items-center"
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
        </motion.span>
        <AnimatePresence>
          {total > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sitio-azul px-1 text-[10px] font-semibold text-white"
            >
              {total > 9 ? '9+' : total}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: abajo ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: CURVA }}
            className={cn(
              'absolute z-50 w-[320px] overflow-hidden rounded-[12px] border border-white/12 bg-[#141416]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl',
              abajo ? 'top-[calc(100%+8px)] right-0' : 'top-[calc(100%+8px)] left-0',
            )}
          >
            <p className="border-b border-white/10 px-4 py-3 text-[13px] font-medium">Avisos</p>
            {filas.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-sitio-tenue">Todo al día. No hay nada pendiente.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {filas.map((fila) => (
                  <li key={fila.clave}>
                    <Link
                      href={fila.href}
                      onClick={() => setAbierto(false)}
                      className="flex items-start gap-3 px-4 py-2.5 text-[12.5px] leading-snug text-sitio-suave transition-colors hover:bg-white/[0.05]"
                    >
                      <span className="mt-px shrink-0">{fila.icono}</span>
                      <span>{fila.texto}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
