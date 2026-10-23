'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, CheckCheck, Globe, Inbox, LayoutDashboard, RotateCcw, Search, Send, Star } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import {
  cambiarTicket,
  leerTokenAdmin,
  listarTickets,
  verTicket,
  type EstadoTicket,
  type MensajeSoporte,
  type SesionAdmin,
  type TicketBandeja,
} from '@/servicios/admin'
import { conectar } from '@/servicios/tiempoReal'
import { PLANES, type Plan } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, CLASES_ENTRADA, Etiqueta, Segmentado } from '../panel/ui/basicos'
import { SALIDA, TituloSeccion, Vacio, haceCuanto } from './ui'

type Filtro = 'pendientes' | 'RESUELTO' | 'todos'
const ESTADO: Record<EstadoTicket, { texto: string; tono: 'ambar' | 'azul' | 'neutro' }> = {
  ABIERTO: { texto: 'Esperando', tono: 'ambar' },
  EN_CURSO: { texto: 'En curso', tono: 'azul' },
  RESUELTO: { texto: 'Resuelto', tono: 'neutro' },
}

/**
 * Bandeja de soporte en vivo: a la izquierda las conversaciones (las que
 * esperan respuesta primero), a la derecha el chat. Todo llega por socket.io.
 */
export function SeccionSoporte({ admin, alAbrirTienda, alPendientes }: { admin: SesionAdmin; alAbrirTienda: (id: string) => void; alPendientes?: (n: number) => void }) {
  const [tickets, setTickets] = useState<TicketBandeja[] | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [buscar, setBuscar] = useState('')
  const [abierto, setAbierto] = useState<(TicketBandeja & { mensajes: MensajeSoporte[] }) | null>(null)
  const [texto, setTexto] = useState('')
  const [escribiendo, setEscribiendo] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)
  const [error, setError] = useState('')
  const socket = useRef<Socket | null>(null)
  const abiertoId = useRef<string | null>(null)
  const final = useRef<HTMLDivElement>(null)
  const escribe = admin.rol !== 'LECTURA'

  useEffect(() => {
    abiertoId.current = abierto?.id ?? null
  }, [abierto?.id])

  // Carga inicial y conexión en vivo.
  useEffect(() => {
    listarTickets()
      .then((respuesta) => setTickets(respuesta.tickets))
      .catch((e: Error) => setError(e.message))

    const conexion = conectar({ tipo: 'asesor', token: leerTokenAdmin() ?? '' })
    socket.current = conexion
    conexion.on('connect', () => setConectado(true))
    conexion.on('disconnect', () => setConectado(false))
    conexion.on('ticket', (ticket: TicketBandeja | null) => {
      if (!ticket) return
      setTickets((lista) => [ticket, ...(lista ?? []).filter((otro) => otro.id !== ticket.id)])
      setAbierto((actual) => (actual && actual.id === ticket.id ? { ...actual, ...ticket, noLeidosAsesor: 0 } : actual))
    })
    conexion.on('mensaje', (mensaje: MensajeSoporte & { ticketId: string }) => {
      setAbierto((actual) =>
        actual && mensaje.ticketId === actual.id && !actual.mensajes.some((otro) => otro.id === mensaje.id)
          ? { ...actual, mensajes: [...actual.mensajes, mensaje] }
          : actual,
      )
      if (mensaje.ticketId === abiertoId.current && mensaje.autor === 'CLIENTE') setEscribiendo(null)
    })
    let pausa: ReturnType<typeof setTimeout>
    conexion.on('escribiendo', ({ ticketId }: { ticketId: string }) => {
      if (ticketId !== abiertoId.current) return
      setEscribiendo('El cliente está escribiendo…')
      clearTimeout(pausa)
      pausa = setTimeout(() => setEscribiendo(null), 3000)
    })
    return () => {
      conexion.disconnect()
    }
  }, [])

  useEffect(() => {
    final.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [abierto?.mensajes.length])

  const pendientes = (tickets ?? []).filter((ticket) => ticket.estado !== 'RESUELTO')
  const sinLeer = (tickets ?? []).reduce((suma, ticket) => suma + ticket.noLeidosAsesor, 0)
  useEffect(() => {
    alPendientes?.(sinLeer)
  }, [sinLeer, alPendientes])

  const visibles = (tickets ?? [])
    .filter((ticket) => (filtro === 'pendientes' ? ticket.estado !== 'RESUELTO' : filtro === 'RESUELTO' ? ticket.estado === 'RESUELTO' : true))
    .filter((ticket) => {
      if (!buscar.trim()) return true
      const aguja = buscar.toLowerCase()
      return [ticket.nombre, ticket.email, ticket.asunto, ticket.tenant?.nombre].some((campo) => campo?.toLowerCase().includes(aguja))
    })
    .sort((a, b) => {
      // Las que esperan respuesta primero, luego por el último mensaje.
      const prioridad = (t: TicketBandeja) => (t.estado === 'ABIERTO' ? 0 : t.estado === 'EN_CURSO' ? 1 : 2)
      return prioridad(a) - prioridad(b) || new Date(b.ultimoMensajeEn).getTime() - new Date(a.ultimoMensajeEn).getTime()
    })

  async function abrir(id: string) {
    try {
      const ticket = await verTicket(id)
      setAbierto(ticket)
      setEscribiendo(null)
      socket.current?.emit('unirse', id)
      setTickets((lista) => lista?.map((otro) => (otro.id === id ? { ...otro, noLeidosAsesor: 0 } : otro)) ?? null)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo abrir')
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!abierto || !texto.trim()) return
    socket.current?.emit('mensaje', { ticketId: abierto.id, texto })
    setTexto('')
  }

  async function cambiarEstado(estado: EstadoTicket) {
    if (!abierto) return
    const ticket = await cambiarTicket(abierto.id, { estado })
    setAbierto({ ...abierto, ...ticket })
  }

  return (
    <>
      <TituloSeccion
        titulo="Soporte"
        descripcion="Conversaciones de la web y del panel de las tiendas, en vivo."
        accion={
          <span className="flex items-center gap-2 text-[12px] text-sitio-suave">
            <span aria-hidden="true" className="estado-punto" data-tono={conectado ? 'verde' : 'ambar'} data-vivo={conectado || undefined} />
            {conectado ? 'En línea: los clientes ven que hay asesores' : 'Conectando…'}
          </span>
        }
      />
      <AnimatePresence>{error && <div className="mb-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>

      <div className="grid min-h-[620px] overflow-hidden rounded-[14px] border border-sitio-borde bg-sitio-superficie lg:grid-cols-[340px_1fr]">
        {/* Bandeja */}
        <div className={cn('flex min-h-0 flex-col border-sitio-borde lg:border-r', abierto && 'hidden lg:flex')}>
          <div className="flex flex-col gap-2.5 border-b border-sitio-borde p-3">
            <Segmentado
              chico
              opciones={[
                { valor: 'pendientes', etiqueta: `Pendientes${pendientes.length ? ` · ${pendientes.length}` : ''}` },
                { valor: 'RESUELTO', etiqueta: 'Resueltos' },
                { valor: 'todos', etiqueta: 'Todos' },
              ]}
              valor={filtro}
              alCambiar={setFiltro}
            />
            <label className="relative">
              <Search aria-hidden="true" className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-sitio-tenue" />
              <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar" aria-label="Buscar conversaciones" className={`${CLASES_ENTRADA} !py-[7px] pl-8 text-[13px]`} />
            </label>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {!tickets ? (
              <li className="brillo m-3 h-20 rounded-lg" />
            ) : visibles.length === 0 ? (
              <li className="flex flex-col items-center gap-2 p-6 text-center text-[13px] text-sitio-tenue">
                {filtro === 'pendientes' ? <CheckCheck aria-hidden="true" className="h-5 w-5" /> : <Inbox aria-hidden="true" className="h-5 w-5" />}
                {filtro === 'pendientes' ? 'Nadie esperando.' : 'Nada por aquí.'}
              </li>
            ) : (
              visibles.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => void abrir(ticket.id)}
                    className={cn(
                      'flex w-full gap-3 border-b border-sitio-borde px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]',
                      abierto?.id === ticket.id && 'bg-white/[0.05]',
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11px] font-semibold">
                      {ticket.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-[13.5px]', ticket.noLeidosAsesor > 0 && 'font-semibold')}>{ticket.nombre}</span>
                        <span className="shrink-0 text-[10.5px] text-sitio-tenue">{haceCuanto(ticket.ultimoMensajeEn)}</span>
                      </span>
                      <span className="block truncate text-[12px] text-sitio-tenue">
                        {ticket.ultimoMensaje?.autor === 'ASESOR' && 'Tú: '}
                        {ticket.ultimoMensaje?.texto ?? ticket.asunto}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <Etiqueta tono={ESTADO[ticket.estado].tono}>{ESTADO[ticket.estado].texto}</Etiqueta>
                        <span className="text-[10.5px] text-sitio-tenue">{ticket.origen === 'PANEL' ? (ticket.tenant?.nombre ?? 'Panel') : 'Web'}</span>
                        {ticket.noLeidosAsesor > 0 && (
                          <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-sitio-azul px-1.5 text-[10.5px] font-semibold text-[#fff]">
                            {ticket.noLeidosAsesor}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Conversación */}
        <div className={cn('flex min-h-0 flex-col', !abierto && 'hidden lg:flex')}>
          {!abierto ? (
            <div className="grid flex-1 place-items-center p-8">
              <Vacio>Elige una conversación de la izquierda.</Vacio>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-sitio-borde px-4 py-3">
                <button type="button" onClick={() => setAbierto(null)} aria-label="Volver" className="grid h-8 w-8 place-items-center text-sitio-suave lg:hidden">
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">
                    #{abierto.numero} · {abierto.nombre}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-sitio-tenue">
                    <a href={`mailto:${abierto.email}`} className="hover:text-white">
                      {abierto.email}
                    </a>
                    {abierto.tenant ? (
                      <button type="button" onClick={() => alAbrirTienda(abierto.tenant!.id)} className="inline-flex items-center gap-1 hover:text-white">
                        <LayoutDashboard aria-hidden="true" className="h-3 w-3" />
                        {abierto.tenant.nombre} · {PLANES[abierto.tenant.plan as Plan]?.nombre}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Globe aria-hidden="true" className="h-3 w-3" />
                        Desde la web
                      </span>
                    )}
                    {abierto.calificacion && (
                      <span className="inline-flex items-center gap-0.5 text-sitio-ambar">
                        <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                        {abierto.calificacion}/5
                      </span>
                    )}
                  </span>
                </span>
                {escribe &&
                  (abierto.estado === 'RESUELTO' ? (
                    <BotonPanel onClick={() => void cambiarEstado('EN_CURSO')}>
                      <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                      Reabrir
                    </BotonPanel>
                  ) : (
                    <BotonPanel onClick={() => void cambiarEstado('RESUELTO')}>
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      Resolver
                    </BotonPanel>
                  ))}
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-5">
                {abierto.mensajes.map((mensaje) =>
                  mensaje.autor === 'SISTEMA' ? (
                    <p key={mensaje.id} className="py-1 text-center text-[11.5px] text-sitio-tenue">
                      {mensaje.texto}
                    </p>
                  ) : (
                    <motion.div
                      key={mensaje.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: SALIDA }}
                      className={cn('flex', mensaje.autor === 'ASESOR' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap',
                          mensaje.autor === 'ASESOR' ? 'rounded-br-md bg-white text-black' : 'rounded-bl-md bg-white/[0.07]',
                        )}
                      >
                        {mensaje.texto}
                        <span className={cn('mt-1 block text-[10px]', mensaje.autor === 'ASESOR' ? 'text-black/45' : 'text-sitio-tenue')}>
                          {mensaje.autor === 'ASESOR' && `${mensaje.nombreAutor} · `}
                          {new Date(mensaje.creadoEn).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ),
                )}
                {escribiendo && <p className="text-[11.5px] text-sitio-tenue italic">{escribiendo}</p>}
                <div ref={final} />
              </div>

              {escribe ? (
                <form onSubmit={enviar} className="flex items-end gap-2 border-t border-sitio-borde p-3">
                  <textarea
                    value={texto}
                    onChange={(evento) => {
                      setTexto(evento.target.value)
                      socket.current?.emit('escribiendo', abierto.id)
                    }}
                    onKeyDown={(evento) => {
                      if (evento.key === 'Enter' && !evento.shiftKey) {
                        evento.preventDefault()
                        enviar(evento)
                      }
                    }}
                    rows={1}
                    placeholder="Escribe tu respuesta… (Enter envía, Shift+Enter salta línea)"
                    aria-label="Respuesta"
                    className={cn(CLASES_ENTRADA, 'max-h-40 min-h-[42px] resize-y')}
                  />
                  <BotonPanel type="submit" variante="primario" aria-label="Enviar" className="h-[42px]">
                    <Send aria-hidden="true" className="h-4 w-4" />
                  </BotonPanel>
                </form>
              ) : (
                <p className="border-t border-sitio-borde p-3 text-center text-[12px] text-sitio-tenue">Tu rol es de sólo lectura.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
