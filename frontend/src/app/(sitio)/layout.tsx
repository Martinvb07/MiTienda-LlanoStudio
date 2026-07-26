import type { Metadata } from 'next'
import { Encabezado } from '@/componentes/sitio/Encabezado'
import { PieSitio } from '@/componentes/sitio/PieSitio'

export const metadata: Metadata = {
  // `absolute` salta la plantilla del layout raíz: sin esto la pestaña diría
  // "MiTienda.com · MiTienda".
  title: { absolute: 'MiTienda.com' },
  description:
    'Diseña, personaliza y publica una tienda moderna sin escribir código. Arrastra bloques, sube tus productos y vende desde tu propio dominio. Hecho para Colombia.',
  openGraph: {
    title: 'MiTienda — Llano Studio',
    description: 'Tu tienda en línea profesional, sin escribir una sola línea de código.',
    locale: 'es_CO',
    type: 'website',
  },
}

/** Marco de la web comercial: se sirve en llanostudio.co y en www. */
export default function LayoutSitio({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white font-sans text-sitio-tinta antialiased">
      <Encabezado />
      <main>{children}</main>
      <PieSitio />
    </div>
  )
}
