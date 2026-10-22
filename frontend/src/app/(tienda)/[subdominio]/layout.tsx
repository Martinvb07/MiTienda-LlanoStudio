import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { variablesTema } from '@/utilidades/tema'
import { BotonWhatsapp } from '@/componentes/tienda/BotonWhatsapp'

/** Revalidación ISR: las tiendas se sirven de caché y se refrescan solas. */
export const revalidate = 60

interface Props {
  children: React.ReactNode
  params: Promise<{ subdominio: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdominio: string }>
}): Promise<Metadata> {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)
  const tienda = await obtenerTienda(host)

  if (!tienda) return { title: 'Tienda no encontrada', robots: { index: false } }

  return {
    title: { default: tienda.nombre, template: `%s · ${tienda.nombre}` },
    description: tienda.descripcion ?? `Compra en línea en ${tienda.nombre}`,
    // Canónica al dominio real de la tienda: evita que la misma tienda indexe
    // por varias rutas internas.
    alternates: { canonical: `https://${host}` },
    openGraph: {
      title: tienda.nombre,
      description: tienda.descripcion ?? undefined,
      url: `https://${host}`,
      siteName: tienda.nombre,
      locale: 'es_CO',
      type: 'website',
      images: tienda.logoUrl ? [{ url: tienda.logoUrl }] : undefined,
    },
    icons: tienda.faviconUrl ? { icon: tienda.faviconUrl } : undefined,
  }
}

/**
 * Marco de la tienda pública. Traduce Tienda.tema a variables CSS en línea, que
 * es lo que permite tematizar por tenant con un único build y un único CSS.
 */
export default async function LayoutTienda({ children, params }: Props) {
  const { subdominio } = await params
  const tienda = await obtenerTienda(hostDesdeIdentificador(subdominio))

  if (!tienda) notFound()

  return (
    <div style={variablesTema(tienda.tema)} className="min-h-screen bg-superficie font-sans text-tinta">
      {children}
      {tienda.ajustes.whatsappFlotante && tienda.ajustes.whatsapp && (
        <BotonWhatsapp numero={tienda.ajustes.whatsapp} tienda={tienda.nombre} />
      )}
    </div>
  )
}
