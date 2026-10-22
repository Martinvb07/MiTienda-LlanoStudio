'use client'

import { ErrorPanel } from './panel'

/**
 * Cliente del panel de la plataforma (Llano Studio). Token aparte del de los
 * dueños de tienda, guardado sólo en esta pestaña: se cierra con ella.
 */

const CLAVE = 'mitienda:admin'

export const leerTokenAdmin = () => {
  try {
    return sessionStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function cerrarSesionAdmin() {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // Nada que borrar.
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = leerTokenAdmin()
  const cabeceras = new Headers(opciones.headers)
  if (token) cabeceras.set('authorization', `Bearer ${token}`)
  if (opciones.body) cabeceras.set('content-type', 'application/json')

  const respuesta = await fetch(`/api/admin${ruta}`, { ...opciones, headers: cabeceras }).catch(() => {
    throw new ErrorPanel(0, 'No pudimos conectar con el servidor.')
  })
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: { mensaje?: string } } & T
  if (!respuesta.ok) {
    if (respuesta.status === 401) cerrarSesionAdmin()
    throw new ErrorPanel(respuesta.status, cuerpo.error?.mensaje ?? `El servidor respondió ${respuesta.status}`)
  }
  return cuerpo
}

export async function ingresarAdmin(email: string, contrasena: string) {
  const { token } = await pedir<{ token: string }>('/ingreso', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  })
  try {
    sessionStorage.setItem(CLAVE, token)
  } catch {
    // Sin almacenamiento la sesión no sobrevive a recargar.
  }
}

export interface ResumenAdmin {
  tiendas: number
  publicadas: number
  suspendidas: number
  productos: number
  nuevasEstaSemana: number
  porPlan: Record<string, number>
}

export interface TiendaAdmin {
  id: string
  nombre: string
  subdominio: string
  plan: string
  activo: boolean
  creadoEn: string
  publicada: boolean
  logoUrl: string | null
  productos: number
  propietario: { nombre: string; email: string; ultimoAccesoEn: string | null } | null
}

export const obtenerResumen = () => pedir<ResumenAdmin>('/resumen')

export const listarTiendas = (buscar = '') =>
  pedir<{ tiendas: TiendaAdmin[] }>(`/tiendas${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''}`).then(
    (respuesta) => respuesta.tiendas,
  )

export const cambiarTienda = (id: string, cambios: { plan?: string; activo?: boolean }) =>
  pedir<{ tenant: { id: string; plan: string; activo: boolean } }>(`/tiendas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  }).then((respuesta) => respuesta.tenant)
