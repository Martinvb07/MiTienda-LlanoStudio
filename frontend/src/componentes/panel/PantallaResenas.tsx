'use client'

/* eslint-disable @next/next/no-img-element -- foto del producto subida por la tienda */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BadgeCheck, Check, MessageSquareReply, Star, Trash2, X } from 'lucide-react'
import { eliminarResena, listarResenas, moderarResena, type EstadoResena, type ResenaPanel } from '@/servicios/panel'
import { CabeceraPanel } from './CabeceraPanel'
import { useAvisos } from './Avisos'
import { Aviso, BotonPanel, CURVA, CampoArea, Etiqueta, Segmentado } from './ui/basicos'
import { Aparecer } from './ui/movimiento'
import { confirmar } from './ui/confirmar'

const ESTADO: Record<EstadoResena, { etiqueta: string; tono: 'verde' | 'ambar' | 'neutro' }> = {
  PENDIENTE: { etiqueta: 'Por aprobar', tono: 'ambar' },
  APROBADA: { etiqueta: 'Publicada', tono: 'verde' },
  RECHAZADA: { etiqueta: 'Oculta', tono: 'neutro' },
}

function EstrellasPanel({ valor }: { valor: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((posicion) => (
        <Star key={posicion} aria-hidden="true" strokeWidth={1.5} className={posicion <= valor ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 text-white/20'} />
      ))}
    </span>
  )
}

