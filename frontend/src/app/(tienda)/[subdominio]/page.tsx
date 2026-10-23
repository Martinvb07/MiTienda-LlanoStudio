import { notFound } from 'next/navigation'
import { RenderizadorBloques } from '@/componentes/tienda/RenderizadorBloques'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { limitesDe } from '@/utilidades/planes'
import { listarProductos, obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { vendeEnLinea } from '@/utilidades/sitio'

export const revalidate = 60

interface Props {
  params: Promise<{ subdominio: string }>
}

/**
 * Portada de la tienda: lee el JSON de bloques guardado por el editor y lo
 * renderiza. Es la misma configuración que edita el panel, sin HTML intermedio.
 */
export default async function PaginaTienda({ params }: Props) {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)

  const [tienda, catalogo] = await Promise.all([obtenerTienda(host), listarProductos(host)])

  if (!tienda) notFound()
  // Una página informativa no muestra catálogo, aunque la cuenta tenga productos guardados.
  const productos = vendeEnLinea(tienda.tipo) ? catalogo : []

  return (
    <main>
      <RenderizadorBloques
        bloques={tienda.configuracionBloques}
        productos={productos}
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
