import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SCRIPT_TEMA } from '@/componentes/comunes/BotonTema'

// Geist, la misma familia de llanostudio.co: titulares grandes y finos y texto
// corrido con la misma voz. La tienda pública también la usa por defecto.
const texto = Geist({
  subsets: ['latin'],
  variable: '--fuente-sans',
  display: 'swap',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--fuente-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mi Sitio',
    template: '%s · Mi Sitio',
  },
  description: 'Mi Sitio: tu tienda, tu página y tus enlaces, sin escribir código.',
}

/**
 * Layout raíz compartido por la web comercial, el panel y las tiendas públicas.
 * A propósito casi vacío: cada rama define su propio marco visual.
 */
export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: data-tema lo pone el script de abajo antes de
    // que React arranque, así que el servidor no lo conoce.
    <html lang="es" className={`${texto.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
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
