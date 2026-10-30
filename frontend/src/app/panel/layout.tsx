import type { Metadata, Viewport } from 'next'
import { HostConfirmaciones } from '@/componentes/panel/ui/confirmar'
import { RegistrarWorker } from '@/componentes/panel/RegistrarWorker'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel de Mi Sitio' },
  // El panel nunca debe aparecer en buscadores.
  robots: { index: false, follow: false },
  // Instalable como app en el celular (ver manifest.webmanifest y sw.js).
  manifest: '/panel/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Mi Sitio', statusBarStyle: 'black-translucent' },
  icons: { apple: '/panel/icono-apple-180.png' },
}

export const viewport: Viewport = { themeColor: '#0b0b0c' }

/**
 * Raíz del panel. No pinta nada: el marco lo ponen los grupos que cuelgan
 * debajo, porque las pantallas de sesión y las del tablero necesitan marcos
 * distintos —un login con barra lateral de administración no tendría sentido.
 */
export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HostConfirmaciones />
      <RegistrarWorker />
    </>
  )
}
