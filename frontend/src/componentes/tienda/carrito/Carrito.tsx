'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Minus, Plus, ShoppingBag, Trash2, X, Truck } from 'lucide-react'
import type { AjustesTienda, TemaTienda } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'

export interface LineaCarrito {
  productoId: string
  slug: string
  nombre: string
  /** Precio al momento de agregar. El pedido se cobra con el de la base de datos. */
  precio: string
  foto?: string
  cantidad: number
  stock: number
  /** Id de la variante elegida (lo que entiende la API). */
  variante?: string
  /** "M / Rojo", para mostrar. */
  varianteNombre?: string
}

interface ContextoCarrito {
  lineas: LineaCarrito[]
  unidades: number
  subtotal: number
  moneda: string
  ajustes: AjustesTienda
  abierto: boolean
  abrir: () => void
  cerrar: () => void
  /** `origen` es la foto desde la que sale volando, si la tienda usa esa animación. */
  agregar: (linea: LineaCarrito, origen?: Element | null) => void
  /** Botón Agregar en las tarjetas (según el tema y el plan). */
  agregarRapido: boolean
  /** Sube en cada producto agregado: la bolsa del encabezado rebota. */
  golpe: number
  cambiarCantidad: (productoId: string, variante: string | undefined, cantidad: number) => void
  quitar: (productoId: string, variante: string | undefined) => void
  vaciar: () => void
}

const Contexto = createContext<ContextoCarrito | null>(null)

/** null fuera de una tienda (la vista previa del editor tiene el suyo, de prueba). */
export const useCarrito = () => useContext(Contexto)

const misma = (linea: LineaCarrito, productoId: string, variante?: string) =>
  linea.productoId === productoId && (linea.variante ?? '') === (variante ?? '')

/**
 * Carrito de una tienda, guardado en este navegador. Cada tienda tiene su
 * propia clave: con dominios propios y subdominios no comparten nada.
 */
