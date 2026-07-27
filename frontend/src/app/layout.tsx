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
    default: 'Mi Tienda',
    template: '%s · Mi Tienda',
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
      {/*
        suppressHydrationWarning por las extensiones del navegador: varias
        (ColorZilla, Grammarly y compañía) añaden atributos al <body> antes de
        que React arranque, y eso dispara un aviso de hidratación que no viene
        del código. Sólo afecta a los atributos de este elemento; cualquier
        desajuste real dentro del árbol se sigue reportando igual.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
