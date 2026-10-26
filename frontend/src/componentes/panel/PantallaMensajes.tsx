'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, ArchiveRestore, ArrowUpRight, CheckCheck, Inbox, Mail, MessageCircle, Phone, Trash2 } from 'lucide-react'
import { actualizarMensaje, eliminarMensaje, listarMensajes, marcarMensajesLeidos, type MensajeContacto } from '@/servicios/panel'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useAvisos } from './Avisos'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, CURVA, Segmentado } from './ui/basicos'
import { Aparecer } from './ui/movimiento'
import { confirmar } from './ui/confirmar'

const hace = (iso: string) => {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short' })
}

/** Lo que escriben en el formulario de contacto del sitio. */
export function PantallaMensajes() {
  const { sesion } = useSesion()
  const { recargar } = useAvisos()
  const [mensajes, setMensajes] = useState<MensajeContacto[] | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<'entrada' | 'archivados'>('entrada')
  const [abierto, setAbierto] = useState<string | null>(null)

  useEffect(() => {
    listarMensajes()
      .then(setMensajes)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  const visibles = (mensajes ?? []).filter((mensaje) => mensaje.archivado === (vista === 'archivados'))
  const sinLeer = (mensajes ?? []).filter((mensaje) => !mensaje.leido && !mensaje.archivado).length

  function reemplazar(mensaje: MensajeContacto) {
    setMensajes((lista) => (lista ?? []).map((otro) => (otro.id === mensaje.id ? mensaje : otro)))
  }

  async function cambiar(mensaje: MensajeContacto, cambios: { leido?: boolean; archivado?: boolean }) {
    setError('')
    // Se ve el cambio de una vez; si la API falla, se vuelve atrás.
    reemplazar({ ...mensaje, ...cambios })
    try {
      reemplazar(await actualizarMensaje(mensaje.id, cambios))
      recargar()
    } catch (problema) {
      reemplazar(mensaje)
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    }
  }

  function abrir(mensaje: MensajeContacto) {
    setAbierto((actual) => (actual === mensaje.id ? null : mensaje.id))
    if (!mensaje.leido) void cambiar(mensaje, { leido: true })
  }

  async function borrar(mensaje: MensajeContacto) {
    if (!(await confirmar({ titulo: '¿Eliminar este mensaje?', mensaje: 'No se puede deshacer.', confirmar: 'Eliminar', peligro: true }))) return
    try {
      await eliminarMensaje(mensaje.id)
      setMensajes((lista) => (lista ?? []).filter((otro) => otro.id !== mensaje.id))
      recargar()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo eliminar')
    }
  }

  async function leerTodos() {
    setMensajes((lista) => (lista ?? []).map((mensaje) => ({ ...mensaje, leido: true })))
    await marcarMensajesLeidos().catch(() => undefined)
    recargar()
  }

  return (
    <>
      <CabeceraPanel
        titulo="Mensajes"
        descripcion={
          !mensajes
            ? 'Lo que te escriben desde el formulario de contacto de tu sitio.'
            : sinLeer
              ? `${sinLeer} sin leer`
              : 'Todo leído. Lo nuevo también te llega al correo.'
        }
        accion={
          sinLeer > 0 && (
            <BotonPanel onClick={() => void leerTodos()} className="h-10 px-4">
              <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Marcar todo como leído
            </BotonPanel>
          )
        }
      />

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      {!mensajes ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="brillo h-20 rounded-[16px]" />
          ))}
        </div>
      ) : mensajes.length === 0 ? (
        <Aparecer>
          <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]" />
            <Inbox aria-hidden="true" className="h-9 w-9 text-sitio-tenue" strokeWidth={1.4} />
            <p className="mt-4 text-2xl tracking-[-0.03em]">Todavía no te han escrito</p>
            <p className="mt-2 max-w-md text-sm text-sitio-tenue">
              Agrega la sección <strong className="font-medium text-sitio-suave">Formulario de contacto</strong> en el diseño. Lo que te escriban llega
              aquí y a tu correo.
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
                { valor: 'entrada', etiqueta: 'Recibidos' },
                { valor: 'archivados', etiqueta: 'Archivados' },
              ]}
              valor={vista}
              alCambiar={setVista}
            />
          </div>
          {visibles.length === 0 ? (
            <p className="rounded-[16px] border border-sitio-borde px-6 py-14 text-center text-sm text-sitio-tenue">
              {vista === 'entrada' ? 'Nada pendiente.' : 'No has archivado mensajes.'}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-[16px] border border-sitio-borde bg-sitio-superficie">
              <AnimatePresence initial={false}>
                {visibles.map((mensaje) => {
                  const esAbierto = abierto === mensaje.id
                  const primerNombre = mensaje.nombre.split(' ')[0]
                  return (
                    <motion.li
                      key={mensaje.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.45, ease: CURVA }}
                      className="border-b border-sitio-borde last:border-b-0"
                    >
                      <button type="button" onClick={() => abrir(mensaje)} aria-expanded={esAbierto} className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.02] sm:px-5">
                        <span aria-hidden="true" className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', mensaje.leido ? 'bg-transparent' : 'bg-sitio-azul-claro')} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className={cn('truncate text-[14px]', !mensaje.leido && 'font-medium')}>
                              {mensaje.nombre}
                              {mensaje.motivo && <span className="font-normal text-sitio-tenue"> · {mensaje.motivo}</span>}
                            </span>
                            <span className="shrink-0 text-[11.5px] text-sitio-tenue">{hace(mensaje.creadoEn)}</span>
                          </span>
                          <span className={cn('mt-0.5 block text-[13px] text-sitio-tenue', esAbierto ? 'whitespace-pre-line text-sitio-suave' : 'truncate')}>
                            {mensaje.mensaje}
                          </span>
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {esAbierto && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: CURVA }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-9 sm:px-5 sm:pl-10">
                              {mensaje.telefono && (
                                <a
                                  href={enlaceWhatsapp(mensaje.telefono, `Hola ${primerNombre}, te escribo de ${sesion.tienda?.nombre ?? 'parte de nosotros'} por tu mensaje.`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/[0.08] px-3 text-[12.5px] text-[#4ee28a] transition-colors hover:bg-[#25d366]/[0.15]"
                                >
                                  <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" /> WhatsApp
                                </a>
                              )}
                              {mensaje.email && (
                                <a
                                  href={`mailto:${mensaje.email}?subject=${encodeURIComponent(`Re: ${mensaje.motivo ?? 'tu mensaje'}`)}`}
                                  className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.04] px-3 text-[12.5px] text-sitio-suave transition-colors hover:text-white"
                                >
                                  <Mail aria-hidden="true" className="h-3.5 w-3.5" /> {mensaje.email}
                                </a>
                              )}
                              {mensaje.telefono && (
                                <a href={`tel:${mensaje.telefono}`} className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.04] px-3 text-[12.5px] text-sitio-suave transition-colors hover:text-white">
                                  <Phone aria-hidden="true" className="h-3.5 w-3.5" /> {mensaje.telefono}
                                </a>
                              )}
                              <span className="flex-1" />
                              <BotonPanel variante="fantasma" onClick={() => void cambiar(mensaje, { archivado: !mensaje.archivado })}>
                                {mensaje.archivado ? <ArchiveRestore aria-hidden="true" className="h-3.5 w-3.5" /> : <Archive aria-hidden="true" className="h-3.5 w-3.5" />}
                                {mensaje.archivado ? 'Devolver' : 'Archivar'}
                              </BotonPanel>
                              <BotonPanel variante="peligro" onClick={() => void borrar(mensaje)} aria-label="Eliminar">
                                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                              </BotonPanel>
                            </div>
                            {mensaje.pagina && <p className="px-4 pb-4 pl-9 text-[11px] text-sitio-tenue sm:pl-10">Escrito desde {mensaje.pagina === '/' ? 'la página de inicio' : mensaje.pagina}</p>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}
    </>
  )
}
