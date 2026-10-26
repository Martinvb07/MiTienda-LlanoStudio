'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { CalendarCheck, CalendarX, MapPin, MessageCircle } from 'lucide-react'
import { cancelarCita, type CitaPublica } from '@/app/(tienda)/[subdominio]/acciones-sitio'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'

const SALIDA = [0.16, 1, 0.3, 1] as const


const ESTADOS: Record<CitaPublica['estado'], string> = {
  PENDIENTE: 'Agendada',
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Atendida',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asististe',
}

/** La cita del cliente, con la opción de cancelarla para liberar el turno. */
export function DetalleCita({
  cita: inicial,
  cuando,
  porVenir,
  negocio,
  whatsapp,
  direccion,
}: {
  cita: CitaPublica
  /** La fecha ya escrita en el servidor: así no cambia al hidratar. */
  cuando: string
  /** Si la cita todavía no pasó, visto desde el servidor. */
  porVenir: boolean
  negocio: string
  whatsapp?: string
  direccion?: string
}) {
  const [cita, setCita] = useState(inicial)
  const [seguro, setSeguro] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')
  const vigente = (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && porVenir
  const cancelada = cita.estado === 'CANCELADA'

  async function cancelar() {
    setCancelando(true)
    setError('')
    const resultado = await cancelarCita(cita.codigo)
    setCancelando(false)
    if (resultado.ok) setCita(resultado.datos.cita)
    else setError(resultado.mensaje)
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: SALIDA }}
      className="mx-auto max-w-xl px-6 py-20 text-center"
    >
      {cancelada ? (
        <CalendarX aria-hidden="true" className="mx-auto h-14 w-14 text-tinta/40" strokeWidth={1.4} />
      ) : (
        <CalendarCheck aria-hidden="true" className="mx-auto h-14 w-14 text-emerald-500" strokeWidth={1.4} />
      )}
      <p className="mt-6 text-xs tracking-[0.14em] text-tinta/50 uppercase">{ESTADOS[cita.estado]}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{cita.servicio}</h1>
      <p className="mt-3 text-lg text-tinta/75 first-letter:uppercase">{cuando}</p>
      <p className="mt-1 text-sm text-tinta/55">
        {negocio} · {cita.duracion} min{cita.precio ? ` · ${cita.precio}` : ''}
      </p>
      {direccion && !cancelada && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-tinta/65">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          {direccion}
        </p>
      )}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        {whatsapp && (
          <a
            href={enlaceWhatsapp(whatsapp, `Hola ${negocio}, te escribo por mi cita de ${cita.servicio} (${cuando}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-[#25d366] px-5 py-3 font-medium text-white"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Escribir por WhatsApp
          </a>
        )}
        {vigente &&
          (seguro ? (
            <button
              type="button"
              onClick={() => void cancelar()}
              disabled={cancelando}
              className="boton-tienda inline-flex items-center justify-center rounded-(--radius-marca) bg-red-600 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {cancelando ? 'Cancelando…' : 'Sí, cancelar mi cita'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSeguro(true)}
              className="boton-tienda inline-flex items-center justify-center rounded-(--radius-marca) border border-tinta/20 px-5 py-3 font-medium"
            >
              Cancelar la cita
            </button>
          ))}
        {cancelada && (
          <Link href="/#reservas" className="boton-tienda inline-flex items-center justify-center rounded-(--radius-marca) bg-marca px-5 py-3 font-medium text-marca-contraste">
            Agendar otra
          </Link>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </motion.main>
  )
}
