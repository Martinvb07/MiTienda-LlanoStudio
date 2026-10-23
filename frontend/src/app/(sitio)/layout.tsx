import type { Metadata } from 'next'
import { CapturaOrigen } from '@/componentes/comunes/CapturaOrigen'
import { Encabezado } from '@/componentes/sitio/Encabezado'
import { PieSitio } from '@/componentes/sitio/PieSitio'
import { ChatSoporte } from '@/componentes/comunes/ChatSoporte'

export const metadata: Metadata = {
  // `absolute` salta la plantilla del layout raíz: sin esto la pestaña diría
  // "Mi Sitio · Mi Sitio".
  title: { absolute: 'Mi Sitio' },
  description:
    'Diseña, personaliza y publica una tienda moderna sin escribir código. Arrastra bloques, sube tus productos y vende desde tu propio dominio. Hecho para Colombia.',
  openGraph: {
    title: 'Mi Sitio — Llano Studio',
    description: 'Tu tienda en línea profesional, sin escribir una sola línea de código.',
    locale: 'es_CO',
    type: 'website',
  },
}

/** Marco de la web comercial: se sirve en llanostudio.co y en www. */
export default function LayoutSitio({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-oscuro min-h-screen overflow-x-clip font-sans">
      <CapturaOrigen />
      <Encabezado />
      <main>{children}</main>
      <PieSitio />
      <ChatSoporte modo="web" />
    </div>
  )
}
