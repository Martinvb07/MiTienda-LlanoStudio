'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { configuracionDominios } from '@/utilidades/dominios'

const URL_API = process.env.URL_API ?? 'http://localhost:4000'

async function pedirConSesion<T>(ruta: string, token: string): Promise<T | null> {
  try {
    const respuesta = await fetch(`${URL_API}/api/panel${ruta}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
    })
    return respuesta.ok ? ((await respuesta.json()) as T) : null
  } catch {
    return null
  }
}

/**
 * Refresca la tienda pública después de guardar algo en el panel. Las páginas
 * de la tienda guardan lo que piden a la API hasta 60 s (ISR): sin esto, un
 * cambio recién guardado tardaba un minuto en verse.
 *
 * Sólo refresca la tienda de quien tiene la sesión: el token se comprueba con
 * la API, que es la que dice cuál es su subdominio y sus dominios propios.
 */
export async function refrescarTienda(token: string): Promise<void> {
  if (!token || token.length > 2000) return
  const sesion = await pedirConSesion<{ tenant: { subdominio: string } }>('/sesion', token)
  if (!sesion) return

  // Los dominios propios sólo los ve quien administra; para un editor se refresca el subdominio.
  const dominios = await pedirConSesion<{ dominios: { dominio: string; verificado: boolean }[] }>('/dominios', token)
  // Cada ficha guarda su producto con su propia etiqueta: hacen falta los slugs.
  const productos = await pedirConSesion<{ productos: { slug: string }[] }>('/productos', token)
  const subdominio = sesion.tenant.subdominio
  const identificadores = [subdominio, ...(dominios?.dominios ?? []).filter((dominio) => dominio.verificado).map((dominio) => dominio.dominio)]

  for (const identificador of identificadores) {
    // Las etiquetas van por host, como las pide la tienda (servicios/tiendas.servicio).
    const host = identificador.includes('.') ? identificador : `${identificador}.${configuracionDominios.dominioBase}`
    revalidateTag(`tienda:${host}`)
    revalidateTag(`productos:${host}`)
    for (const { slug } of productos?.productos ?? []) revalidateTag(`producto:${host}:${slug}`)
    // Y todas sus páginas (portada, productos, categorías…), que viven en /[subdominio].
    revalidatePath(`/${identificador}`, 'layout')
  }
}
