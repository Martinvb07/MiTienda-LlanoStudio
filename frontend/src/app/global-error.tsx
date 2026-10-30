'use client'

import { useEffect } from 'react'
import { reportarError } from '@/utilidades/reportarError'

/** Último recurso: se rompió hasta el layout raíz. Sin estilos de la app, a propósito. */
export default function ErrorGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportarError(error), [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif', background: '#f6f6f3', color: '#0b0b0c' }}>
        <main style={{ padding: 24, textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontWeight: 400, fontSize: 28, margin: '0 0 12px' }}>No pudimos cargar la página</h1>
          <p style={{ color: '#4f4f52', margin: '0 0 24px' }}>Ya nos llegó el aviso. Prueba otra vez en un momento.</p>
          <button type="button" onClick={reset} style={{ border: '1px solid #0b0b0c', background: 'none', borderRadius: 999, padding: '10px 20px', cursor: 'pointer' }}>
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  )
}
