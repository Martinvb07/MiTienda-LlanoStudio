import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { DetalleCita } from '@/componentes/tienda/DetalleCita'
import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { verCita } from '../../acciones-sitio'

export const metadata: Metadata = { title: 'Tu cita', robots: { index: false } }

/** A donde lleva el correo de confirmación: ver la cita y cancelarla si hace falta. */
export default async function PaginaCita({ params }: { params: Promise<{ subdominio: string; codigo: string }> }) {
  const { subdominio, codigo } = await params
  const [tienda, cita] = await Promise.all([obtenerTienda(hostDesdeIdentificador(subdominio)), verCita(codigo)])
  if (!tienda || !cita) notFound()
  const inicio = new Date(`${cita.fecha}T${cita.hora}:00-05:00`)
  const cuando = inicio.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <>
      <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />
      <DetalleCita
        cita={cita}
        cuando={cuando}
        porVenir={inicio.getTime() > Date.now()}
        negocio={tienda.nombre} whatsapp={tienda.ajustes.whatsapp} direccion={tienda.ajustes.direccion} />
    </>
  )
}
