import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

// Space Grotesk para titulares: tiene carácter propio sin volverse decorativa,
// y sus formas geométricas apretadas aguantan bien los tamaños grandes.
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--fuente-display',
  display: 'swap',
})

const texto = Inter({
  subsets: ['latin'],
  variable: '--fuente-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MiTienda — Llano Studio',
    template: '%s · MiTienda',
  },
  description: 'Crea tu tienda en línea sin escribir una sola línea de código.',
}

/**
 * Layout raíz compartido por la web comercial, el panel y las tiendas públicas.
 * A propósito casi vacío: cada rama define su propio marco visual.
 */
export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  )
}
