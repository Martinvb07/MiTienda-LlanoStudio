'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { leerToken, obtenerSesion, type SesionPanel } from '@/servicios/panel'

interface ContextoSesion {
  sesion: SesionPanel
  /** Vuelve a pedir la sesión (por ejemplo, tras renombrar la tienda). */
  recargar: () => Promise<void>
}

const Contexto = createContext<ContextoSesion | null>(null)

export function useSesion(): ContextoSesion {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>')
  return valor
}

/**
 * Guarda del tablero: sin token manda a ingresar, y con token carga quién es
 * y qué tienda administra antes de pintar nada.
 */
export function ProveedorSesion({ children, cargando }: { children: ReactNode; cargando: ReactNode }) {
  const router = useRouter()
  const [sesion, setSesion] = useState<SesionPanel | null>(null)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    try {
      setSesion(await obtenerSesion())
      setError('')
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cargar tu sesión')
    }
  }, [])

  useEffect(() => {
    if (!leerToken()) {
      router.replace('/panel/ingresar')
      return
    }
    void recargar()
  }, [recargar, router])

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void recargar()}
            className="mt-4 text-xs tracking-[0.09em] text-white uppercase underline-offset-4 hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!sesion) return <>{cargando}</>

  return <Contexto.Provider value={{ sesion, recargar }}>{children}</Contexto.Provider>
}
