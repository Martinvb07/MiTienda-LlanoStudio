'use client'

import { normalizarBloques } from '@/tipos/bloques'
import type { ProductoPanel, Tienda } from '@/tipos/tienda'

/**
 * Cliente del panel en el navegador. Habla con la API por el mismo origen:
 * next.config.ts reenvía /api/* al backend, así que no hay CORS ni URLs que
 * cambien entre entornos. La sesión es un JWT guardado en este navegador.
 */

const CLAVE_SESION = 'mitienda:sesion'

export class ErrorPanel extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
    /** Errores por campo, tal como los devuelve el validador del backend. */
    readonly campos: Record<string, string> = {},
  ) {
    super(mensaje)
    this.name = 'ErrorPanel'
  }
}

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_SESION)
  } catch {
    return null
  }
}

export function guardarToken(token: string) {
  try {
    localStorage.setItem(CLAVE_SESION, token)
  } catch {
    // Navegador sin almacenamiento: la sesión dura lo que dure la pestaña.
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Nada que borrar.
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = leerToken()
  const cabeceras = new Headers(opciones.headers)
  if (token) cabeceras.set('authorization', `Bearer ${token}`)
  if (opciones.body && typeof opciones.body === 'string') cabeceras.set('content-type', 'application/json')

  let respuesta: Response
  try {
    respuesta = await fetch(`/api/panel${ruta}`, { ...opciones, headers: cabeceras })
  } catch {
    throw new ErrorPanel(0, 'No pudimos conectar con el servidor. Revisa tu conexión.')
  }

  if (respuesta.status === 204) return undefined as T

  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    error?: { mensaje?: string; detalles?: { campo: string; mensaje: string }[] }
  } & T

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      cerrarSesion()
      window.location.assign('/panel/ingresar')
    }
    const campos = Object.fromEntries(
      (cuerpo.error?.detalles ?? []).map((detalle) => [detalle.campo, detalle.mensaje]),
    )
    throw new ErrorPanel(
      respuesta.status,
      cuerpo.error?.mensaje ?? `El servidor respondió ${respuesta.status}`,
      campos,
    )
  }

  return cuerpo
}

// ── Sesión ──

export interface SesionPanel {
  usuario: { nombre: string; email: string; rol: string }
  tenant: { subdominio: string; plan: string }
  tienda: { nombre: string; logoUrl: string | null; publicada: boolean } | null
}

export async function registrar(datos: {
  nombre: string
  email: string
  contrasena: string
  tienda: string
  subdominio: string
}) {
  const { token } = await pedir<{ token: string }>('/registro', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
  guardarToken(token)
}

export async function ingresar(email: string, contrasena: string) {
  const { token } = await pedir<{ token: string }>('/ingreso', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  })
  guardarToken(token)
}

export const obtenerSesion = () => pedir<SesionPanel>('/sesion')

// ── Tienda ──

export type DatosTienda = Pick<
  Tienda,
  'nombre' | 'descripcion' | 'logoUrl' | 'plantilla' | 'tema' | 'configuracionBloques' | 'ajustes' | 'publicada'
>

export async function obtenerTienda(): Promise<{ tienda: Tienda; subdominio: string }> {
  const { tienda, subdominio } = await pedir<{ tienda: Tienda; subdominio: string }>('/tienda')
  return {
    subdominio,
    tienda: {
      ...tienda,
      tema: tienda.tema ?? {},
      ajustes: tienda.ajustes ?? {},
      configuracionBloques: normalizarBloques(tienda.configuracionBloques),
    },
  }
}

export async function guardarTienda(datos: DatosTienda): Promise<Tienda> {
  const { tienda } = await pedir<{ tienda: Tienda }>('/tienda', {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
  return {
    ...tienda,
    ajustes: tienda.ajustes ?? {},
    configuracionBloques: normalizarBloques(tienda.configuracionBloques),
  }
}

// ── Productos ──

export type DatosProducto = Omit<ProductoPanel, 'id' | 'actualizadoEn'>

export const listarProductos = () =>
  pedir<{ productos: ProductoPanel[] }>('/productos').then((respuesta) => respuesta.productos)

export const crearProducto = (datos: DatosProducto) =>
  pedir<{ producto: ProductoPanel }>('/productos', {
    method: 'POST',
    body: JSON.stringify(datos),
  }).then((respuesta) => respuesta.producto)

export const actualizarProducto = (id: string, datos: DatosProducto) =>
  pedir<{ producto: ProductoPanel }>(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  }).then((respuesta) => respuesta.producto)

export const eliminarProducto = (id: string) =>
  pedir<void>(`/productos/${id}`, { method: 'DELETE' })

// ── Medios ──

export const FORMATOS_IMAGEN = 'image/png,image/jpeg,image/webp,image/avif,image/gif'

/** Sube una imagen y devuelve su URL pública. */
export async function subirImagen(archivo: File): Promise<string> {
  if (archivo.size > 8 * 1024 * 1024) {
    throw new ErrorPanel(413, `${archivo.name} pesa más de 8 MB`)
  }
  const { url } = await pedir<{ url: string }>('/medios', {
    method: 'POST',
    headers: { 'content-type': archivo.type },
    body: archivo,
  })
  return url
}
