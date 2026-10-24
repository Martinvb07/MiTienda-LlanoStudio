import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RenderizadorBloques } from '@/componentes/tienda/RenderizadorBloques'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { limitesDe } from '@/utilidades/planes'
import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { paginasDe } from '@/utilidades/paginas'

export const revalidate = 60

interface Props {
  params: Promise<{ subdominio: string; pagina: string }>
}

async function cargar({ params }: Props) {
  const { subdominio, pagina } = await params
  const host = hostDesdeIdentificador(subdominio)
  const tienda = await obtenerTienda(host)
  const extra = tienda ? paginasDe(tienda).find((otra) => otra.ruta === decodeURIComponent(pagina)) : undefined
  return { host, tienda, extra }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { host, extra } = await cargar(props)
  if (!extra) return { robots: { index: false } }
  return { title: extra.titulo, alternates: { canonical: `https://${host}/${extra.ruta}` } }
}

/**
 * Una página extra de la página para tu negocio (/servicios, /nosotros…): la
 * misma cabecera y el mismo tema, con sus propias secciones.
 */
export default async function PaginaExtra(props: Props) {
  const { tienda, extra } = await cargar(props)
  if (!tienda || !extra) notFound()

  return (
    <main>
      <RenderizadorBloques
        bloques={extra.bloques}
        productos={[]}
        moneda={tienda.moneda}
        cabecera={<CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} tipo={tienda.tipo} />}
        quitarMarca={limitesDe(tienda.plan).quitarMarca}
        ajustes={tienda.ajustes}
        nombreTienda={tienda.nombre}
        tema={tienda.tema}
        tipo={tienda.tipo}
        logoUrl={tienda.logoUrl}
      />
    </main>
  )
}
