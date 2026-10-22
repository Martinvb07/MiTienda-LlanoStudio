'use server'

import { headers } from 'next/headers'
import { enviarApi } from '@/servicios/api'
import { CABECERA_HOST } from '@/middleware'

/** Suma una visita a las estadísticas de la tienda. Nunca falla hacia el visitante. */
export async function registrarVisita(datos: { tipo: 'pagina' | 'producto' | 'whatsapp'; nueva?: boolean; producto?: string }) {
  const host = (await headers()).get(CABECERA_HOST)
  if (!host) return
  await enviarApi('/api/visitas', datos, host).catch(() => undefined)
}