/** Opiniones de los productos: se aprueban antes de salir en la tienda y se pueden responder. */
export function PantallaResenas() {
  const { recargar } = useAvisos()
  const [resenas, setResenas] = useState<ResenaPanel[] | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<EstadoResena>('PENDIENTE')
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState('')

  useEffect(() => {
    listarResenas()
      .then((lista) => {
        setResenas(lista)
        if (!lista.some((resena) => resena.estado === 'PENDIENTE') && lista.length) setVista('APROBADA')
      })
      .catch((problema: Error) => setError(problema.message))
  }, [])

  const visibles = (resenas ?? []).filter((resena) => resena.estado === vista)
  const cuenta = (estado: EstadoResena) => (resenas ?? []).filter((resena) => resena.estado === estado).length
  const publicadas = (resenas ?? []).filter((resena) => resena.estado === 'APROBADA')
  const promedio = publicadas.length ? publicadas.reduce((suma, resena) => suma + resena.estrellas, 0) / publicadas.length : 0

  async function cambiar(resena: ResenaPanel, cambios: { estado?: EstadoResena; respuesta?: string | null }) {
    setError('')
    try {
      const nueva = await moderarResena(resena.id, cambios)
      setResenas((lista) => (lista ?? []).map((otra) => (otra.id === nueva.id ? nueva : otra)))
      recargar()
      return true
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
      return false
    }
  }

  async function borrar(resena: ResenaPanel) {
    if (!(await confirmar({ titulo: '¿Eliminar esta opinión?', mensaje: 'No se puede deshacer.', confirmar: 'Eliminar', peligro: true }))) return
    try {
      await eliminarResena(resena.id)
      setResenas((lista) => (lista ?? []).filter((otra) => otra.id !== resena.id))
      recargar()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo eliminar')
    }
  }

  return (
    <>
      <CabeceraPanel
        titulo="Opiniones"
        descripcion={
          !resenas
            ? 'Lo que dicen tus clientes de tus productos.'
            : publicadas.length
              ? `${promedio.toLocaleString('es-CO', { maximumFractionDigits: 1 })} de 5 en promedio · ${publicadas.length} publicadas${cuenta('PENDIENTE') ? ` · ${cuenta('PENDIENTE')} por aprobar` : ''}`
              : 'Aprueba las opiniones para que salgan en tu tienda.'
        }
      />

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      {!resenas ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="brillo h-28 rounded-[16px]" />
          ))}
        </div>
      ) : resenas.length === 0 ? (
        <Aparecer>
          <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]" />
            <Star aria-hidden="true" className="h-9 w-9 text-sitio-tenue" strokeWidth={1.4} />
            <p className="mt-4 text-2xl tracking-[-0.03em]">Todavía no hay opiniones</p>
            <p className="mt-2 max-w-md text-sm text-sitio-tenue">
              Tus clientes las dejan al final de cada producto. Las que lleguen se quedan aquí hasta que las apruebes; las de quien compró llevan
              “Compra verificada”.
            </p>
          </div>
        </Aparecer>
      ) : (
        <>
          <div className="mb-6">
            <Segmentado
              opciones={[
                { valor: 'PENDIENTE', etiqueta: `Por aprobar${cuenta('PENDIENTE') ? ` (${cuenta('PENDIENTE')})` : ''}` },
                { valor: 'APROBADA', etiqueta: 'Publicadas' },
                { valor: 'RECHAZADA', etiqueta: 'Ocultas' },
              ]}
              valor={vista}
              alCambiar={setVista}
            />
          </div>
          {visibles.length === 0 ? (
            <p className="rounded-[16px] border border-sitio-borde px-6 py-14 text-center text-sm text-sitio-tenue">
              {vista === 'PENDIENTE' ? 'Nada por aprobar. ¡Al día!' : 'Nada por aquí.'}
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              <AnimatePresence initial={false}>
                {visibles.map((resena) => (
                  <motion.li
                    key={resena.id}
                    layout
                    initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: CURVA }}
                    className="flex flex-col rounded-[16px] border border-sitio-borde bg-sitio-superficie p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                        {resena.producto.foto && <img src={resena.producto.foto} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px]">{resena.producto.nombre}</span>
                        <EstrellasPanel valor={resena.estrellas} />
                      </span>
                      <Etiqueta tono={ESTADO[resena.estado].tono}>{ESTADO[resena.estado].etiqueta}</Etiqueta>
                    </div>
                    <p className="mt-4 text-[14px] leading-relaxed whitespace-pre-line text-sitio-suave">“{resena.texto}”</p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-sitio-tenue">
                      <span className="text-white/80">{resena.nombre}</span>
                      {resena.ciudad && <span>· {resena.ciudad}</span>}
                      <span>· {resena.email}</span>
                      {resena.verificada && (
                        <span className="inline-flex items-center gap-1 text-sitio-verde">
                          <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" /> Compró
                        </span>
                      )}
                    </p>
                    {resena.respuesta && respondiendo !== resena.id && (
                      <p className="mt-3 rounded-lg border border-sitio-borde bg-white/[0.03] px-3 py-2 text-[12.5px] text-sitio-suave">
                        <span className="text-sitio-tenue">Tu respuesta: </span>
                        {resena.respuesta}
                      </p>
                    )}
                    <AnimatePresence initial={false}>
                      {respondiendo === resena.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: CURVA }} className="overflow-hidden">
                          <div className="mt-3 flex flex-col gap-2">
                            <CampoArea etiqueta="Respuesta pública" valor={respuesta} alCambiar={setRespuesta} filas={2} maximo={1000} marcador="¡Gracias por contarnos!" />
                            <div className="flex justify-end gap-2">
                              <BotonPanel variante="fantasma" onClick={() => setRespondiendo(null)}>
                                Cerrar
                              </BotonPanel>
                              <BotonPanel
                                variante="primario"
                                onClick={() => void cambiar(resena, { respuesta: respuesta.trim() || null }).then((ok) => ok && setRespondiendo(null))}
                              >
                                Guardar respuesta
                              </BotonPanel>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                      {resena.estado !== 'APROBADA' && (
                        <BotonPanel variante="primario" onClick={() => void cambiar(resena, { estado: 'APROBADA' })}>
                          <Check aria-hidden="true" className="h-3.5 w-3.5" /> Publicar
                        </BotonPanel>
                      )}
                      {resena.estado !== 'RECHAZADA' && (
                        <BotonPanel onClick={() => void cambiar(resena, { estado: 'RECHAZADA' })}>
                          <X aria-hidden="true" className="h-3.5 w-3.5" /> Ocultar
                        </BotonPanel>
                      )}
                      <BotonPanel
                        variante="fantasma"
                        onClick={() => {
                          setRespuesta(resena.respuesta ?? '')
                          setRespondiendo(resena.id)
                        }}
                      >
                        <MessageSquareReply aria-hidden="true" className="h-3.5 w-3.5" /> Responder
                      </BotonPanel>
                      <span className="flex-1" />
                      <BotonPanel variante="peligro" aria-label="Eliminar" onClick={() => void borrar(resena)}>
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </BotonPanel>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}
    </>
  )
}
