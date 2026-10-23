import Image from 'next/image'
import { Clock } from 'lucide-react'
import type { PropsServicios, ServicioNegocio } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { TituloSeccion } from './TituloSeccion'

interface Props extends PropsServicios {
  /** WhatsApp del negocio: sin él, los servicios no llevan botón. */
  whatsapp?: string
  negocio?: string
}

function BotonAgendar({ servicio, texto, whatsapp, negocio, chico }: { servicio: ServicioNegocio; texto: string; whatsapp: string; negocio?: string; chico?: boolean }) {
  const mensaje = `Hola${negocio ? ` ${negocio}` : ''}, me interesa: ${servicio.nombre}`
  return (
    <a
      href={enlaceWhatsapp(whatsapp, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className={`boton-tienda inline-flex shrink-0 items-center justify-center rounded-(--radius-marca) bg-marca font-medium text-marca-contraste transition hover:opacity-90 ${
        chico ? 'px-4 py-2 text-sm' : 'px-5 py-2.5 text-sm'
      }`}
    >
      {texto}
    </a>
  )
}

function Detalle({ servicio }: { servicio: ServicioNegocio }) {
  if (!servicio.precio && !servicio.duracion) return null
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {servicio.precio && <span className="font-semibold text-tinta">{servicio.precio}</span>}
      {servicio.duracion && (
        <span className="inline-flex items-center gap-1.5 text-tinta/60">
          <Clock aria-hidden="true" className="h-3.5 w-3.5" />
          {servicio.duracion}
        </span>
      )}
    </p>
  )
}

/**
 * Lo que ofrece el negocio, con precio y duración. Cada servicio puede llevar
 * un botón que abre WhatsApp con su nombre ya escrito, para agendar.
 * En lista se lee como una carta: nombre a la izquierda, precio a la derecha.
 */
export function Servicios({ titulo, subtitulo, disposicion = 'tarjetas', textoBoton, items, whatsapp, negocio }: Props) {
  if (items.length === 0) return null
  const boton = Boolean(textoBoton && whatsapp)

  if (disposicion === 'lista') {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <TituloSeccion titulo={titulo} subtitulo={subtitulo} />
        <ul className="border-t border-tinta/10">
          {items.map((servicio) => (
            <li key={servicio.id} className="flex flex-col gap-3 border-b border-tinta/10 py-5 sm:flex-row sm:items-center sm:gap-6">
              {servicio.imagenUrl && (
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-(--radius-marca) bg-tinta/5">
                  <Image src={servicio.imagenUrl} alt="" fill sizes="64px" unoptimized={esMedioLocal(servicio.imagenUrl)} className="object-cover" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-lg font-semibold tracking-tight">{servicio.nombre}</h3>
                  {servicio.precio && <span className="shrink-0 font-semibold tabular-nums">{servicio.precio}</span>}
                </div>
                {servicio.descripcion && <p className="mt-1 leading-relaxed text-tinta/70">{servicio.descripcion}</p>}
                {servicio.duracion && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-tinta/55">
                    <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                    {servicio.duracion}
                  </p>
                )}
              </div>
              {boton && <BotonAgendar servicio={servicio} texto={textoBoton!} whatsapp={whatsapp!} negocio={negocio} chico />}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={subtitulo} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((servicio) => (
          <article key={servicio.id} className="flex flex-col overflow-hidden rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02]">
            {servicio.imagenUrl && (
              <div className="relative aspect-[4/3] bg-tinta/5">
                <Image
                  src={servicio.imagenUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  unoptimized={esMedioLocal(servicio.imagenUrl)}
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-xl font-semibold tracking-tight">{servicio.nombre}</h3>
              {servicio.descripcion && <p className="mt-2 flex-1 leading-relaxed text-tinta/70">{servicio.descripcion}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Detalle servicio={servicio} />
                {boton && <BotonAgendar servicio={servicio} texto={textoBoton!} whatsapp={whatsapp!} negocio={negocio} />}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
