'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarCheck, CheckCircle2, Clock, MessageCircle } from 'lucide-react'
import type { PropsReservas, ServicioReserva } from '@/tipos/bloques'
import { diasConCupo, horasConCupo, reservar, type CitaPublica } from '@/app/(tienda)/[subdominio]/acciones-sitio'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { TituloSeccion } from './TituloSeccion'

const SALIDA = [0.16, 1, 0.3, 1] as const
const APARECER = {
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
  transition: { duration: 0.5, ease: SALIDA },
} as const

interface Props extends PropsReservas {
  whatsapp?: string
  negocio?: string
  /** En el editor: sin consultar cupos, con días de muestra. */
  editando?: boolean
}

/** "2026-10-27" → partes para la tira de días, en español. */
function partesFecha(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00-05:00`)
  const opciones = { timeZone: 'America/Bogota' } as const
  return {
    semana: dia.toLocaleDateString('es-CO', { ...opciones, weekday: 'short' }).replace('.', ''),
    numero: dia.toLocaleDateString('es-CO', { ...opciones, day: 'numeric' }),
    mes: dia.toLocaleDateString('es-CO', { ...opciones, month: 'short' }).replace('.', ''),
    larga: dia.toLocaleDateString('es-CO', { ...opciones, weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

/** "14:30" → "2:30 p. m." */
function horaBonita(hora: string) {
  const [h, m] = hora.split(':').map(Number)
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' })
}

function muestraDias() {
  const hoy = Date.now()
  return [1, 2, 3, 5, 6, 7, 8].map((dias) => new Date(hoy + dias * 86_400_000 - 5 * 3_600_000).toISOString().slice(0, 10))
}

const MUESTRA_HORAS = ['08:00', '08:30', '09:00', '10:00', '10:30', '11:30', '14:00', '15:30']

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <motion.div {...APARECER} className="flex flex-col gap-4">
      <h3 className="flex items-center gap-3 font-medium">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-marca text-sm text-marca-contraste">{numero}</span>
        {titulo}
      </h3>
      {children}
    </motion.div>
  )
}

const opcion = (elegida: boolean) =>
  `boton-tienda rounded-(--radius-marca) border transition ${
    elegida ? 'border-tinta bg-tinta/[0.04] ring-1 ring-tinta' : 'border-tinta/15 hover:border-tinta/40'
  }`

/**
 * Reservas en línea: servicio → día → hora → datos. Los días y las horas los
 * calcula la API con la misma configuración, así que lo que se ofrece está
 * libre de verdad; si dos personas eligen el mismo turno, la segunda recibe
 * aviso y elige otro.
 */
export function Reservas({ titulo, subtitulo, servicios, pedirCorreo, mensajeFinal, whatsapp, negocio, editando }: Props) {
  const [servicio, setServicio] = useState<ServicioReserva | null>(servicios.length === 1 ? servicios[0]! : null)
  const [dias, setDias] = useState<string[] | null>(null)
  const [fecha, setFecha] = useState<string | null>(null)
  const [horas, setHoras] = useState<string[] | null>(null)
  const [hora, setHora] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [cita, setCita] = useState<CitaPublica | null>(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    setFecha(null)
    setDias(null)
    if (!servicio) return
    if (editando) {
      setDias(muestraDias())
      return
    }
    let vigente = true
    void diasConCupo(servicio.id).then((lista) => vigente && setDias(lista ?? []))
    return () => {
      vigente = false
    }
  }, [servicio, editando])

  useEffect(() => {
    setHora(null)
    setHoras(null)
    if (!servicio || !fecha) return
    if (editando) {
      setHoras(MUESTRA_HORAS)
      return
    }
    let vigente = true
    void horasConCupo(servicio.id, fecha).then((lista) => vigente && setHoras(lista ?? []))
    return () => {
      vigente = false
    }
  }, [servicio, fecha, editando, recarga])

  if (servicios.length === 0) return null

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!servicio || !fecha || !hora || enviando || editando) return
    const datos = new FormData(evento.currentTarget)
    const texto = (clave: string) => String(datos.get(clave) ?? '').trim()
    setEnviando(true)
    setError('')
    setErrores({})
    const resultado = await reservar({
      servicioId: servicio.id,
      fecha,
      hora,
      nombre: texto('nombre'),
      telefono: texto('telefono'),
      email: texto('email') || undefined,
      notas: texto('notas') || undefined,
    })
    setEnviando(false)
    if (resultado.ok) {
      setCita(resultado.datos.cita)
      return
    }
    setErrores(resultado.campos)
    setError(resultado.mensaje)
    // Alguien tomó el turno: se vuelven a pedir las horas libres.
    if (resultado.campos.hora) setRecarga((valor) => valor + 1)
  }

  const campo =
    'w-full rounded-(--radius-marca) border border-tinta/15 bg-transparent px-3.5 py-3 outline-none transition focus:border-tinta/60'

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={subtitulo} />

      <AnimatePresence mode="wait" initial={false}>
        {cita ? (
          <motion.div key="lista" {...APARECER} className="mx-auto max-w-xl rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-8 text-center">
            <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-emerald-500" strokeWidth={1.5} />
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">¡Listo, {cita.clienteNombre.split(' ')[0]}!</h3>
            <p className="mt-3 text-tinta/75">
              Agendaste <strong className="text-tinta">{cita.servicio}</strong> para el{' '}
              <strong className="text-tinta">
                {partesFecha(cita.fecha).larga}, {horaBonita(cita.hora)}
              </strong>
            </p>
            {mensajeFinal && <p className="mt-3 text-sm text-tinta/65">{mensajeFinal}</p>}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {whatsapp && (
                <a
                  href={enlaceWhatsapp(
                    whatsapp,
                    `Hola${negocio ? ` ${negocio}` : ''}, agendé ${cita.servicio} para el ${partesFecha(cita.fecha).larga} a las ${horaBonita(cita.hora)}. Soy ${cita.clienteNombre}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-[#25d366] px-5 py-3 font-medium text-white"
                >
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                  Avisar por WhatsApp
                </a>
              )}
              <a
                href={`/cita/${cita.codigo}`}
                className="boton-tienda inline-flex items-center justify-center rounded-(--radius-marca) border border-tinta/20 px-5 py-3 font-medium"
              >
                Ver mi cita
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.form key="pasos" {...APARECER} onSubmit={confirmar} noValidate className="flex flex-col gap-10">
            <Paso numero={1} titulo="Elige el servicio">
              <div className="grid gap-3 sm:grid-cols-2">
                {servicios.map((otro) => (
                  <button key={otro.id} type="button" onClick={() => setServicio(otro)} aria-pressed={servicio?.id === otro.id} className={`${opcion(servicio?.id === otro.id)} flex items-center justify-between gap-4 px-5 py-4 text-left`}>
                    <span className="flex flex-col">
                      <span className="font-medium">{otro.nombre}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-tinta/60">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                        {otro.duracion} min
                      </span>
                    </span>
                    {otro.precio && <span className="shrink-0 font-semibold tabular-nums">{otro.precio}</span>}
                  </button>
                ))}
              </div>
            </Paso>

            <AnimatePresence>
              {servicio && (
                <Paso key={`dias-${servicio.id}`} numero={2} titulo="Elige el día">
                  {dias === null ? (
                    <div className="flex gap-2.5 overflow-hidden">
                      {[0, 1, 2, 3, 4, 5].map((indice) => (
                        <span key={indice} className="h-[86px] w-[72px] shrink-0 animate-pulse rounded-(--radius-marca) bg-tinta/[0.06]" />
                      ))}
                    </div>
                  ) : dias.length === 0 ? (
                    <p className="text-tinta/65">No quedan turnos libres para este servicio en los próximos días.</p>
                  ) : (
                    <div className="-mx-6 flex snap-x gap-2.5 overflow-x-auto px-6 pb-2">
                      {dias.map((dia) => {
                        const partes = partesFecha(dia)
                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => setFecha(dia)}
                            aria-pressed={fecha === dia}
                            aria-label={partes.larga}
                            className={`${opcion(fecha === dia)} flex w-[72px] shrink-0 snap-start flex-col items-center gap-0.5 py-3 text-center`}
                          >
                            <span className="text-xs text-tinta/55 capitalize">{partes.semana}</span>
                            <span className="font-display text-2xl font-semibold tabular-nums">{partes.numero}</span>
                            <span className="text-xs text-tinta/55 capitalize">{partes.mes}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Paso>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {servicio && fecha && (
                <Paso key={`horas-${fecha}`} numero={3} titulo={`Elige la hora · ${partesFecha(fecha).larga}`}>
                  {horas === null ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                      {[0, 1, 2, 3, 4].map((indice) => (
                        <span key={indice} className="h-11 animate-pulse rounded-(--radius-marca) bg-tinta/[0.06]" />
                      ))}
                    </div>
                  ) : horas.length === 0 ? (
                    <p className="text-tinta/65">Ese día ya se llenó. Prueba con otro.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                      {horas.map((otra) => (
                        <button key={otra} type="button" onClick={() => setHora(otra)} aria-pressed={hora === otra} className={`${opcion(hora === otra)} py-2.5 text-center text-sm tabular-nums`}>
                          {horaBonita(otra)}
                        </button>
                      ))}
                    </div>
                  )}
                </Paso>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {servicio && fecha && hora && (
                <Paso key="datos" numero={4} titulo="Tus datos">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                      <span className="text-tinta/70">Nombre completo</span>
                      <input name="nombre" autoComplete="name" required className={campo} aria-invalid={Boolean(errores.nombre)} />
                      {errores.nombre && <span className="text-xs text-red-600">{errores.nombre}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-tinta/70">Celular</span>
                      <input name="telefono" type="tel" autoComplete="tel" required className={campo} aria-invalid={Boolean(errores.telefono)} />
                      {errores.telefono && <span className="text-xs text-red-600">{errores.telefono}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-tinta/70">Correo{pedirCorreo ? '' : ' (opcional)'}</span>
                      <input name="email" type="email" autoComplete="email" required={pedirCorreo} className={campo} aria-invalid={Boolean(errores.email)} />
                      {errores.email && <span className="text-xs text-red-600">{errores.email}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                      <span className="text-tinta/70">¿Algo que debamos saber? (opcional)</span>
                      <textarea name="notas" rows={2} maxLength={500} className={campo} />
                    </label>
                  </div>
                  {error && <p className="rounded-(--radius-marca) bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>}
                  <button
                    type="submit"
                    disabled={enviando || editando}
                    className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-marca px-6 py-4 text-lg font-medium text-marca-contraste transition hover:opacity-90 disabled:opacity-50"
                  >
                    <CalendarCheck aria-hidden="true" className="h-5 w-5" />
                    {enviando ? 'Agendando…' : `Confirmar cita · ${horaBonita(hora)}`}
                  </button>
                </Paso>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  )
}
