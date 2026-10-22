'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utilidades/clases'

interface PropsCampo {
  etiqueta: string
  tipo?: 'text' | 'email'
  nombre: string
  valor: string
  alCambiar: (valor: string) => void
  marcador?: string
  autoCompletar?: string
  error?: string
  ayuda?: React.ReactNode
  autoFoco?: boolean
}

const CLASES_BASE =
  'mt-1.5 w-full rounded-lg border bg-[#121214] px-3.5 py-2.5 text-[14px] text-white outline-none transition-[border-color,box-shadow] placeholder:text-sitio-tenue focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]'

export function CampoTexto({
  etiqueta,
  tipo = 'text',
  nombre,
  valor,
  alCambiar,
  marcador,
  autoCompletar,
  error,
  ayuda,
  autoFoco,
}: PropsCampo) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="text-[12px] text-sitio-suave">
        {etiqueta}
      </label>
      <input
        id={id}
        name={nombre}
        type={tipo}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        placeholder={marcador}
        autoComplete={autoCompletar}
        autoFocus={autoFoco}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          CLASES_BASE,
          error
            ? 'border-red-400/60 focus:border-red-400'
            : 'border-sitio-borde focus:border-white/40',
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[12.5px] text-red-300">
          {error}
        </p>
      ) : (
        ayuda && <div className="mt-1.5 text-sm text-sitio-tenue">{ayuda}</div>
      )}
    </div>
  )
}

interface PropsContrasena {
  etiqueta: string
  nombre: string
  valor: string
  alCambiar: (valor: string) => void
  autoCompletar?: string
  error?: string
  /** Muestra la barra de fortaleza; sólo tiene sentido al crear la cuenta. */
  medirFortaleza?: boolean
  enlaceOlvido?: React.ReactNode
}

/** Mide la fortaleza de forma orientativa: longitud y variedad de caracteres. */
function calcularFortaleza(valor: string): { nivel: 0 | 1 | 2 | 3; etiqueta: string } {
  if (valor.length < 8) return { nivel: 0, etiqueta: 'Muy corta' }

  let puntos = 0
  if (valor.length >= 12) puntos++
  if (/[a-z]/.test(valor) && /[A-Z]/.test(valor)) puntos++
  if (/\d/.test(valor)) puntos++
  if (/[^a-zA-Z0-9]/.test(valor)) puntos++

  if (puntos <= 1) return { nivel: 1, etiqueta: 'Débil' }
  if (puntos <= 2) return { nivel: 2, etiqueta: 'Aceptable' }
  return { nivel: 3, etiqueta: 'Fuerte' }
}

const COLORES_FORTALEZA = ['bg-red-400', 'bg-amber-400', 'bg-emerald-500'] as const

export function CampoContrasena({
  etiqueta,
  nombre,
  valor,
  alCambiar,
  autoCompletar,
  error,
  medirFortaleza = false,
  enlaceOlvido,
}: PropsContrasena) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const fortaleza = calcularFortaleza(valor)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] text-sitio-suave">
          {etiqueta}
        </label>
        {enlaceOlvido}
      </div>

      <div className="relative">
        <input
          id={id}
          name={nombre}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          autoComplete={autoCompletar}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            CLASES_BASE,
            'pr-11',
            error
              ? 'border-red-400/60 focus:border-red-400'
              : 'border-sitio-borde focus:border-white/40',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((estado) => !estado)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute top-1/2 right-1 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-sitio-tenue transition-colors hover:text-white"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[12.5px] text-red-300">
          {error}
        </p>
      ) : (
        medirFortaleza &&
        valor.length > 0 && (
          <div className="mt-2 flex items-center gap-2.5">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2].map((tramo) => (
                <span
                  key={tramo}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-300',
                    fortaleza.nivel > tramo
                      ? COLORES_FORTALEZA[Math.min(fortaleza.nivel, 3) - 1]
                      : 'bg-sitio-borde',
                  )}
                />
              ))}
            </div>
            <span className="w-20 text-right text-xs text-sitio-tenue">{fortaleza.etiqueta}</span>
          </div>
        )
      )}
    </div>
  )
}

/** Aviso del formulario: error del servidor o algo que todavía no está conectado. */
export function AvisoFormulario({
  tono = 'error',
  children,
}: {
  tono?: 'error' | 'pendiente'
  children: React.ReactNode
}) {
  return (
    <div
      role={tono === 'error' ? 'alert' : undefined}
      className={cn(
        'rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed',
        tono === 'error'
          ? 'border-red-500/20 bg-red-500/[0.08] text-red-300'
          : 'border-sitio-ambar/30 bg-sitio-ambar/[0.08] text-sitio-suave',
      )}
    >
      {children}
    </div>
  )
}
