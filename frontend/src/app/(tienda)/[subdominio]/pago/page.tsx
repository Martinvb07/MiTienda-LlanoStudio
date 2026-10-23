import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { ResultadoPago } from '@/componentes/tienda/carrito/ResultadoPago'
import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'

export const metadata: Metadata = { title: 'Tu pago', robots: { index: false } }

interface Props {
  params: Promise<{ subdominio: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor)

/** A donde vuelve el comprador desde Wompi, ePayco o Bold. */
export default async function PaginaPago({ params, searchParams }: Props) {
  const [{ subdominio }, consulta] = await Promise.all([params, searchParams])
  const tienda = await obtenerTienda(hostDesdeIdentificador(subdominio))
  if (!tienda) notFound()
  const referencia = uno(consulta.ref)
  if (!referencia) notFound()

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <ResultadoPago
        referencia={referencia}
        idExterno={uno(consulta.id) ?? uno(consulta.ref_payco)}
        whatsapp={tienda.ajustes.whatsapp}
        moneda={tienda.moneda}
      />
    </>
  )
}
