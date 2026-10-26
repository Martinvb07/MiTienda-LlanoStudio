'use server'

import { headers } from 'next/headers'
import { enviarApi } from '@/servicios/api'
import { CABECERA_HOST } from '@/middleware'

/*
 * Lo que el visitante hace en las secciones del sitio (reservar, escribir,
 * opinar): el Host lo fija el middleware, así que todo va a la tienda que se
 * está viendo y no a otra.
 */

const URL_API = process.env.URL_API ?? 'http://localhost:4000'

async function hostActual() {
  return (await headers()).get(CABECERA_HOST)
}

/** GET a la API en nombre de la tienda actual, sin caché: los cupos cambian a cada rato. */
async function consultar<T>(ruta: string): Promise<T | null> {
  const host = await hostActual()
  if (!host) return null
  try {
    const respuesta = await fetch(`${URL_API}${ruta}`, {
      headers: {
        accept: 'application/json',
        'x-mitienda-host': host,
        ...(process.env.MITIENDA_TOKEN_INTERNO ? { 'x-mitienda-interno': process.env.MITIENDA_TOKEN_INTERNO } : {}),
      },
      cache: 'no-store',
    })
    return respuesta.ok ? ((await respuesta.json()) as T) : null
  } catch {
    return null
  }
}

type Resultado<T> = { ok: true; datos: T } | { ok: false; mensaje: string; campos: Record<string, string> }

async function enviar<T>(ruta: string, cuerpo: unknown): Promise<Resultado<T>> {
  const host = await hostActual()
  if (!host) return { ok: false, mensaje: 'No sabemos en qué sitio estás.', campos: {} }
  const respuesta = await enviarApi<T>(ruta, cuerpo, host)
  return respuesta.ok ? { ok: true, datos: respuesta.datos } : { ok: false, mensaje: respuesta.mensaje, campos: respuesta.campos }
}

// ── Reservas ──

export interface CitaPublica {
  codigo: string
  servicio: string
  duracion: number
  precio: string | null
  fecha: string
  hora: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO'
  clienteNombre: string
}

export async function diasConCupo(servicio: string) {
  return (await consultar<{ dias: string[] }>(`/api/reservas/disponibilidad?servicio=${encodeURIComponent(servicio)}`))?.dias ?? null
}

export async function horasConCupo(servicio: string, fecha: string) {
  const parametros = new URLSearchParams({ servicio, fecha })
  return (await consultar<{ horas: string[] }>(`/api/reservas/disponibilidad?${parametros}`))?.horas ?? null
}

export async function reservar(datos: {
  servicioId: string
  fecha: string
  hora: string
  nombre: string
  telefono: string
  email?: string
  notas?: string
}) {
  return enviar<{ cita: CitaPublica }>('/api/reservas', datos)
}

export async function verCita(codigo: string) {
  return (await consultar<{ cita: CitaPublica }>(`/api/reservas/${encodeURIComponent(codigo)}`))?.cita ?? null
}

export async function cancelarCita(codigo: string) {
  return enviar<{ cita: CitaPublica }>(`/api/reservas/${encodeURIComponent(codigo)}/cancelar`, {})
}
