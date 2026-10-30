/**
 * Service worker del panel (alcance /panel). Hace dos cosas:
 *   · Muestra los avisos push (pedido nuevo, cita, mensaje) aunque el panel esté cerrado.
 *   · Si no hay conexión al abrir una pantalla, muestra un aviso en vez del dinosaurio.
 * No guarda en caché datos del panel: todo lo que ve la dueña es siempre lo último.
 */
export const dynamic = 'force-static'

const CODIGO = `
const PAGINA_SIN_RED = '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0c;color:#f6f6f3;font-family:system-ui,sans-serif;text-align:center"><main style="padding:24px"><h1 style="font-weight:400">Sin conexión</h1><p style="color:#a1a1a6">Revisa tu internet y vuelve a intentar.</p><button onclick="location.reload()" style="margin-top:16px;border:1px solid #f6f6f3;background:none;color:inherit;border-radius:999px;padding:10px 20px">Reintentar</button></main></body></html>'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (evento) => {
  if (evento.request.mode !== 'navigate') return
  evento.respondWith(
    fetch(evento.request).catch(() => new Response(PAGINA_SIN_RED, { headers: { 'content-type': 'text/html; charset=utf-8' } })),
  )
})

self.addEventListener('push', (evento) => {
  let datos = {}
  try { datos = evento.data ? evento.data.json() : {} } catch { datos = { titulo: 'Mi Sitio', cuerpo: evento.data ? evento.data.text() : '' } }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Mi Sitio', {
      body: datos.cuerpo || '',
      icon: '/panel/icono-192.png',
      badge: '/panel/icono-192.png',
      tag: datos.etiqueta,
      renotify: Boolean(datos.etiqueta),
      data: { url: datos.url || '/panel' },
    }),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = new URL(evento.notification.data && evento.notification.data.url ? evento.notification.data.url : '/panel', self.location.origin).href
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if (ventana.url.startsWith(self.location.origin + '/panel')) {
          ventana.navigate(destino)
          return ventana.focus()
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
`

export function GET() {
  return new Response(CODIGO, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      // El navegador tiene que ver enseguida una versión nueva del worker.
      'cache-control': 'no-cache',
    },
  })
}
