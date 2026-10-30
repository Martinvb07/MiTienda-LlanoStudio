'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { reportarError } from '@/utilidades/reportarError'

/**
 * Cuando algo se rompe en pantalla (web, panel o tienda): se reporta y se
 * ofrece reintentar, en vez de dejar a la persona frente a una página en blanco.
 */
export default function ErrorPagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportarError(error), [error])

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] tracking-[0.14em] text-current/50 uppercase">Algo salió mal</p>
      <h1 className="mt-3 text-3xl font-light tracking-tight">No pudimos mostrar esta página</h1>
      <p className="mt-3 max-w-md text-current/65">Ya nos llegó el aviso y lo estamos revisando. Prueba otra vez en un momento.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full border border-current px-5 py-2.5 text-sm transition hover:opacity-70">
          Intentar de nuevo
        </button>
        <Link href="/" className="rounded-full px-5 py-2.5 text-sm underline underline-offset-4 transition hover:opacity-70">
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}
