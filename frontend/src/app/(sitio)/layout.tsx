import type { Metadata } from 'next'
import { CapturaOrigen } from '@/componentes/comunes/CapturaOrigen'
import { Encabezado } from '@/componentes/sitio/Encabezado'
import { PieSitio } from '@/componentes/sitio/PieSitio'
import { ChatSoporte } from '@/componentes/comunes/ChatSoporte'
import { DatosEstructurados } from '@/componentes/comunes/DatosEstructurados'

const DESCRIPCION =
  'Tu tienda en línea, la página de tu negocio y tus enlaces para Instagram, en un solo lugar. Sin código, con pagos colombianos y tu propio dominio.'

export const metadata: Metadata = {
  // Las rutas relativas de Open Graph y canonical se resuelven contra aquí.
  metadataBase: new URL('https://misitio.llanostudio.co'),
  // `absolute` salta la plantilla del layout raíz: sin esto la pestaña diría
  // "Mi Sitio · Mi Sitio".
  title: { absolute: 'Mi Sitio — Tu tienda, tu página y tus enlaces' },
  description: DESCRIPCION,
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mi Sitio, de Llano Studio',
    description: DESCRIPCION,
    url: '/',
    siteName: 'Mi Sitio',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Mi Sitio, de Llano Studio', description: DESCRIPCION },
}

/** Quién está detrás de Mi Sitio y qué es, para los buscadores. */
const DATOS_SITIO = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Llano Studio',
    url: 'https://llanostudio.co',
    logo: 'https://misitio.llanostudio.co/llanostudio-logo.png',
    areaServed: 'CO',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Mi Sitio',
    url: 'https://misitio.llanostudio.co',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: DESCRIPCION,
    inLanguage: 'es-CO',
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'COP', description: 'Plan Gratis' },
    publisher: { '@type': 'Organization', name: 'Llano Studio' },
  },
]

/** Marco de la web comercial: se sirve en llanostudio.co y en www. */
export default function LayoutSitio({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-oscuro min-h-screen overflow-x-clip font-sans">
      <DatosEstructurados datos={DATOS_SITIO} />
      <CapturaOrigen />
      <Encabezado />
      <main>{children}</main>
      <PieSitio />
      <ChatSoporte modo="web" />
    </div>
  )
}
