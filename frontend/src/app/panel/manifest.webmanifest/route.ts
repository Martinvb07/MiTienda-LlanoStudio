/**
 * Manifiesto del panel como app: se instala en el celular ("Agregar a la
 * pantalla de inicio") y abre directo en el tablero, sin barra del navegador.
 */
export const dynamic = 'force-static'

export function GET() {
  const manifiesto = {
    name: 'Mi Sitio · Panel',
    short_name: 'Mi Sitio',
    description: 'Tus pedidos, productos, citas y mensajes en el celular.',
    id: '/panel',
    start_url: '/panel',
    scope: '/panel',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    lang: 'es-CO',
    icons: [
      { src: '/panel/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/panel/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/panel/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Pedidos', url: '/panel/pedidos', icons: [{ src: '/panel/icono-192.png', sizes: '192x192' }] },
      { name: 'Productos', url: '/panel/productos', icons: [{ src: '/panel/icono-192.png', sizes: '192x192' }] },
      { name: 'Agenda', url: '/panel/agenda', icons: [{ src: '/panel/icono-192.png', sizes: '192x192' }] },
    ],
  }
  return new Response(JSON.stringify(manifiesto), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}
