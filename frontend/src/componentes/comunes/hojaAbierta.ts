'use client'

import { useEffect, useRef } from 'react'

/**
 * Mientras una hoja de abajo (el "Más" del celular) está abierta: marca el
 * <html> para que el botón del chat se esconda y la cierra con Escape.
 */
export function useHojaAbierta(abierta: boolean, alCerrar: () => void) {
  const cerrar = useRef(alCerrar)
  useEffect(() => {
    cerrar.current = alCerrar
  })

  useEffect(() => {
    if (!abierta) return
    const raiz = document.documentElement
    raiz.dataset.hojaAbierta = ''
    const alTecla = (evento: KeyboardEvent) => evento.key === 'Escape' && cerrar.current()
    window.addEventListener('keydown', alTecla)
    return () => {
      delete raiz.dataset.hojaAbierta
      window.removeEventListener('keydown', alTecla)
    }
  }, [abierta])
}
