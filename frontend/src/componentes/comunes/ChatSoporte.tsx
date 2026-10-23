'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, ChevronRight, MessageCircle, Send, Star, X } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import { leerToken } from '@/servicios/panel'
import { conectar } from '@/servicios/tiempoReal'
import { cn } from '@/utilidades/clases'

const SALIDA = [0.16, 1, 0.3, 1] as const

interface Opcion {
  pregunta: string
  respuesta: string
  enlace?: string
}
interface Mensaje {
  id: string
  autor: 'CLIENTE' | 'ASESOR' | 'SISTEMA'
  nombreAutor: string
  texto: string
  creadoEn: string
}
type Vista = 'inicio' | 'respuesta' | 'formulario' | 'chat'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function claveToken(modo: 'web' | 'panel') {
  return `mitienda:chat:${modo}`
}
function leer(clave: string) {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}
function escribir(clave: string, valor: string | null) {
  try {
    if (valor) localStorage.setItem(clave, valor)
    else localStorage.removeItem(clave)
  } catch {
    // Sin almacenamiento la conversación no sobrevive a recargar.
  }
}

/**
 * Chat de ayuda: primero respuestas rápidas; si ninguna sirve, conversación en
 * vivo con un asesor (socket.io). En la web pide nombre y correo; en el panel
 * ya sabe quién es. La conversación se retoma al volver.
 */
