'use client'

import { useId, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Lock } from 'lucide-react'
import { cn } from '@/utilidades/clases'

/*
 * Piezas del panel, calcadas del editor de proyectos de llanostudio.co:
 * botones pequeños de 34 px, campos sobre #121214, acordeones con flecha que
 * gira, interruptores verdes y segmentados. Todo con la curva out-quint.
 */

export const CURVA = [0.22, 1, 0.36, 1] as const

type VarianteBoton = 'normal' | 'primario' | 'suave' | 'fantasma' | 'peligro'

const VARIANTES: Record<VarianteBoton, string> = {
  normal: 'border-sitio-borde bg-white/[0.04] text-sitio-suave hover:bg-white/[0.09] hover:text-white',
  primario: 'border-white bg-white text-black hover:bg-sitio-hover-primario',
  suave: 'border-sitio-borde bg-white/[0.04] text-white hover:bg-white/[0.09]',
  fantasma: 'border-sitio-borde bg-transparent text-sitio-suave hover:bg-white/[0.06] hover:text-white',
  peligro: 'border-red-500/25 bg-red-500/[0.06] text-sitio-rojo hover:bg-red-500/[0.14] hover:text-red-300',
}

export function BotonPanel({
  variante = 'normal',
  className,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBoton }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-[34px] items-center justify-center gap-[7px] rounded-lg border px-[13px] text-[12.5px] font-medium whitespace-nowrap transition-[background,color,border-color,transform] duration-200 enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTES[variante],
        className,
      )}
      {...resto}
    />
  )
}

export function Etiqueta({
  tono = 'neutro',
  children,
}: {
  tono?: 'neutro' | 'verde' | 'ambar' | 'azul'
  children: ReactNode
}) {
  return (
    <span className="estado estado-chico" data-tono={tono}>
      <span aria-hidden="true" className="estado-punto" />
      {children}
    </span>
  )
}

export function Aviso({ tono = 'error', children }: { tono?: 'error' | 'nota'; children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: CURVA }}
      className={cn(
        'overflow-hidden rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed',
        tono === 'error'
          ? 'border-red-500/20 bg-red-500/[0.08] text-red-300'
          : 'border-sitio-azul-claro/20 bg-sitio-azul-claro/[0.08] text-sitio-suave',
      )}
    >
      {children}
    </motion.p>
  )
}

/** Sección plegable del editor: título con flecha que gira y contenido que se desliza. */
export function Seccion({
  titulo,
  abierta: abiertaInicial = false,
  abrirCon,
  extra,
  children,
}: {
  titulo: string
  abierta?: boolean
  /** Cuando este valor cambia a algo, la sección se abre sola (por ejemplo, al elegir algo adentro). */
  abrirCon?: string | null
  extra?: ReactNode
  children: ReactNode
}) {
  const [abierta, setAbierta] = useState(abiertaInicial)
  const [ultimo, setUltimo] = useState(abrirCon)
  if (abrirCon !== ultimo) {
    setUltimo(abrirCon)
    if (abrirCon) setAbierta(true)
  }

  return (
    <section className="border-b border-sitio-borde">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={abierta}
          onClick={() => setAbierta((valor) => !valor)}
          className="flex flex-1 items-center justify-between px-1 py-[15px] text-left text-[13.5px] font-medium text-white transition-colors hover:text-sitio-suave"
        >
          {titulo}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-4 w-4 text-sitio-tenue transition-transform duration-[450ms] ease-salida',
              abierta && 'rotate-180',
            )}
          />
        </button>
        {extra}
      </div>
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: CURVA }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3.5 px-1 pt-0.5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export const CLASES_ENTRADA =
  'w-full rounded-lg border border-sitio-borde bg-sitio-campo px-[11px] py-[9px] text-[13.5px] text-white transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-sitio-tenue focus:border-white/40 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] read-only:text-sitio-tenue'

