'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CampoTexto } from './CamposFormulario'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function FormularioRecuperar() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault()

    if (!email.trim()) return setError('Escribí tu correo')
    if (!CORREO.test(email)) return setError('Ese correo no parece válido')
    setError(undefined)

    setEnviando(true)
    // TODO: pedir al backend que emita el enlace de recuperación.
    await new Promise((listo) => setTimeout(listo, 700))
    setEnviando(false)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600" aria-hidden="true">
            <path
              d="M4 7l8 6 8-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
            />
          </svg>
        </span>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-[-0.03em] text-sitio-tinta">
          Revisá tu correo
        </h1>

        {/*
          No se confirma si el correo existe o no: decirlo permitiría averiguar
          qué direcciones tienen cuenta en la plataforma.
        */}
        <p className="mt-2.5 leading-relaxed text-sitio-suave">
          Si <span className="font-medium text-sitio-tinta">{email}</span> tiene una cuenta, te
          mandamos un enlace para elegir una contraseña nueva. Caduca en una hora.
        </p>

        <p className="mt-6 text-sm text-sitio-tenue">
          ¿No te llegó? Mirá en spam o{' '}
          <button
            type="button"
            onClick={() => setEnviado(false)}
            className="font-medium text-sitio-azul underline underline-offset-2"
          >
            probá con otro correo
          </button>
          .
        </p>

        <Link
          href="/panel/ingresar"
          className="mt-8 inline-block text-sm font-medium text-sitio-azul transition-colors hover:text-sitio-azul-fuerte"
        >
          ← Volver a ingresar
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-sitio-tinta">
        Recuperá tu contraseña
      </h1>
      <p className="mt-2 text-sitio-suave">
        Escribí el correo con el que te registraste y te mandamos un enlace para cambiarla.
      </p>

      <form onSubmit={alEnviar} noValidate className="mt-8 space-y-5">
        <CampoTexto
          etiqueta="Correo"
          tipo="email"
          nombre="email"
          valor={email}
          alCambiar={setEmail}
          marcador="tu@correo.com"
          autoCompletar="email"
          error={error}
          autoFoco
        />

        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sitio-azul px-6 py-3 font-medium text-white transition-colors hover:bg-sitio-azul-fuerte disabled:opacity-60"
        >
          {enviando && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {enviando ? 'Enviando…' : 'Enviarme el enlace'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-sitio-suave">
        <Link
          href="/panel/ingresar"
          className="font-medium text-sitio-azul transition-colors hover:text-sitio-azul-fuerte"
        >
          ← Volver a ingresar
        </Link>
      </p>
    </>
  )
}
