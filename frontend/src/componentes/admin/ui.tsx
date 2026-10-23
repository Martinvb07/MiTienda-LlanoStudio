'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utilidades/clases'

/*
 * Piezas comunes de las secciones del admin: títulos, tarjetas, cifras,
 * desplegables y una gráfica de barras de una sola serie.
 */

export const SALIDA = [0.16, 1, 0.3, 1] as const

export const pesos = (valor: number | string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(valor))

export const fecha = (valor: string | Date, conHora = false) =>
  new Date(valor).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(conHora ? { hour: 'numeric', minute: '2-digit' } : {}),
  })

export function haceCuanto(valor: string | Date) {
  const minutos = Math.round((Date.now() - new Date(valor).getTime()) / 60000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

/** Carga datos con estado de error y una función para recargar. */
export function useDatos<T>(cargar: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState('')
  const recargar = useCallback(() => {
    cargar()
      .then((valor) => {
        setDatos(valor)
        setError('')
      })
      .catch((problema: Error) => setError(problema.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la función de carga es estable por sección
  }, [])
  useEffect(recargar, [recargar])
  return { datos, setDatos, error, recargar }
}

export function TituloSeccion({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[clamp(30px,3.6vw,48px)] leading-none tracking-[-0.045em]">{titulo}</h1>
        {descripcion && <p className="mt-3 max-w-xl text-[13.5px] text-sitio-tenue">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}

export function Tarjeta({
  titulo,
  accion,
  className,
  children,
}: {
  titulo?: string
  accion?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5 md:p-6', className)}>
      {(titulo || accion) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-[14.5px] font-medium tracking-[-0.01em]">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  )
}

export function Cifra({
  etiqueta,
  valor,
  pie,
  tono,
}: {
  etiqueta: string
  valor: ReactNode
  pie?: ReactNode
  tono?: 'ambar' | 'verde'
}) {
  return (
    <div className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5">
      <p className="text-[11.5px] text-sitio-tenue">{etiqueta}</p>
      <p
        className={cn(
          'mt-3 truncate text-[clamp(22px,2.6vw,34px)] leading-none tracking-[-0.045em]',
          tono === 'ambar' && 'text-sitio-ambar',
          tono === 'verde' && 'text-sitio-verde',
        )}
      >
        {valor}
      </p>
      {pie && <p className="mt-2.5 text-[11.5px] text-sitio-tenue">{pie}</p>}
    </div>
  )
}

/** Sección plegable: para no tener todo abierto en una sola pantalla. */
export function Desplegable({
  titulo,
  resumen,
  abierto: inicial = false,
  children,
}: {
  titulo: string
  resumen?: ReactNode
  abierto?: boolean
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(inicial)
  return (
    <section
      className={cn(
        'rounded-[14px] border bg-sitio-superficie transition-colors duration-300',
        abierto ? 'border-sitio-borde-fuerte' : 'border-sitio-borde hover:border-sitio-borde-fuerte',
      )}
    >
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1 text-[14.5px] font-medium tracking-[-0.01em]">{titulo}</span>
        {resumen && <span className="hidden shrink-0 text-[12.5px] text-sitio-suave sm:block">{resumen}</span>}
        <ChevronDown
          aria-hidden="true"
          className={cn('h-4 w-4 shrink-0 text-sitio-tenue transition-transform duration-500 ease-salida', abierto && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.45, ease: SALIDA }}
          >
            <div className="border-t border-sitio-borde px-5 pt-5 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-sitio-borde px-4 py-6 text-center text-[13px] text-sitio-tenue">{children}</p>
}

export function Cargando({ alto = 'h-40' }: { alto?: string }) {
  return <div className={cn('brillo rounded-[14px]', alto)} />
}

export function ErrorSeccion({ mensaje, alReintentar }: { mensaje: string; alReintentar: () => void }) {
  return (
    <div className="rounded-[14px] border border-red-500/20 bg-red-500/[0.06] p-5 text-[13px] text-red-300">
      {mensaje}{' '}
      <button type="button" onClick={alReintentar} className="ml-2 underline underline-offset-4">
        Reintentar
      </button>
    </div>
  )
}

/**
 * Barras de una sola serie (en el color de tinta, sin leyenda: el título la
 * nombra). Barras finas, punta redondeada sobre la base, 2 px entre barras y
 * tooltip al pasar el mouse o enfocar con teclado. Debajo va la tabla para
 * lectores de pantalla.
 */
export function Barras({
  datos,
  formato = (valor) => String(valor),
  etiquetaCorta,
  alto = 160,
  titulo,
}: {
  datos: { etiqueta: string; valor: number; detalle?: string }[]
  formato?: (valor: number) => string
  etiquetaCorta?: (etiqueta: string, indice: number) => string | null
  alto?: number
  titulo: string
}) {
  const [activo, setActivo] = useState<number | null>(null)
  const maximo = Math.max(...datos.map((dato) => dato.valor), 1)

  return (
    <figure className="relative">
      <div className="relative" style={{ height: alto }} onMouseLeave={() => setActivo(null)}>
        {/* Rejilla discreta: base y mitad. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-sitio-borde-fuerte" />
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-sitio-borde" />
        <div aria-hidden="true" className="absolute inset-0 flex items-end gap-[2px]">
          {datos.map((dato, indice) => (
            <button
              key={dato.etiqueta}
              type="button"
              tabIndex={0}
              aria-label={`${dato.etiqueta}: ${formato(dato.valor)}`}
              onMouseEnter={() => setActivo(indice)}
              onFocus={() => setActivo(indice)}
              onBlur={() => setActivo(null)}
              className="group relative flex h-full min-w-0 flex-1 items-end outline-none"
            >
              <motion.span
                initial={{ height: 0 }}
                animate={{ height: `${(dato.valor / maximo) * 100}%` }}
                transition={{ duration: 0.9, delay: indice * 0.01, ease: SALIDA }}
                className={cn(
                  'block w-full rounded-t-[4px] bg-white transition-opacity duration-200',
                  dato.valor === 0 && 'min-h-px opacity-25',
                  activo !== null && activo !== indice && 'opacity-35',
                )}
              />
            </button>
          ))}
        </div>
        {activo !== null && datos[activo] && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-sitio-borde-fuerte bg-sitio-modal px-3 py-2 text-[12px] whitespace-nowrap shadow-xl"
            style={{ left: `${((activo + 0.5) / datos.length) * 100}%` }}
          >
            <p className="text-sitio-tenue">{datos[activo].etiqueta}</p>
            <p className="mt-0.5 font-medium tabular-nums">{formato(datos[activo].valor)}</p>
            {datos[activo].detalle && <p className="text-sitio-tenue">{datos[activo].detalle}</p>}
          </div>
        )}
      </div>
      {etiquetaCorta && (
        <div aria-hidden="true" className="mt-2 flex gap-[2px] text-[10px] text-sitio-tenue">
          {datos.map((dato, indice) => (
            <span key={dato.etiqueta} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
              {etiquetaCorta(dato.etiqueta, indice) ?? ''}
            </span>
          ))}
        </div>
      )}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>
          {datos.map((dato) => (
            <tr key={dato.etiqueta}>
              <th scope="row">{dato.etiqueta}</th>
              <td>{formato(dato.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/** Barras horizontales para rankings y embudos, con el número al lado. */
export function BarrasHorizontales({ datos, formato = String }: { datos: { nombre: string; cantidad: number }[]; formato?: (n: number) => string }) {
  const maximo = Math.max(...datos.map((dato) => dato.cantidad), 1)
  return (
    <ul className="flex flex-col gap-2.5">
      {datos.map((dato, indice) => (
        <li key={dato.nombre} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 text-[12.5px]">
          <span className="truncate text-sitio-suave">{dato.nombre}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.span
              className="block h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${(dato.cantidad / maximo) * 100}%` }}
              transition={{ duration: 0.9, delay: indice * 0.04, ease: SALIDA }}
            />
          </span>
          <span className="tabular-nums">{formato(dato.cantidad)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Enlace a WhatsApp con un texto ya escrito. */
export function enlaceWhatsapp(numero: string | null | undefined, texto: string) {
  const limpio = (numero ?? '').replace(/\D/g, '')
  const conPais = limpio.length === 10 ? `57${limpio}` : limpio
  return `https://wa.me/${conPais}?text=${encodeURIComponent(texto)}`
}