interface PropsCampo {
  etiqueta: string
  valor: string | number
  alCambiar: (valor: string) => void
  tipo?: 'text' | 'number' | 'url' | 'email' | 'password' | 'datetime-local'
  marcador?: string
  maximo?: number
  ayuda?: ReactNode
  error?: string
  prefijo?: string
  lista?: string[]
  autoFoco?: boolean
  autoCompletar?: string
  min?: number
}

export function Campo({
  etiqueta,
  valor,
  alCambiar,
  tipo = 'text',
  marcador,
  maximo,
  ayuda,
  error,
  prefijo,
  lista,
  autoFoco,
  autoCompletar,
  min,
}: PropsCampo) {
  const id = useId()
  const entrada = (
    <input
      id={id}
      type={tipo}
      value={valor}
      onChange={(evento) => alCambiar(evento.target.value)}
      placeholder={marcador}
      maxLength={maximo}
      min={min}
      list={lista ? `${id}-lista` : undefined}
      autoFocus={autoFoco}
      autoComplete={autoCompletar}
      aria-invalid={Boolean(error)}
      className={cn(
        CLASES_ENTRADA,
        prefijo && '!border-0 !bg-transparent !pl-0.5 !shadow-none',
        error && 'border-red-400/60',
      )}
    />
  )

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[11.5px] text-sitio-suave">
        {etiqueta}
      </label>
      {prefijo ? (
        <div
          className={cn(
            'flex items-center overflow-hidden rounded-lg border bg-sitio-campo focus-within:border-white/40',
            error ? 'border-red-400/60' : 'border-sitio-borde',
          )}
        >
          <i className="pl-[11px] text-[12.5px] whitespace-nowrap text-sitio-tenue not-italic">{prefijo}</i>
          {entrada}
        </div>
      ) : (
        entrada
      )}
      {lista && (
        <datalist id={`${id}-lista`}>
          {lista.map((opcion) => (
            <option key={opcion} value={opcion} />
          ))}
        </datalist>
      )}
      {error ? (
        <span className="text-[11.5px] text-red-300">{error}</span>
      ) : (
        ayuda && <span className="text-[11px] text-sitio-tenue">{ayuda}</span>
      )}
    </div>
  )
}

export function CampoArea({
  etiqueta,
  valor,
  alCambiar,
  filas = 3,
  maximo,
  marcador,
}: {
  etiqueta: string
  valor: string
  alCambiar: (valor: string) => void
  filas?: number
  maximo?: number
  marcador?: string
}) {
  const id = useId()
  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11.5px] text-sitio-suave">
        {etiqueta}
      </label>
      <textarea
        id={id}
        rows={filas}
        value={valor}
        maxLength={maximo}
        placeholder={marcador}
        onChange={(evento) => alCambiar(evento.target.value)}
        className={cn(CLASES_ENTRADA, 'resize-y leading-normal')}
      />
      {maximo && (
        <em className="absolute right-2 bottom-[7px] text-[11px] text-sitio-tenue not-italic">
          {valor.length}/{maximo}
        </em>
      )}
    </div>
  )
}

/**
 * Selector de color con código escrito a mano: acepta "#f0b429" o "f0b429" y
 * lo aplica en cuanto está completo. Al salir del campo también acepta el corto
 * ("#fb4") y, si quedó inválido, vuelve al color actual.
 */
