import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MiTienda — Llano Studio',
    template: '%s · MiTienda',
  },
  description: 'Crea tu tienda en línea sin escribir una sola línea de código.',
}

/**
 * Layout raíz compartido por el panel y por las tiendas públicas. A propósito
 * casi vacío: cada rama define su propio marco visual.
 */
export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
