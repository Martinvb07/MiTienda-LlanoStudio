import type { Metadata } from 'next'
import { HostConfirmaciones } from '@/componentes/panel/ui/confirmar'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel de Mi Sitio' },
  // El panel nunca debe aparecer en buscadores.
  robots: { index: false, follow: false },
}

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
    </>
  )
}