export function ProveedorCarrito({
  clave,
  moneda,
  ajustes,
  tema,
  children,
}: {
  clave: string
  moneda: string
  ajustes: AjustesTienda
  /** Ya recortado al plan (temaAlPlan). */
  tema?: Pick<TemaTienda, 'alAgregar' | 'agregarRapido'>
  children: ReactNode
}) {
  const almacen = `mt-carrito:${clave}`
  const [lineas, setLineas] = useState<LineaCarrito[]>([])
  const [cargado, setCargado] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [aviso, setAviso] = useState<{ linea: LineaCarrito; id: number } | null>(null)
  const [vuelo, setVuelo] = useState<{ foto: string; desde: DOMRect; hasta: DOMRect; id: number } | null>(null)
  const [golpe, setGolpe] = useState(0)
  const modo = tema?.alAgregar ?? 'carrito'

  // El aviso se va solo; uno nuevo reinicia la cuenta.
  useEffect(() => {
    if (!aviso) return
    const espera = setTimeout(() => setAviso(null), 3600)
    return () => clearTimeout(espera)
  }, [aviso])

  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(almacen) ?? '[]') as LineaCarrito[]
      if (Array.isArray(guardado)) setLineas(guardado)
    } catch {
      // Carrito ilegible o sin almacenamiento: se empieza vacío.
    }
    setCargado(true)
  }, [almacen])

  useEffect(() => {
    if (!cargado) return
    try {
      localStorage.setItem(almacen, JSON.stringify(lineas))
    } catch {
      // Sin almacenamiento: el carrito vive lo que dure la pestaña.
    }
  }, [almacen, lineas, cargado])

  const agregar = useCallback(
    (nueva: LineaCarrito, origen?: Element | null) => {
      setLineas((actuales) => {
        const existente = actuales.find((linea) => misma(linea, nueva.productoId, nueva.variante))
        if (!existente) return [...actuales, { ...nueva, cantidad: Math.min(nueva.cantidad, nueva.stock) }]
        return actuales.map((linea) =>
          linea === existente ? { ...linea, cantidad: Math.min(linea.cantidad + nueva.cantidad, nueva.stock), stock: nueva.stock } : linea,
        )
      })
      if (modo === 'carrito') {
        setAbierto(true)
        return
      }
      const id = Date.now()
      if (modo === 'volar' && origen && nueva.foto) {
        // La bolsa visible del encabezado (hay una por diseño de cabecera).
        const bolsa = Array.from(document.querySelectorAll('[data-boton-carrito]')).find(
          (nodo) => nodo.getBoundingClientRect().width > 0,
        )
        if (bolsa) {
          // Con la cabecera fuera de la pantalla, vuela a la esquina donde sale el aviso.
          const caja = bolsa.getBoundingClientRect()
          const hasta = caja.bottom > 0 ? caja : new DOMRect(window.innerWidth - 72, 28, 28, 28)
          setVuelo({ foto: nueva.foto, desde: origen.getBoundingClientRect(), hasta, id })
          setTimeout(() => {
            setGolpe((valor) => valor + 1)
            setAviso({ linea: nueva, id })
          }, 780)
          return
        }
      }
      setGolpe((valor) => valor + 1)
      setAviso({ linea: nueva, id })
    },
    [modo],
  )

  const cambiarCantidad = useCallback((productoId: string, variante: string | undefined, cantidad: number) => {
    setLineas((actuales) =>
      actuales
        .map((linea) =>
          misma(linea, productoId, variante) ? { ...linea, cantidad: Math.max(0, Math.min(cantidad, linea.stock)) } : linea,
        )
        .filter((linea) => linea.cantidad > 0),
    )
  }, [])

  const quitar = useCallback((productoId: string, variante: string | undefined) => {
    setLineas((actuales) => actuales.filter((linea) => !misma(linea, productoId, variante)))
  }, [])

  const valor = useMemo<ContextoCarrito>(
    () => ({
      lineas,
      unidades: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
      subtotal: lineas.reduce((suma, linea) => suma + Number(linea.precio) * linea.cantidad, 0),
      moneda,
      ajustes,
      abierto,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar,
      agregarRapido: Boolean(tema?.agregarRapido),
      golpe,
      cambiarCantidad,
      quitar,
      vaciar: () => setLineas([]),
    }),
    [lineas, moneda, ajustes, abierto, agregar, tema?.agregarRapido, golpe, cambiarCantidad, quitar],
  )

  return (
    <Contexto.Provider value={valor}>
      {children}
      <CajonCarrito />
      <VueloAlCarrito vuelo={vuelo} alTerminar={() => setVuelo(null)} />
      <AvisoAgregado
        aviso={aviso}
        moneda={moneda}
        alVer={() => {
          setAviso(null)
          setAbierto(true)
        }}
        alCerrar={() => setAviso(null)}
      />
    </Contexto.Provider>
  )
}

