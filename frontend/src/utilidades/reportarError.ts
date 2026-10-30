'use client'

/**
 * Manda a la API un error que le pasó a alguien en el navegador, para que
 * Llano Studio se entere (Sistema → Errores recientes y la alerta por correo).
 * Si el reporte falla, no se insiste: lo importante es que la persona siga.
 */
export function reportarError(error: Error & { digest?: string }): void {
  try {
    void fetch('/api/plataforma/errores', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mensaje: (error.message || 'Error sin mensaje').slice(0, 500),
        ruta: `${window.location.host}${window.location.pathname}`.slice(0, 300),
        pila: error.stack?.slice(0, 3000),
        digest: error.digest,
      }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // Sin red o sin fetch: nada que hacer.
  }
}
