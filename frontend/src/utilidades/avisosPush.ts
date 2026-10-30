'use client'

/** Registro del service worker del panel y suscripción a los avisos push. */

const RUTA_WORKER = '/panel/sw.js'

export const pushDisponible = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export async function registrarWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(RUTA_WORKER, { scope: '/panel' })
  } catch {
    return null
  }
}

/** La llave pública VAPID llega en base64url; el navegador la quiere en bytes. */
function bytesDeLlave(llave: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (llave.length % 4)) % 4)
  const binario = atob((llave + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binario.length))
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

export async function suscripcionActual(): Promise<PushSubscription | null> {
  const registro = await registrarWorker()
  return registro ? registro.pushManager.getSubscription() : null
}

/** Pide permiso y suscribe este dispositivo. Devuelve la suscripción para mandarla a la API. */
export async function suscribir(llave: string): Promise<PushSubscription> {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('Para recibir avisos, permite las notificaciones de este sitio en tu navegador.')
  const registro = await registrarWorker()
  if (!registro) throw new Error('Este navegador no deja instalar el panel como app.')
  await navigator.serviceWorker.ready
  return (
    (await registro.pushManager.getSubscription()) ??
    registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesDeLlave(llave) })
  )
}
