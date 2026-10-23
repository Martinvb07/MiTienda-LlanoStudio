'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Megaphone, PackageX, Receipt, Sparkles, Ticket, TriangleAlert, X } from 'lucide-react'
import { marcarNovedadesVistas, obtenerAvisos, obtenerComunicados, type Avisos, type Comunicados } from '@/servicios/panel'
import { formatearPrecio } from '@/utilidades/formato'
import { cn } from '@/utilidades/clases'
import { CURVA } from './ui/basicos'

interface ContextoAvisos {
  avisos: Avisos | null
  comunicados: Comunicados | null
  total: number
  recargar: () => void
  verNovedades: () => void
}

const Contexto = createContext<ContextoAvisos>({
  avisos: null,
  comunicados: null,
  total: 0,
  recargar: () => undefined,
  verNovedades: () => undefined,
})

const CLAVE_VISTOS = 'mitienda:anuncios-vistos'
function anunciosVistos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_VISTOS) ?? '[]') as string[]
  } catch {
    return []
  }
}
function marcarVistos(ids: string[]) {
  try {
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify([...new Set([...anunciosVistos(), ...ids])].slice(-100)))
  } catch {
    // Sin almacenamiento el anuncio sigue contando.
  }
}

export const useAvisos = () => useContext(Contexto)

