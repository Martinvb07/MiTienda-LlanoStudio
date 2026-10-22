'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { registrarVisita } from '@/app/(tienda)/[subdominio]/visitas'

/**
 * Estadísticas sin cookies: cuenta cada página vista, qué producto se miró y
 * los clics a WhatsApp. "Visitante nuevo" es la primera página del día en esta
 * pestaña (sessionStorage), sin identificar a nadie.
 */
export function ContadorVisitas() {
  const ruta = usePathname()

  useEffect(() => {
    const camino = window.location.pathname
    const producto = camino.match(/^\/productos\/([a-z0-9-]+)/)?.[1]
    let nueva = false
    try {
      const clave = `mt-visita-${new Date().toISOString().slice(0, 10)}`
      nueva = !sessionStorage.getItem(clave)
      sessionStorage.setItem(clave, '1')
    } catch {
      // Sin almacenamiento: se cuenta la visita, no el visitante.
    }
    void registrarVisita(producto ? { tipo: 'producto', producto, nueva } : { tipo: 'pagina', nueva })
  }, [ruta])

  useEffect(() => {
    function alClic(evento: MouseEvent) {
      const enlace = (evento.target as HTMLElement).closest('a')
      if (enlace?.href.includes('wa.me/')) void registrarVisita({ tipo: 'whatsapp' })
    }
    document.addEventListener('click', alClic, true)
    return () => document.removeEventListener('click', alClic, true)
  }, [])

  return null
}