export function ChatSoporte({ modo }: { modo: 'web' | 'panel' }) {
  const [abierto, setAbierto] = useState(false)
  const [vista, setVista] = useState<Vista>('inicio')
  const [opciones, setOpciones] = useState<Opcion[]>([])
  const [elegida, setElegida] = useState<Opcion | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [estado, setEstado] = useState<'ABIERTO' | 'EN_CURSO' | 'RESUELTO'>('ABIERTO')
  const [calificacion, setCalificacion] = useState<number | null>(null)
  const [enLinea, setEnLinea] = useState(false)
  const [escribiendo, setEscribiendo] = useState<string | null>(null)
  const [nuevos, setNuevos] = useState(0)
  const [texto, setTexto] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const socket = useRef<Socket | null>(null)
  const final = useRef<HTMLDivElement>(null)
  const abiertoRef = useRef(abierto)
  useEffect(() => {
    abiertoRef.current = abierto
  }, [abierto])

  const cabeceras = useCallback((): Record<string, string> => {
    const sesion = modo === 'panel' ? leerToken() : null
    return { 'content-type': 'application/json', ...(sesion ? { authorization: `Bearer ${sesion}` } : {}) }
  }, [modo])

  // Respuestas rápidas y conversación guardada.
  useEffect(() => {
    fetch('/api/soporte/opciones')
      .then((respuesta) => respuesta.json())
      .then((datos: { opciones?: Opcion[] }) => setOpciones(datos.opciones ?? []))
      .catch(() => undefined)
    const guardado = leer(claveToken(modo))
    if (!guardado) return
    fetch(`/api/soporte/tickets/${guardado}`, { headers: cabeceras() })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error('Ya no existe')
        const { ticket } = (await respuesta.json()) as {
          ticket: { estado: typeof estado; calificacion: number | null; mensajes: Mensaje[] }
        }
        setToken(guardado)
        setMensajes(ticket.mensajes)
        setEstado(ticket.estado)
        setCalificacion(ticket.calificacion)
      })
      .catch(() => escribir(claveToken(modo), null))
  }, [modo, cabeceras])

  // Conexión en vivo mientras haya una conversación.
  useEffect(() => {
    if (!token) return
    const conexion = conectar({ tipo: 'cliente', token, panel: modo === 'panel' ? (leerToken() ?? undefined) : undefined })
    socket.current = conexion
    let pausa: ReturnType<typeof setTimeout>
    conexion.on('asesores', ({ enLinea: hay }: { enLinea: boolean }) => setEnLinea(hay))
    conexion.on('mensaje', (mensaje: Mensaje) => {
      setMensajes((lista) => (lista.some((otro) => otro.id === mensaje.id) ? lista : [...lista, mensaje]))
      if (mensaje.autor === 'ASESOR') {
        setEscribiendo(null)
        if (!abiertoRef.current) setNuevos((cuenta) => cuenta + 1)
        else conexion.emit('leido')
      }
    })
    conexion.on('estado', ({ estado: nuevo }: { estado: typeof estado }) => nuevo && setEstado(nuevo))
    conexion.on('escribiendo', ({ nombre: quien }: { nombre?: string }) => {
      setEscribiendo(`${quien?.split(' ')[0] ?? 'El asesor'} está escribiendo…`)
      clearTimeout(pausa)
      pausa = setTimeout(() => setEscribiendo(null), 3000)
    })
    return () => {
      clearTimeout(pausa)
      conexion.disconnect()
      socket.current = null
    }
  }, [token, modo])

  useEffect(() => {
    final.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes.length, vista, abierto])

  function abrir() {
    setAbierto(true)
    setNuevos(0)
    if (token) {
      setVista('chat')
      socket.current?.emit('leido')
    }
  }

  async function empezar(evento: FormEvent) {
    evento.preventDefault()
    setError('')
    if (modo === 'web') {
      if (!nombre.trim()) return setError('Escribe tu nombre.')
      if (!CORREO.test(email)) return setError('Escribe un correo válido para responderte si te vas.')
    }
    if (!texto.trim()) return setError('Cuéntanos en qué te ayudamos.')
    setEnviando(true)
    try {
      const respuesta = await fetch('/api/soporte/tickets', {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify({
          ...(modo === 'web' ? { nombre, email } : {}),
          mensaje: texto,
          ...(elegida ? { asunto: elegida.pregunta } : {}),
        }),
      })
      const datos = (await respuesta.json()) as { token?: string; error?: { mensaje?: string } }
      if (!respuesta.ok || !datos.token) throw new Error(datos.error?.mensaje ?? 'No pudimos abrir el chat')
      escribir(claveToken(modo), datos.token)
      // El primer mensaje se guardó antes de conectar el socket: se trae de la API.
      const guardado = await fetch(`/api/soporte/tickets/${datos.token}`, { headers: cabeceras() })
        .then((r) => r.json() as Promise<{ ticket?: { mensajes: Mensaje[] } }>)
        .catch(() => ({ ticket: undefined }))
      setMensajes(
        guardado.ticket?.mensajes ?? [{ id: 'local', autor: 'CLIENTE', nombreAutor: nombre, texto, creadoEn: new Date().toISOString() }],
      )
      setEstado('ABIERTO')
      setCalificacion(null)
      setToken(datos.token)
      setTexto('')
      setVista('chat')
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No pudimos abrir el chat')
    } finally {
      setEnviando(false)
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!texto.trim() || !socket.current) return
    socket.current.emit('mensaje', texto)
    setTexto('')
  }

  async function calificar(estrellas: number) {
    if (!token) return
    setCalificacion(estrellas)
    await fetch(`/api/soporte/tickets/${token}/calificar`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({ calificacion: estrellas }),
    }).catch(() => undefined)
  }

  function nuevaConversacion() {
    escribir(claveToken(modo), null)
    setToken(null)
    setMensajes([])
    setElegida(null)
    setVista('inicio')
  }

  const lista = mensajes

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn('chat-soporte fixed right-4 z-[200] flex flex-col items-end gap-3 sm:right-6', modo === 'panel' ? 'bottom-24 md:bottom-6' : 'bottom-5 sm:bottom-6')}>
        <AnimatePresence>
          {abierto && (
            <motion.section
              role="dialog"
              aria-label="Ayuda de Mi Sitio"
              initial={{ opacity: 0, y: 28, scale: 0.94, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: SALIDA } }}
              exit={{ opacity: 0, y: 18, scale: 0.96, filter: 'blur(6px)', transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
              className="flex h-[min(600px,calc(100dvh-140px))] w-[min(380px,calc(100vw-32px))] origin-bottom-right flex-col overflow-hidden rounded-[20px] border border-sitio-borde-fuerte bg-sitio-modal text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
            >
              <header className="flex items-center gap-3 border-b border-sitio-borde px-4 py-3.5">
                <AnimatePresence initial={false}>
                  {vista !== 'inicio' && !(vista === 'chat' && token) && (
                    <motion.button
                      type="button"
                      aria-label="Volver"
                      onClick={() => setVista('inicio')}
                      initial={{ opacity: 0, width: 0, x: -6 }}
                      animate={{ opacity: 1, width: 28, x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -6 }}
                      transition={{ duration: 0.45, ease: SALIDA }}
                      className="grid h-7 shrink-0 place-items-center overflow-hidden text-sitio-suave transition-colors duration-300 hover:text-white"
                    >
                      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium tracking-[-0.01em]">Ayuda de Mi Sitio</span>
                  <span className="flex items-center gap-1.5 text-[11.5px] text-sitio-tenue">
                    <span aria-hidden="true" className="estado-punto" data-tono={enLinea ? 'verde' : 'neutro'} data-vivo={(token && enLinea) || undefined} />
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={token ? (enLinea ? 'linea' : 'espera') : 'rapidas'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.35, ease: SALIDA }}
                      >
                        {token ? (enLinea ? 'Hay asesores en línea' : 'Te respondemos apenas podamos') : 'Respuestas al instante'}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setAbierto(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-sitio-suave transition-[color,background,transform] duration-500 ease-salida hover:rotate-90 hover:bg-white/[0.06] hover:text-white"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={vista}
                    initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: SALIDA } }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
                  >
                    {vista === 'inicio' && (
                      <div>
                        <p className="text-[15px] leading-snug">Hola, ¿en qué te ayudamos?</p>
                        <p className="mt-1 text-[12.5px] text-sitio-tenue">Elige una pregunta o habla con una persona.</p>
                        <ul className="mt-4 flex flex-col gap-1.5">
                          {opciones.map((opcion, indice) => (
                            <motion.li
                              key={opcion.pregunta}
                              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              transition={{ duration: 0.6, delay: 0.08 + indice * 0.05, ease: SALIDA }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setElegida(opcion)
                                  setVista('respuesta')
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl border border-sitio-borde px-3.5 py-3 text-left text-[13px] transition-[border-color,background] duration-500 ease-salida hover:border-sitio-borde-fuerte hover:bg-white/[0.03]"
                              >
                                <span className="flex-1">{opcion.pregunta}</span>
                                <ChevronRight
                                  aria-hidden="true"
                                  className="h-4 w-4 shrink-0 text-sitio-tenue transition-[transform,color] duration-500 ease-salida group-hover:translate-x-0.5 group-hover:text-white"
                                />
                              </button>
                            </motion.li>
                          ))}
                        </ul>
                        <motion.button
                          type="button"
                          onClick={() => (token ? setVista('chat') : setVista('formulario'))}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 + opciones.length * 0.05, ease: SALIDA }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[13px] font-medium text-black transition-opacity duration-300 hover:opacity-90"
                        >
                          <MessageCircle aria-hidden="true" className="h-4 w-4" />
                          {token ? 'Volver a mi conversación' : 'Hablar con un asesor'}
                        </motion.button>
                      </div>
                    )}

                    {vista === 'respuesta' && elegida && (
                      <RespuestaRapida
                        opcion={elegida}
                        alSirvio={() => setVista('inicio')}
                        alAsesor={() => {
                          setTexto(`Sobre "${elegida.pregunta}": `)
                          setVista(token ? 'chat' : 'formulario')
                        }}
                      />
                    )}

                    {vista === 'formulario' && (
                      <form onSubmit={(evento) => void empezar(evento)} className="flex flex-col gap-3">
                        <p className="text-[13.5px]">Cuéntanos qué necesitas y te conectamos con una persona.</p>
                        {modo === 'web' && (
                          <>
                            <input
                              value={nombre}
                              onChange={(evento) => setNombre(evento.target.value)}
                              placeholder="Tu nombre"
                              aria-label="Tu nombre"
                              autoComplete="name"
                              className={CLASES_CAMPO}
                            />
                            <input
                              value={email}
                              onChange={(evento) => setEmail(evento.target.value)}
                              type="email"
                              placeholder="Tu correo (por si te vas)"
                              aria-label="Tu correo"
                              autoComplete="email"
                              className={CLASES_CAMPO}
                            />
                          </>
                        )}
                        <textarea
                          value={texto}
                          onChange={(evento) => setTexto(evento.target.value)}
                          rows={4}
                          placeholder="Escribe tu pregunta…"
                          aria-label="Tu mensaje"
                          className={cn(CLASES_CAMPO, 'resize-none')}
                        />
                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, ease: SALIDA }}
                              className="overflow-hidden text-[12.5px] text-red-300"
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        <motion.button
                          type="submit"
                          disabled={enviando}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[13px] font-medium text-black transition-opacity duration-300 disabled:opacity-50"
                        >
                          {enviando ? <Puntos /> : 'Empezar chat'}
                        </motion.button>
                      </form>
                    )}

                    {vista === 'chat' && (
                      <div className="flex flex-col gap-2.5">
                        <AnimatePresence initial={false}>
                          {lista.map((mensaje) =>
                            mensaje.autor === 'SISTEMA' ? (
                              <motion.p
                                key={mensaje.id}
                                layout="position"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, ease: SALIDA }}
                                className="py-1 text-center text-[11.5px] text-sitio-tenue"
                              >
                                {mensaje.texto}
                              </motion.p>
                            ) : (
                              <motion.div
                                key={mensaje.id}
                                layout="position"
                                initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 0.55, ease: SALIDA }}
                                className={cn(
                                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap',
                                  mensaje.autor === 'CLIENTE'
                                    ? 'ml-auto origin-bottom-right rounded-br-md bg-white text-black'
                                    : 'origin-bottom-left rounded-bl-md bg-white/[0.07]',
                                )}
                              >
                                {mensaje.autor === 'ASESOR' && <span className="mb-0.5 block text-[11px] text-sitio-tenue">{mensaje.nombreAutor}</span>}
                                {mensaje.texto}
                              </motion.div>
                            ),
                          )}
                        </AnimatePresence>
                        {lista.length === 1 && lista[0]?.autor === 'CLIENTE' && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: SALIDA }}
                            className="text-center text-[11.5px] text-sitio-tenue"
                          >
                            {enLinea ? 'Un asesor te responde en un momento.' : 'Ahora no hay asesores en línea: te respondemos aquí y por correo apenas podamos.'}
                          </motion.p>
                        )}
                        <AnimatePresence>
                          {escribiendo && (
                            <motion.div
                              layout="position"
                              initial={{ opacity: 0, y: 8, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                              transition={{ duration: 0.45, ease: SALIDA }}
                              aria-label={escribiendo}
                              className="w-fit origin-bottom-left rounded-2xl rounded-bl-md bg-white/[0.07] px-3.5 py-3"
                            >
                              <Puntos />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {estado === 'RESUELTO' && (
                            <motion.div
                              layout="position"
                              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.6, ease: SALIDA }}
                              className="mt-2 rounded-xl border border-sitio-borde p-3 text-center"
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.p
                                  key={calificacion ? 'gracias' : 'pregunta'}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.3, ease: SALIDA }}
                                  className="text-[12.5px]"
                                >
                                  {calificacion ? '¡Gracias por calificarnos!' : '¿Cómo te atendimos?'}
                                </motion.p>
                              </AnimatePresence>
                              <div className="mt-2 flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((estrella) => {
                                  const llena = Boolean(calificacion && estrella <= calificacion)
                                  return (
                                    <motion.button
                                      key={estrella}
                                      type="button"
                                      aria-label={`${estrella} de 5`}
                                      onClick={() => void calificar(estrella)}
                                      whileHover={{ scale: 1.15, y: -1 }}
                                      whileTap={{ scale: 0.9 }}
                                      animate={llena ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                                      transition={{ duration: 0.45, delay: llena ? estrella * 0.04 : 0, ease: SALIDA }}
                                      className="p-0.5"
                                    >
                                      <Star
                                        aria-hidden="true"
                                        className={cn(
                                          'h-5 w-5 transition-colors duration-500',
                                          llena ? 'fill-sitio-ambar text-sitio-ambar' : 'text-sitio-tenue',
                                        )}
                                      />
                                    </motion.button>
                                  )
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={nuevaConversacion}
                                className="mt-2 text-[12px] text-sitio-suave underline-offset-4 transition-colors duration-300 hover:text-white hover:underline"
                              >
                                Empezar otra conversación
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div ref={final} />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {vista === 'chat' && token && (
                  <motion.form
                    onSubmit={enviar}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.5, ease: SALIDA }}
                    className="flex items-end gap-2 border-t border-sitio-borde p-3"
                  >
                    <textarea
                      value={texto}
                      onChange={(evento) => {
                        setTexto(evento.target.value)
                        socket.current?.emit('escribiendo')
                      }}
                      onKeyDown={(evento) => {
                        if (evento.key === 'Enter' && !evento.shiftKey) {
                          evento.preventDefault()
                          enviar(evento)
                        }
                      }}
                      rows={1}
                      placeholder="Escribe un mensaje…"
                      aria-label="Mensaje"
                      className={cn(CLASES_CAMPO, 'max-h-28 min-h-[42px] resize-none')}
                    />
                    <motion.button
                      type="submit"
                      aria-label="Enviar"
                      disabled={!texto.trim()}
                      whileTap={{ scale: 0.9 }}
                      className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-white text-black transition-opacity duration-300 disabled:opacity-35"
                    >
                      <Send aria-hidden="true" className="h-4 w-4" />
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => (abierto ? setAbierto(false) : abrir())}
          aria-label={abierto ? 'Cerrar la ayuda' : 'Abrir la ayuda'}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.6, ease: SALIDA }}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-[0_14px_36px_-10px_rgba(0,0,0,0.55)]"
        >
          {/* Con mensajes nuevos, una onda suave alrededor del botón. */}
          {nuevos > 0 && !abierto && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-white"
              animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: SALIDA }}
            />
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={abierto ? 'x' : 'chat'}
              initial={{ opacity: 0, rotate: -90, scale: 0.5, filter: 'blur(4px)' }}
              animate={{ opacity: 1, rotate: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5, filter: 'blur(4px)' }}
              transition={{ duration: 0.45, ease: SALIDA }}
              className="grid place-items-center"
            >
              {abierto ? <X aria-hidden="true" className="h-5 w-5" /> : <MessageCircle aria-hidden="true" className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence>
            {nuevos > 0 && !abierto && (
              <motion.span
                key="globo"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.45, ease: SALIDA }}
                className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-sitio-azul px-1.5 text-[10.5px] font-semibold text-[#fff]"
              >
                {nuevos}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </MotionConfig>
  )
}

