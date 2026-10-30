'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Favoritos del comprador, guardados en su navegador (sin cuenta). Cada
 * tienda tiene los suyos: la clave lleva el host.
 */
const clave = () => `mt-favoritos:${window.location.host}`
const EVENTO = 'mt-favoritos'

function leer(): string[] {
  try {
    const valor = JSON.parse(localStorage.getItem(clave()) ?? '[]') as unknown
    return Array.isArray(valor) ? valor.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function useFavoritos() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(leer())
    const refrescar = () => setIds(leer())
    // Otro corazón de la misma página, u otra pestaña, cambió la lista.
    window.addEventListener(EVENTO, refrescar)
    window.addEventListener('storage', refrescar)
    return () => {
      window.removeEventListener(EVENTO, refrescar)
      window.removeEventListener('storage', refrescar)
    }
  }, [])

  const alternar = useCallback((id: string) => {
    const actuales = leer()
    const nuevos = actuales.includes(id) ? actuales.filter((otro) => otro !== id) : [id, ...actuales].slice(0, 100)
    try {
      localStorage.setItem(clave(), JSON.stringify(nuevos))
    } catch {
      // Sin almacenamiento: el corazón dura lo que la página.
    }
    setIds(nuevos)
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  return { ids, alternar, es: (id: string) => ids.includes(id) }
}
