'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CalendarDays, Check, Clock, Download, MessageCircle, MoreHorizontal, Phone, Plus, UserX, X } from 'lucide-react'
import { ErrorPanel, actualizarCita, crearCita, listarCitas } from '@/servicios/panel'
import type { AgendaPanel, Cita, EstadoCita } from '@/tipos/citas'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { cn } from '@/utilidades/clases'
import { descargarCsv } from '@/utilidades/csv'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, CURVA, Campo, CampoArea, Etiqueta, Interruptor, Segmentado } from './ui/basicos'
import { MenuAcciones, ModalPanel, Selector } from './ui/flotantes'
import { Aparecer } from './ui/movimiento'
import { confirmar } from './ui/confirmar'

const ESTADO: Record<EstadoCita, { etiqueta: string; tono: 'verde' | 'ambar' | 'azul' | 'neutro' }> = {
  PENDIENTE: { etiqueta: 'Por confirmar', tono: 'ambar' },
  CONFIRMADA: { etiqueta: 'Confirmada', tono: 'azul' },
  COMPLETADA: { etiqueta: 'Atendida', tono: 'verde' },
  CANCELADA: { etiqueta: 'Cancelada', tono: 'neutro' },
  NO_ASISTIO: { etiqueta: 'No vino', tono: 'neutro' },
}

const ZONA = { timeZone: 'America/Bogota' } as const
/** "2026-10-27" de un instante, en hora de Colombia. */
const diaDe = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3_600_000).toISOString().slice(0, 10)
const horaDe = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { ...ZONA, hour: 'numeric', minute: '2-digit' })
const hoyLocal = () => diaDe(new Date().toISOString())

function exportarCitas(citas: Cita[]) {
  descargarCsv('citas', [
    ['Fecha', 'Hora', 'Servicio', 'Minutos', 'Precio', 'Cliente', 'Teléfono', 'Correo', 'Estado', 'Notas del cliente', 'Código'],
    ...citas.map((cita) => {
      const inicio = new Date(cita.inicio)
      return [
        inicio.toLocaleDateString('es-CO'),
        inicio.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }),
        cita.servicio,
        cita.duracion,
        cita.precio ?? '',
        cita.clienteNombre,
        cita.clienteTelefono,
        cita.clienteEmail ?? '',
        ESTADO[cita.estado].etiqueta,
        cita.notas ?? '',
        cita.codigo,
      ]
    }),
  ])
}

function tituloDia(dia: string) {
  const hoy = hoyLocal()
  const manana = diaDe(new Date(Date.now() + 86_400_000).toISOString())
  const larga = new Date(`${dia}T12:00:00-05:00`).toLocaleDateString('es-CO', { ...ZONA, weekday: 'long', day: 'numeric', month: 'long' })
  if (dia === hoy) return `Hoy · ${larga}`
  if (dia === manana) return `Mañana · ${larga}`
  return larga
}

type Vista = 'proximas' | 'pasadas' | 'canceladas'

/**
 * Las citas que llegan desde la sección de reservas del sitio, por día. Desde
 * aquí se confirman, se marcan como atendidas y se le escribe al cliente.
 */
