'use client'

import { io, type Socket } from 'socket.io-client'

/**
 * Conexión al chat de soporte. Va al mismo dominio, bajo /api/tiempo-real,
 * para pasar por el mismo nginx que la API. En desarrollo, si Next no deja
 * pasar el websocket, socket.io sigue por polling largo.
 */
export const RUTA_TIEMPO_REAL = '/api/tiempo-real'
const ORIGEN = process.env.NEXT_PUBLIC_URL_TIEMPO_REAL || undefined

export function conectar(auth: Record<string, string | undefined>): Socket {
  const opciones = { path: RUTA_TIEMPO_REAL, addTrailingSlash: false, auth, transports: ['websocket', 'polling'], reconnectionDelayMax: 8000 }
  return ORIGEN ? io(ORIGEN, opciones) : io(opciones)
}