/**
 * Pide los avisos al entrar, cada minuto y al volver a la pestaña. Con pedidos
 * nuevos, el título de la pestaña lo dice: "(2) Pedidos · Mi Sitio".
 */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Avisos | null>(null)
  const [comunicados, setComunicados] = useState<Comunicados | null>(null)
  const [vistos, setVistos] = useState<string[]>([])
  const [novedades, setNovedades] = useState(false)

  const recargar = useCallback(() => {
    obtenerAvisos()
      .then(setAvisos)
      .catch(() => undefined)
    obtenerComunicados()
      .then(setComunicados)
      .catch(() => undefined)
    setVistos(anunciosVistos())
  }, [])

  const verNovedades = useCallback(() => {
    setNovedades(true)
    void marcarNovedadesVistas().catch(() => undefined)
    setComunicados((actual) => (actual ? { ...actual, novedadesSinVer: 0 } : actual))
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

  const anunciosNuevos = (comunicados?.campana ?? []).filter((anuncio) => !vistos.includes(anuncio.id)).length
  const total =
    nuevos +
    (avisos?.agotados ? 1 : 0) +
    (avisos?.stockBajo.length ?? 0) +
    (avisos?.cuponesPorVencer.length ?? 0) +
    anunciosNuevos +
    (comunicados?.novedadesSinVer ? 1 : 0)

  return (
    <Contexto.Provider
      value={{
        avisos,
        comunicados,
        total,
        recargar: () => {
          marcarVistos((comunicados?.campana ?? []).map((anuncio) => anuncio.id))
          recargar()
        },
        verNovedades,
      }}
    >
      {children}
      <AnimatePresence>
        {novedades && comunicados && <ModalNovedades novedades={comunicados.novedades} alCerrar={() => setNovedades(false)} />}
      </AnimatePresence>
    </Contexto.Provider>
  )
}

/** Historial de lo nuevo en Mi Sitio, en una ventana. */
function ModalNovedades({ novedades, alCerrar }: { novedades: Comunicados['novedades']; alCerrar: () => void }) {
  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [alCerrar])
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center p-5" role="dialog" aria-modal="true" aria-label="Novedades">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={alCerrar} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.45, ease: CURVA }}
        className="relative flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] border border-sitio-borde-fuerte bg-sitio-modal"
      >
        <div className="flex items-center justify-between border-b border-sitio-borde px-5 py-4">
          <span>
            <span className="block text-[16px] font-medium tracking-[-0.01em]">Novedades</span>
            <span className="text-[12px] text-sitio-tenue">Lo último que llegó a Mi Sitio</span>
          </span>
          <button type="button" aria-label="Cerrar" onClick={alCerrar} className="grid h-8 w-8 place-items-center text-sitio-suave hover:text-white">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <ol className="overflow-y-auto px-5 py-2">
          {novedades.length === 0 ? (
            <li className="py-8 text-center text-[13px] text-sitio-tenue">Pronto habrá novedades por aquí.</li>
          ) : (
            novedades.map((novedad) => (
              <li key={novedad.id} className="border-b border-sitio-borde py-4 last:border-0">
                <p className="flex items-center gap-2 text-[11px] text-sitio-tenue">
                  {novedad.etiqueta && <span className="tracking-[0.12em] text-sitio-azul-claro uppercase">{novedad.etiqueta}</span>}
                  {new Date(novedad.publicadaEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h3 className="mt-1 text-[15px] tracking-[-0.01em]">{novedad.titulo}</h3>
                <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-sitio-suave">{novedad.cuerpo}</p>
              </li>
            ))
          )}
        </ol>
      </motion.div>
    </div>
  )
}

/**
 * Anuncios urgentes de la plataforma, en una franja arriba del panel. Se
 * pueden cerrar y no vuelven a salir.
 */
export function BarraAnuncios() {
  const { comunicados } = useAvisos()
  const [cerrados, setCerrados] = useState<string[]>([])
  useEffect(() => setCerrados(anunciosVistos()), [])
  const visibles = (comunicados?.barra ?? []).filter((anuncio) => !cerrados.includes(anuncio.id))
  if (visibles.length === 0) return null
  return (
    <div className="mb-5 flex flex-col gap-2">
      {visibles.map((anuncio) => (
        <div key={anuncio.id} role="status" className="flex items-start gap-3 rounded-[12px] border border-sitio-azul-claro/30 bg-sitio-azul/[0.07] px-4 py-3">
          <Megaphone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sitio-azul-claro" />
          <p className="min-w-0 flex-1 text-[13px]">
            <strong className="font-medium">{anuncio.titulo}</strong>
            {anuncio.cuerpo && <span className="text-sitio-suave"> {anuncio.cuerpo}</span>}
          </p>
          <button
            type="button"
            aria-label="Cerrar anuncio"
            onClick={() => {
              marcarVistos([anuncio.id])
              setCerrados((lista) => [...lista, anuncio.id])
            }}
            className="text-sitio-tenue hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

/** Campanita con el número de avisos y su lista desplegable. */
export function CampanaAvisos({ abajo = false }: { abajo?: boolean }) {
  const { avisos, comunicados, total, recargar, verNovedades } = useAvisos()
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

  const filas: { icono: ReactNode; texto: ReactNode; href?: string; alElegir?: () => void; clave: string }[] = [
    ...(comunicados?.novedadesSinVer
      ? [
          {
            clave: 'novedades',
            alElegir: verNovedades,
            icono: <Sparkles aria-hidden="true" className="h-4 w-4 text-sitio-azul-claro" />,
            texto: (
              <>
                <strong className="font-medium text-white">
                  {comunicados.novedadesSinVer} {comunicados.novedadesSinVer === 1 ? 'novedad' : 'novedades'}
                </strong>{' '}
                en Mi Sitio
              </>
            ),
          },
        ]
      : []),
    ...(comunicados?.campana ?? []).map((anuncio) => ({
      clave: anuncio.id,
      icono: <Megaphone aria-hidden="true" className="h-4 w-4 text-sitio-azul-claro" />,
      texto: (
        <>
          <strong className="font-medium text-white">{anuncio.titulo}</strong>
          {anuncio.cuerpo && <span className="mt-0.5 block">{anuncio.cuerpo}</span>}
        </>
      ),
    })),
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
        onClick={() => {
          // Al abrir, los anuncios de la campana cuentan como vistos.
          if (abierto) recargar()
          setAbierto((valor) => !valor)
        }}
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
              className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sitio-azul px-1 text-[10px] font-semibold text-[#fff]"
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
              'absolute z-50 w-[320px] overflow-hidden rounded-[12px] border border-white/12 bg-sitio-elevado/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl',
              abajo ? 'top-[calc(100%+8px)] right-0' : 'top-[calc(100%+8px)] left-0',
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-[13px] font-medium">Avisos</p>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false)
                  verNovedades()
                }}
                className="text-[11.5px] text-sitio-tenue transition-colors hover:text-white"
              >
                Novedades
              </button>
            </div>
            {filas.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-sitio-tenue">Todo al día. No hay nada pendiente.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {filas.map((fila) => {
                  const clases = 'flex w-full items-start gap-3 px-4 py-2.5 text-left text-[12.5px] leading-snug text-sitio-suave transition-colors hover:bg-white/[0.05]'
                  const contenido = (
                    <>
                      <span className="mt-px shrink-0">{fila.icono}</span>
                      <span>{fila.texto}</span>
                    </>
                  )
                  return (
                    <li key={fila.clave}>
                      {fila.href ? (
                        <Link href={fila.href} onClick={() => setAbierto(false)} className={clases}>
                          {contenido}
                        </Link>
                      ) : fila.alElegir ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAbierto(false)
                            fila.alElegir?.()
                          }}
                          className={clases}
                        >
                          {contenido}
                        </button>
                      ) : (
                        <div className={cn(clases, 'hover:bg-transparent')}>{contenido}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