export function PantallaAgenda() {
  const { sesion } = useSesion()
  const [agenda, setAgenda] = useState<AgendaPanel | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<Vista>('proximas')
  const [nueva, setNueva] = useState(false)

  useEffect(() => {
    const atras = diaDe(new Date(Date.now() - 60 * 86_400_000).toISOString())
    const adelante = diaDe(new Date(Date.now() + 120 * 86_400_000).toISOString())
    listarCitas(atras, adelante)
      .then(setAgenda)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  const citas = agenda?.citas ?? []
  const ahora = Date.now()
  const visibles = useMemo(() => {
    const filtradas = citas.filter((cita) => {
      const cancelada = cita.estado === 'CANCELADA'
      if (vista === 'canceladas') return cancelada
      if (cancelada) return false
      const termino = new Date(cita.fin).getTime() < ahora
      return vista === 'pasadas' ? termino : !termino
    })
    return vista === 'proximas' ? filtradas : [...filtradas].reverse()
    // `ahora` cambia en cada render; basta con recalcular al cambiar citas o vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citas, vista])

  const porDia = useMemo(() => {
    const grupos = new Map<string, Cita[]>()
    for (const cita of visibles) {
      const dia = diaDe(cita.inicio)
      grupos.set(dia, [...(grupos.get(dia) ?? []), cita])
    }
    return [...grupos.entries()]
  }, [visibles])

  const deHoy = citas.filter((cita) => diaDe(cita.inicio) === hoyLocal() && (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA')).length
  const porConfirmar = citas.filter((cita) => cita.estado === 'PENDIENTE' && new Date(cita.inicio).getTime() > ahora).length

  function reemplazar(cita: Cita) {
    setAgenda((actual) =>
      actual && {
        ...actual,
        citas: actual.citas.some((otra) => otra.id === cita.id)
          ? actual.citas.map((otra) => (otra.id === cita.id ? cita : otra))
          : [...actual.citas, cita].sort((a, b) => a.inicio.localeCompare(b.inicio)),
      },
    )
  }

  async function cambiar(cita: Cita, estado: EstadoCita) {
    if (estado === 'CANCELADA' && !(await confirmar({ titulo: '¿Cancelar esta cita?', mensaje: 'El turno queda libre para otra persona.', confirmar: 'Cancelar cita', peligro: true }))) return
    setError('')
    try {
      reemplazar(await actualizarCita(cita.id, { estado }))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    }
  }

  const mes = agenda?.mes
  return (
    <>
      <CabeceraPanel
        titulo="Agenda"
        descripcion={
          !agenda
            ? 'Las citas que agendan tus clientes desde tu sitio.'
            : [
                deHoy === 1 ? '1 cita hoy' : `${deHoy} citas hoy`,
                porConfirmar ? `${porConfirmar} por confirmar` : null,
                mes && (mes.limite === null ? `${mes.usadas} este mes` : `${mes.usadas} de ${mes.limite} este mes en tu plan`),
              ]
                .filter(Boolean)
                .join(' · ')
        }
        accion={
          <div className="flex flex-wrap gap-2">
            {citas.length > 0 && (
              <BotonPanel onClick={() => exportarCitas(citas)} className="h-10 px-3.5" title="Exportar a Excel">
                <Download aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </BotonPanel>
            )}
            <BotonPanel variante="primario" disabled={!agenda?.activas} onClick={() => setNueva(true)} className="h-10 px-5">
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Nueva cita
            </BotonPanel>
          </div>
        }
      />

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      {!agenda ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="brillo h-20 rounded-[16px]" />
          ))}
        </div>
      ) : !agenda.activas && citas.length === 0 ? (
        <Aparecer>
          <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]" />
            <CalendarDays aria-hidden="true" className="h-9 w-9 text-sitio-tenue" strokeWidth={1.4} />
            <p className="mt-4 text-2xl tracking-[-0.03em]">Recibe citas desde tu sitio</p>
            <p className="mt-2 max-w-md text-sm text-sitio-tenue">
              Agrega la sección <strong className="font-medium text-sitio-suave">Reservas</strong> en el diseño: pones tus servicios, días y horas, y
              tus clientes eligen un turno libre. Cada cita llega aquí.
            </p>
            <Link
              href="/panel/plantillas"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-[12.5px] font-medium text-black transition hover:bg-sitio-hover-primario"
            >
              Ir al diseño <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Aparecer>
      ) : (
        <>
          <div className="mb-6">
            <Segmentado
              opciones={[
                { valor: 'proximas', etiqueta: 'Próximas' },
                { valor: 'pasadas', etiqueta: 'Pasadas' },
                { valor: 'canceladas', etiqueta: 'Canceladas' },
              ]}
              valor={vista}
              alCambiar={setVista}
            />
          </div>

          {porDia.length === 0 ? (
            <Aparecer>
              <p className="rounded-[16px] border border-sitio-borde px-6 py-14 text-center text-sm text-sitio-tenue">
                {vista === 'proximas' ? 'No hay citas por delante. Comparte tu sitio para que te agenden.' : 'Nada por aquí.'}
              </p>
            </Aparecer>
          ) : (
            <div className="flex flex-col gap-8">
              {porDia.map(([dia, delDia], indiceDia) => (
                <Aparecer key={dia} orden={Math.min(indiceDia, 6)}>
                  <h2 className="mb-3 text-[12px] tracking-[0.12em] text-sitio-tenue uppercase first-letter:uppercase">{tituloDia(dia)}</h2>
                  <ul className="overflow-hidden rounded-[16px] border border-sitio-borde bg-sitio-superficie">
                    <AnimatePresence initial={false}>
                      {delDia.map((cita) => (
                        <FilaCita key={cita.id} cita={cita} negocio={sesion.tienda?.nombre} alCambiar={(estado) => void cambiar(cita, estado)} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </Aparecer>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {nueva && agenda && (
          <FormularioCita
            servicios={agenda.servicios}
            alGuardar={(cita) => {
              reemplazar(cita)
              setNueva(false)
            }}
            alCerrar={() => setNueva(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function FilaCita({ cita, negocio, alCambiar }: { cita: Cita; negocio?: string; alCambiar: (estado: EstadoCita) => void }) {
  const estado = ESTADO[cita.estado]
  const vigente = cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA'
  const pasada = new Date(cita.inicio).getTime() < Date.now()
  const primerNombre = cita.clienteNombre.split(' ')[0]
  const mensaje =
    cita.estado === 'PENDIENTE'
      ? `Hola ${primerNombre}, te confirmamos tu cita de ${cita.servicio} el ${new Date(cita.inicio).toLocaleString('es-CO', { ...ZONA, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}${negocio ? ` en ${negocio}` : ''}. ¡Te esperamos!`
      : `Hola ${primerNombre}`

  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.45, ease: CURVA }}
      className="border-b border-sitio-borde last:border-b-0"
    >
      <div className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-4 py-4 sm:grid-cols-[84px_1fr_auto_auto] sm:px-5">
        <div className="flex flex-col">
          <span className="text-[15px] tabular-nums">{horaDe(cita.inicio)}</span>
          <span className="flex items-center gap-1 text-[11px] text-sitio-tenue">
            <Clock aria-hidden="true" className="h-3 w-3" />
            {cita.duracion} min
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px]">
            {cita.clienteNombre} <span className="text-sitio-tenue">· {cita.servicio}</span>
          </p>
          <p className="mt-0.5 truncate text-[12px] text-sitio-tenue">
            {[cita.clienteTelefono, cita.clienteEmail, cita.notas && `“${cita.notas}”`].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="hidden sm:block">
          <Etiqueta tono={estado.tono}>{estado.etiqueta}</Etiqueta>
        </span>
        <div className="flex items-center gap-1">
          <a
            href={enlaceWhatsapp(cita.clienteTelefono, mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            title="Escribirle por WhatsApp"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#4ee28a] transition-colors hover:bg-[#25d366]/[0.12]"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
          </a>
          <MenuAcciones
            disparador={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />}
            acciones={[
              ...(cita.estado === 'PENDIENTE' ? [{ etiqueta: 'Confirmar', icono: <Check aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => alCambiar('CONFIRMADA') }] : []),
              ...(vigente && pasada
                ? [
                    { etiqueta: 'Marcar como atendida', icono: <Check aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => alCambiar('COMPLETADA') },
                    { etiqueta: 'No vino', icono: <UserX aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => alCambiar('NO_ASISTIO') },
                  ]
                : []),
              { etiqueta: 'Llamar', icono: <Phone aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => window.open(`tel:${cita.clienteTelefono}`) },
              ...(vigente ? [{ etiqueta: 'Cancelar cita', icono: <X aria-hidden="true" className="h-3.5 w-3.5" />, peligro: true, alElegir: () => alCambiar('CANCELADA') }] : []),
              ...(!vigente && !pasada ? [{ etiqueta: 'Volver a agendar', icono: <Check aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => alCambiar('CONFIRMADA') }] : []),
            ]}
          />
        </div>
      </div>
    </motion.li>
  )
}

/** Cita tomada por teléfono o en persona: la dueña la agenda a mano. */
function FormularioCita({
  servicios,
  alGuardar,
  alCerrar,
}: {
  servicios: AgendaPanel['servicios']
  alGuardar: (cita: Cita) => void
  alCerrar: () => void
}) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? '')
  const [fecha, setFecha] = useState(hoyLocal())
  const [hora, setHora] = useState('09:00')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [forzar, setForzar] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setError('')
    setErrores({})
    try {
      alGuardar(await crearCita({ servicioId, fecha, hora, nombre, telefono, email: email || undefined, notas: notas || undefined, forzar }))
    } catch (problema) {
      if (problema instanceof ErrorPanel && Object.keys(problema.campos).length) setErrores(problema.campos)
      setError(problema instanceof Error ? problema.message : 'No se pudo agendar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalPanel titulo="Nueva cita" descripcion="Para las que te piden por teléfono o en persona." alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        <Selector
          etiqueta="Servicio"
          valor={servicioId}
          opciones={servicios.map((servicio) => ({ valor: servicio.id, etiqueta: servicio.nombre, detalle: `${servicio.duracion} min` }))}
          alCambiar={setServicioId}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cita-fecha" className="text-[11.5px] text-sitio-suave">
              Día
            </label>
            <input id="cita-fecha" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} className={cn(CLASE_FECHA)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cita-hora" className="text-[11.5px] text-sitio-suave">
              Hora
            </label>
            <input id="cita-hora" type="time" value={hora} onChange={(evento) => setHora(evento.target.value)} className={cn(CLASE_FECHA)} />
            {errores.hora && <span className="text-[11.5px] text-red-300">{errores.hora}</span>}
          </div>
        </div>
        <Campo etiqueta="Nombre del cliente" valor={nombre} alCambiar={setNombre} error={errores.nombre} maximo={80} autoFoco />
        <div className="grid grid-cols-2 gap-2.5">
          <Campo etiqueta="Celular" valor={telefono} alCambiar={setTelefono} error={errores.telefono} maximo={20} />
          <Campo etiqueta="Correo" valor={email} alCambiar={setEmail} error={errores.email} marcador="Opcional" tipo="email" />
        </div>
        <CampoArea etiqueta="Nota" valor={notas} alCambiar={setNotas} filas={2} maximo={500} marcador="Opcional" />
        <Interruptor activo={forzar} alCambiar={setForzar}>
          Agendar aunque el turno esté lleno
        </Interruptor>
        <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
        <div className="mt-1 flex justify-end gap-2">
          <BotonPanel variante="fantasma" onClick={alCerrar}>
            Cerrar
          </BotonPanel>
          <BotonPanel variante="primario" type="submit" disabled={enviando || !servicioId}>
            {enviando ? 'Agendando…' : 'Agendar'}
          </BotonPanel>
        </div>
      </form>
    </ModalPanel>
  )
}

const CLASE_FECHA =
  'w-full rounded-lg border border-sitio-borde bg-sitio-campo px-[11px] py-[9px] text-[13.5px] text-white outline-none [color-scheme:dark] focus:border-white/40'
