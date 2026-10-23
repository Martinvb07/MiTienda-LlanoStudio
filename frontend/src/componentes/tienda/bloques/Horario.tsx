import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { PropsHorario } from '@/tipos/bloques'
import { enlaceWhatsapp, numeroWhatsapp, telefonoLegible } from '@/utilidades/whatsapp'
import { TituloSeccion } from './TituloSeccion'

interface Props extends PropsHorario {
  whatsapp?: string
  correo?: string
  negocio?: string
}

/**
 * Horario de atención y cómo llegar o contactar: escribir por WhatsApp, llamar
 * y abrir la dirección en Google Maps. Lo que no esté configurado no se pinta.
 */
export function Horario({ titulo, dias, nota, direccion, telefono, whatsapp, correo, negocio }: Props) {
  const llamar = telefono || whatsapp
  const filas = dias.filter((fila) => fila.dia.trim() || fila.horas.trim())
  const contacto = Boolean(direccion || llamar || whatsapp || correo)

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} />
      <div className={`grid gap-4 ${contacto && filas.length > 0 ? 'md:grid-cols-2' : 'mx-auto max-w-xl'}`}>
        {filas.length > 0 && (
          <div className="rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-6 sm:p-8">
            <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
              <Clock aria-hidden="true" className="h-5 w-5 text-marca" />
              Horario de atención
            </h3>
            <dl className="mt-5 divide-y divide-tinta/10">
              {filas.map((fila) => (
                <div key={fila.id} className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="text-tinta/70">{fila.dia}</dt>
                  <dd className="text-right font-medium tabular-nums">{fila.horas}</dd>
                </div>
              ))}
            </dl>
            {nota && <p className="mt-4 text-sm text-tinta/55">{nota}</p>}
          </div>
        )}

        {contacto && (
          <div className="flex flex-col rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-6 sm:p-8">
            <h3 className="font-display text-lg font-semibold tracking-tight">Contacto</h3>
            <ul className="mt-5 space-y-4 text-tinta/80">
              {direccion && (
                <li className="flex gap-3">
                  <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-marca" />
                  <span>
                    {direccion}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm font-medium text-tinta underline underline-offset-4"
                    >
                      Cómo llegar
                    </a>
                  </span>
                </li>
              )}
              {llamar && (
                <li className="flex items-center gap-3">
                  <Phone aria-hidden="true" className="h-5 w-5 shrink-0 text-marca" />
                  <a href={`tel:+${numeroWhatsapp(llamar)}`} className="tabular-nums hover:underline">
                    {telefonoLegible(llamar)}
                  </a>
                </li>
              )}
              {correo && (
                <li className="flex items-center gap-3">
                  <Mail aria-hidden="true" className="h-5 w-5 shrink-0 text-marca" />
                  <a href={`mailto:${correo}`} className="break-all hover:underline">
                    {correo}
                  </a>
                </li>
              )}
            </ul>
            {(whatsapp || llamar) && (
              <div className="mt-auto flex flex-wrap gap-3 pt-7">
                {whatsapp && (
                  <a
                    href={enlaceWhatsapp(whatsapp, `Hola${negocio ? ` ${negocio}` : ''}, quiero más información`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="boton-tienda inline-flex items-center gap-2 rounded-(--radius-marca) bg-marca px-5 py-3 font-medium text-marca-contraste transition hover:opacity-90"
                  >
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    Escribir por WhatsApp
                  </a>
                )}
                {llamar && (
                  <a
                    href={`tel:+${numeroWhatsapp(llamar)}`}
                    className="boton-tienda inline-flex items-center gap-2 rounded-(--radius-marca) border border-tinta/20 px-5 py-3 font-medium transition hover:border-tinta/50"
                  >
                    <Phone aria-hidden="true" className="h-4 w-4" />
                    Llamar
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
