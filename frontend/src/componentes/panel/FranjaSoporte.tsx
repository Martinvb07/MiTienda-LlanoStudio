'use client'

import { useEffect, useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { cerrarSesion } from '@/servicios/panel'

const CLAVE_SOPORTE = 'mitienda:soporte'

/**
 * Cuando un admin entra al panel de una tienda para darle soporte, una franja
 * lo recuerda todo el tiempo y le da la salida.
 */
export function FranjaSoporte() {
  const [tienda, setTienda] = useState<string | null>(null)
  useEffect(() => {
    try {
      setTienda(localStorage.getItem(CLAVE_SOPORTE))
    } catch {
      setTienda(null)
    }
  }, [])
  if (!tienda) return null

  function salir() {
    try {
      localStorage.removeItem(CLAVE_SOPORTE)
    } catch {
      // Nada que limpiar.
    }
    cerrarSesion()
    window.location.assign('/panel/admin?s=tiendas')
  }

  return (
    <div role="status" className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-sitio-ambar px-4 py-2 text-[12.5px] font-medium text-black">
      <LifeBuoy aria-hidden="true" className="h-4 w-4" />
      <span>
        Modo soporte: estás viendo el panel de <strong>{tienda}</strong> como su dueña.
      </span>
      <button type="button" onClick={salir} className="rounded-md bg-black/15 px-2.5 py-1 text-[11.5px] hover:bg-black/25">
        Salir
      </button>
    </div>
  )
}