/** Ícono de la cabecera con las unidades que lleva. Fuera de una tienda es un enlace a productos. */
export function BotonCarrito({ className }: { className?: string }) {
  const carrito = useCarrito()
  if (!carrito) {
    return (
      <span className={className}>
        <ShoppingBag aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
      </span>
    )
  }
  return (
    <button
      type="button"
      data-boton-carrito
      onClick={carrito.abrir}
      aria-label={`Carrito, ${carrito.unidades} productos`}
      className={`relative ${className ?? ''}`}
    >
      {/* Rebota cada vez que entra algo, sin animarse al cargar la página. */}
      <motion.span
        key={carrito.golpe}
        className="block"
        initial={false}
        animate={carrito.golpe ? { scale: [1, 1.28, 0.9, 1.06, 1], rotate: [0, -8, 6, 0, 0] } : undefined}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <ShoppingBag aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
      </motion.span>
      <AnimatePresence>
        {carrito.unidades > 0 && (
          <motion.span
            key={carrito.unidades}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="absolute -top-1.5 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-marca px-1 text-[11px] font-semibold text-marca-contraste"
          >
            {carrito.unidades}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

/** Barra "te faltan $X para el envío gratis". */
export function MetaEnvioGratis({ subtotal, ajustes, moneda }: { subtotal: number; ajustes: AjustesTienda; moneda: string }) {
  const meta = ajustes.envioGratisDesde
  if (!meta || !ajustes.costoEnvio) return null
  const falta = meta - subtotal
  return (
    <div className="text-sm">
      <p className="text-tinta/75">
        {falta > 0 ? (
          <>
            Te faltan <strong className="text-tinta">{formatearPrecio(falta, moneda)}</strong> para el envío gratis
          </>
        ) : (
          <strong className="inline-flex items-center gap-1.5 text-tinta">
            <Truck aria-hidden="true" className="h-4 w-4" />
            ¡Tienes envío gratis!
          </strong>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-tinta/10">
        <motion.div
          className="h-full rounded-full bg-marca"
          initial={false}
          animate={{ width: `${Math.min(100, (subtotal / meta) * 100)}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

export function SelectorCantidad({
  valor,
  maximo,
  alCambiar,
  chico = false,
}: {
  valor: number
  maximo: number
  alCambiar: (valor: number) => void
  chico?: boolean
}) {
  const boton = `grid ${chico ? 'h-8 w-8' : 'h-11 w-11'} place-items-center transition hover:bg-tinta/5 disabled:opacity-30`
  return (
    <div className="inline-flex items-center rounded-(--radius-marca) border border-tinta/15">
      <button type="button" className={boton} onClick={() => alCambiar(valor - 1)} disabled={valor <= 1} aria-label="Quitar uno">
        <Minus aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      <span className={`${chico ? 'w-7 text-sm' : 'w-9'} text-center tabular-nums`}>{valor}</span>
      <button type="button" className={boton} onClick={() => alCambiar(valor + 1)} disabled={valor >= maximo} aria-label="Agregar uno">
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function CajonCarrito() {
  const carrito = useCarrito()!
  const { lineas, abierto, cerrar, moneda, subtotal, ajustes } = carrito

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && cerrar()
    window.addEventListener('keydown', alTeclear)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = anterior
    }
  }, [abierto, cerrar])

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Carrito">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrar}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-superficie text-tinta shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-tinta/10 px-6 py-5">
              <h2 className="font-display text-xl font-semibold">Tu carrito</h2>
              <button type="button" onClick={cerrar} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-tinta/5">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            {lineas.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <div>
                  <ShoppingBag aria-hidden="true" className="mx-auto h-10 w-10 text-tinta/25" strokeWidth={1.4} />
                  <p className="mt-4 text-tinta/60">Tu carrito está vacío</p>
                  <button type="button" onClick={cerrar} className="mt-5 text-sm font-medium underline underline-offset-4">
                    Seguir comprando
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-tinta/10 px-6 py-4">
                  <MetaEnvioGratis subtotal={subtotal} ajustes={ajustes} moneda={moneda} />
                </div>
                <ul className="flex-1 divide-y divide-tinta/10 overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {lineas.map((linea) => (
                      <motion.li
                        key={`${linea.productoId}|${linea.variante ?? ''}`}
                        layout
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-4 py-5"
                      >
                        <Link
                          href={`/productos/${linea.slug}`}
                          onClick={cerrar}
                          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-(--radius-marca) bg-tinta/5"
                        >
                          {linea.foto && (
                            <Image src={linea.foto} alt="" fill sizes="80px" unoptimized={esMedioLocal(linea.foto)} className="object-cover" />
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="truncate font-medium">{linea.nombre}</p>
                          {linea.varianteNombre && <p className="text-sm text-tinta/55">{linea.varianteNombre}</p>}
                          <p className="text-sm text-tinta/70">{formatearPrecio(linea.precio, moneda)}</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <SelectorCantidad
                              chico
                              valor={linea.cantidad}
                              maximo={linea.stock}
                              alCambiar={(cantidad) => carrito.cambiarCantidad(linea.productoId, linea.variante, cantidad)}
                            />
                            <button
                              type="button"
                              onClick={() => carrito.quitar(linea.productoId, linea.variante)}
                              aria-label={`Quitar ${linea.nombre}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-tinta/45 transition hover:bg-tinta/5 hover:text-tinta"
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <footer className="border-t border-tinta/10 px-6 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-tinta/70">Subtotal</span>
                    <span className="font-display text-xl font-semibold">{formatearPrecio(subtotal, moneda)}</span>
                  </div>
                  <p className="mt-1 text-xs text-tinta/50">El envío se calcula al finalizar.</p>
                  <Link
                    href="/carrito"
                    onClick={cerrar}
                    className="boton-tienda mt-4 flex w-full items-center justify-center rounded-(--radius-marca) bg-marca py-3.5 font-medium text-marca-contraste transition hover:opacity-90"
                  >
                    Finalizar compra
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

/** La foto del producto viaja en arco hasta la bolsa del encabezado. */
function VueloAlCarrito({
  vuelo,
  alTerminar,
}: {
  vuelo: { foto: string; desde: DOMRect; hasta: DOMRect; id: number } | null
  alTerminar: () => void
}) {
  if (!vuelo) return null
  const { desde, hasta } = vuelo
  const lado = Math.min(desde.width, desde.height, 220)
  const inicioX = desde.left + desde.width / 2 - lado / 2
  const inicioY = desde.top + desde.height / 2 - lado / 2
  const finX = hasta.left + hasta.width / 2 - 14
  const finY = hasta.top + hasta.height / 2 - 14
  return (
    <motion.img
      key={vuelo.id}
      src={vuelo.foto}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[110] object-cover shadow-xl"
      initial={{ x: inicioX, y: inicioY, width: lado, height: lado, borderRadius: 12, opacity: 1 }}
      animate={{
        x: [inicioX, (inicioX + finX) / 2, finX],
        y: [inicioY, Math.min(inicioY, finY) - 90, finY],
        width: [lado, lado * 0.55, 28],
        height: [lado, lado * 0.55, 28],
        borderRadius: [12, 40, 999],
        opacity: [1, 1, 0.5],
      }}
      transition={{ duration: 0.78, ease: [0.45, 0, 0.2, 1], times: [0, 0.45, 1] }}
      onAnimationComplete={alTerminar}
    />
  )
}

/** "Agregado al carrito" con la foto: abajo en el celular, arriba a la derecha en pantallas grandes. */
function AvisoAgregado({
  aviso,
  moneda,
  alVer,
  alCerrar,
}: {
  aviso: { linea: LineaCarrito; id: number } | null
  moneda: string
  alVer: () => void
  alCerrar: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[105] flex justify-center sm:inset-x-auto sm:top-24 sm:right-6 sm:bottom-auto">
      <AnimatePresence mode="popLayout">
        {aviso && (
          <motion.div
            key={aviso.id}
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-(--radius-marca) border border-tinta/10 bg-superficie p-3 text-tinta shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)]"
          >
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-tinta/5">
              {aviso.linea.foto && (
                <Image
                  src={aviso.linea.foto}
                  alt=""
                  fill
                  sizes="56px"
                  unoptimized={esMedioLocal(aviso.linea.foto)}
                  className="object-cover"
                />
              )}
              <span className="absolute right-0.5 bottom-0.5 grid h-5 w-5 place-items-center rounded-full bg-marca text-marca-contraste">
                <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-tinta/55">Agregado al carrito</span>
              <span className="block truncate text-sm font-medium">
                {aviso.linea.nombre}
                {aviso.linea.varianteNombre ? ` · ${aviso.linea.varianteNombre}` : ''}
              </span>
              <span className="block text-xs text-tinta/60">
                {aviso.linea.cantidad} × {formatearPrecio(aviso.linea.precio, moneda)}
              </span>
            </span>
            <button
              type="button"
              onClick={alVer}
              className="boton-tienda shrink-0 bg-marca px-3 py-2 text-xs font-medium text-marca-contraste transition hover:opacity-90"
            >
              Ver carrito
            </button>
            <button type="button" onClick={alCerrar} aria-label="Cerrar aviso" className="shrink-0 text-tinta/40 transition hover:text-tinta">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