export function CampoColor({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string
  valor: string
  alCambiar: (valor: string) => void
}) {
  const [texto, setTexto] = useState(valor)
  const [anterior, setAnterior] = useState(valor)
  if (anterior !== valor) {
    setAnterior(valor)
    setTexto(valor)
  }

  function aplicar(crudo: string, final: boolean) {
    let color = crudo.trim().replace(/^#?/, '#')
    if (final && /^#[0-9a-f]{3}$/i.test(color)) {
      color = '#' + color.slice(1).split('').map((c) => c + c).join('')
    }
    if (/^#[0-9a-f]{6}$/i.test(color)) alCambiar(color.toLowerCase())
    else if (final) setTexto(valor)
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11.5px] text-sitio-suave">{etiqueta}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          aria-label={`Elegir ${etiqueta.toLowerCase()}`}
          className="h-[34px] w-[38px] shrink-0 cursor-pointer rounded-lg border border-sitio-borde bg-sitio-campo p-0.5"
        />
        <input
          value={texto}
          maxLength={7}
          spellCheck={false}
          aria-label={`Código de ${etiqueta.toLowerCase()}`}
          onChange={(evento) => {
            setTexto(evento.target.value)
            aplicar(evento.target.value, false)
          }}
          onBlur={(evento) => aplicar(evento.target.value, true)}
          className={cn(CLASES_ENTRADA, 'min-w-0 flex-1 font-mono text-[12.5px] lowercase')}
        />
      </div>
    </div>
  )
}

export function Interruptor({
  activo,
  alCambiar,
  children,
}: {
  activo: boolean
  alCambiar: (valor: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 text-[13.5px]">
      <input
        type="checkbox"
        checked={activo}
        onChange={(evento) => alCambiar(evento.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          'relative flex h-[22px] w-10 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 peer-focus-visible:shadow-[0_0_0_3px_rgba(107,141,255,0.35)]',
          activo ? 'justify-end bg-white' : 'justify-start bg-white/15',
        )}
      >
        {/* La perilla viaja con resorte y se estira un poco mientras se presiona. */}
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className={cn(
            'h-4 w-4 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-[width,background-color] duration-200 group-active:w-5',
            activo ? 'bg-black' : 'bg-[#fff]',
          )}
        />
      </span>
      <span>{children}</span>
    </label>
  )
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  alCambiar,
  chico = false,
}: {
  opciones: readonly { valor: T; etiqueta: ReactNode; titulo?: string }[]
  valor: T
  alCambiar: (valor: T) => void
  chico?: boolean
}) {
  // Cada selector necesita su propio layoutId, si no las píldoras de dos
  // selectores distintos saltarían de uno a otro.
  const grupo = useId()

  return (
    <div className="inline-flex rounded-[9px] border border-sitio-borde bg-white/5 p-[3px]">
      {opciones.map((opcion) => {
        const activo = valor === opcion.valor
        return (
          <button
            key={opcion.valor}
            type="button"
            title={opcion.titulo}
            aria-label={opcion.titulo}
            aria-pressed={activo}
            onClick={() => alCambiar(opcion.valor)}
            className={cn(
              'relative grid place-items-center rounded-md px-[11px] text-xs outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-sitio-azul-claro/60',
              chico ? 'h-[26px] text-[11.5px]' : 'h-7',
              activo ? 'text-black' : 'text-sitio-tenue hover:text-sitio-suave',
            )}
          >
            {activo && (
              <motion.span
                layoutId={`segmentado-${grupo}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
                className="absolute inset-0 rounded-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
              />
            )}
            <span className="relative">{opcion.etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Lo que el plan actual no incluye: una línea discreta con candado y enlace a los planes. */
export function Candado({ plan, children }: { plan: string; children?: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[12px] leading-relaxed text-sitio-tenue">
      <Lock aria-hidden="true" className="mt-[3px] h-3 w-3 shrink-0" strokeWidth={2} />
      <span>
        {children} Incluido desde {plan}.{' '}
        <Link
          href="/panel/plan"
          className="text-sitio-suave underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
        >
          Ver planes
        </Link>
      </span>
    </p>
  )
}

/** Marca de "esto es de otro plan": candado y nombre del plan, sin color. */
export function PlanRequerido({ plan }: { plan: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] tracking-[0.04em] text-sitio-tenue">
      <Lock aria-hidden="true" className="h-2.5 w-2.5" strokeWidth={2.2} />
      {plan}
    </span>
  )
}
