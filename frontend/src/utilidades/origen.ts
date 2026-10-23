'use client'

/**
 * De dónde llegó la persona: el ?utm_source= o el ?ref= (código de referido)
 * con el que entró por primera vez a la web. Se guarda para usarlo al crear la
 * cuenta, aunque se registre días después.
 */
const CLAVE = 'mitienda:origen'

export function capturarOrigen() {
  try {
    const parametros = new URLSearchParams(window.location.search)
    const ref = parametros.get('ref')?.trim().toUpperCase()
    const fuente = parametros.get('utm_source')?.trim().toLowerCase()
    if (!ref && !fuente) return
    const actual = leerOrigen()
    // El primer origen manda; un código de referido siempre se guarda.
    localStorage.setItem(CLAVE, JSON.stringify({ ref: ref || actual.ref, origen: actual.origen || fuente }))
  } catch {
    // Sin almacenamiento no hay atribución: no pasa nada.
  }
}

export function leerOrigen(): { ref?: string; origen?: string } {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as { ref?: string; origen?: string }
  } catch {
    return {}
  }
}