const CLASES_CAMPO =
  'w-full rounded-xl border border-sitio-borde bg-sitio-campo px-3.5 py-2.5 text-[13.5px] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-sitio-tenue focus:border-white/40 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]'

/** Tres puntos que suben y bajan: "escribiendo…" y "conectando…". */
function Puntos() {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1">
      {[0, 1, 2].map((punto) => (
        <motion.span
          key={punto}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
          animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1, repeat: Infinity, delay: punto * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

/**
 * Respuesta rápida como una conversación: la pregunta sale del lado del
 * cliente, unos puntos de "escribiendo" y luego la respuesta.
 */
function RespuestaRapida({ opcion, alSirvio, alAsesor }: { opcion: Opcion; alSirvio: () => void; alAsesor: () => void }) {
  const [lista, setLista] = useState(false)
  useEffect(() => {
    const espera = setTimeout(() => setLista(true), 750)
    return () => clearTimeout(espera)
  }, [])

  return (
    <div className="flex flex-col">
      <motion.p
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: SALIDA }}
        className="ml-auto w-fit max-w-[85%] origin-bottom-right rounded-2xl rounded-br-md bg-white px-3.5 py-2.5 text-[13.5px] text-black"
      >
        {opcion.pregunta}
      </motion.p>
      <AnimatePresence mode="wait">
        {!lista ? (
          <motion.div
            key="puntos"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, delay: 0.2, ease: SALIDA } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className="mt-3 w-fit origin-bottom-left rounded-2xl rounded-bl-md bg-white/[0.07] px-3.5 py-3 text-sitio-suave"
          >
            <Puntos />
          </motion.div>
        ) : (
          <motion.div
            key="respuesta"
            initial={{ opacity: 0, y: 10, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: SALIDA }}
            className="mt-3 max-w-[90%] origin-bottom-left rounded-2xl rounded-bl-md bg-white/[0.07] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
          >
            {opcion.respuesta}
            {opcion.enlace && (
              <Link href={opcion.enlace} className="group mt-2 flex items-center gap-1 text-[12.5px] text-sitio-azul-claro">
                Ir ahí
                <ArrowUpRight aria-hidden="true" className="h-3 w-3 transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lista && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: SALIDA }}
          >
            <p className="mt-5 text-[12.5px] text-sitio-tenue">¿Te sirvió?</p>
            <div className="mt-2 flex gap-2">
              <motion.button
                type="button"
                onClick={alSirvio}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-xl border border-sitio-borde px-3 py-2.5 text-[12.5px] transition-colors duration-500 ease-salida hover:border-sitio-borde-fuerte hover:bg-white/[0.03]"
              >
                Sí, gracias
              </motion.button>
              <motion.button
                type="button"
                onClick={alAsesor}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-xl bg-white px-3 py-2.5 text-[12.5px] font-medium text-black transition-opacity duration-300 hover:opacity-90"
              >
                Hablar con un asesor
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
