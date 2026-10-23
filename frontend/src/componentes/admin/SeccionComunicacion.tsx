'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  eliminarAnuncio,
  eliminarNovedad,
  guardarAnuncio,
  guardarCorreos,
  guardarNovedad,
  guardarPlantillasWhatsapp,
  leerCorreos,
  leerPlantillasWhatsapp,
  listarAnuncios,
  listarNovedades,
  probarCorreo,
  type AjustesCorreos,
  type Anuncio,
  type DatosAnuncio,
  type Novedad,
  type PlanClave,
  type PlantillaWhatsapp,
  type SesionAdmin,
} from '@/servicios/admin'
import { ORDEN_PLANES, PLANES } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, CLASES_ENTRADA, Campo, CampoArea, Etiqueta, Interruptor, Segmentado } from '../panel/ui/basicos'
import { ModalPanel } from '../panel/ui/flotantes'
import { confirmar } from '../panel/ui/confirmar'
import { Cargando, Desplegable, TituloSeccion, Vacio, fecha } from './ui'

const ANUNCIO_VACIO: DatosAnuncio = { titulo: '', cuerpo: '', tipo: 'CAMPANA', planes: [], activo: true, hasta: null }

function SelectorPlanes({ valor, alCambiar }: { valor: PlanClave[]; alCambiar: (planes: PlanClave[]) => void }) {
  return (
    <div>
      <span className="text-[11.5px] text-sitio-suave">Para qué planes (ninguno = todos)</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {ORDEN_PLANES.map((plan) => {
          const marcado = valor.includes(plan)
          return (
            <button
              key={plan}
              type="button"
              aria-pressed={marcado}
              onClick={() => alCambiar(marcado ? valor.filter((otro) => otro !== plan) : [...valor, plan])}
              className={cn(
                'h-8 rounded-lg border px-3 text-[12.5px] transition-colors',
                marcado ? 'border-white bg-white text-black' : 'border-sitio-borde text-sitio-suave hover:text-white',
              )}
            >
              {PLANES[plan].nombre}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Anuncios en el panel de las tiendas, novedades, plantillas de WhatsApp y correos automáticos. */
export function SeccionComunicacion({ admin }: { admin: SesionAdmin }) {
  const escribe = admin.rol !== 'LECTURA'
  const dueno = admin.rol === 'DUENO'
  const [anuncios, setAnuncios] = useState<Anuncio[] | null>(null)
  const [novedades, setNovedades] = useState<Novedad[] | null>(null)
  const [plantillas, setPlantillas] = useState<PlantillaWhatsapp[] | null>(null)
  const [correos, setCorreos] = useState<{ configurado: boolean; ajustes: AjustesCorreos; enviados: Record<string, number> } | null>(null)
  const [anuncio, setAnuncio] = useState<{ datos: DatosAnuncio; id?: string } | null>(null)
  const [novedad, setNovedad] = useState<{ titulo: string; cuerpo: string; etiqueta: string | null; id?: string } | null>(null)
  const [error, setError] = useState('')
  const [nota, setNota] = useState('')

  useEffect(() => {
    const fallo = (e: Error) => setError(e.message)
    listarAnuncios().then(setAnuncios).catch(fallo)
    listarNovedades().then(setNovedades).catch(fallo)
    leerPlantillasWhatsapp().then(setPlantillas).catch(fallo)
    leerCorreos().then(setCorreos).catch(fallo)
  }, [])

  const avisar = (texto: string) => {
    setNota(texto)
    setTimeout(() => setNota(''), 2200)
  }
  const fallar = (problema: unknown) => setError(problema instanceof Error ? problema.message : 'No se pudo guardar')

  async function guardarElAnuncio() {
    if (!anuncio) return
    try {
      const guardado = await guardarAnuncio(anuncio.datos, anuncio.id)
      setAnuncios((lista) => (anuncio.id ? (lista ?? []).map((otro) => (otro.id === guardado.id ? guardado : otro)) : [guardado, ...(lista ?? [])]))
      setAnuncio(null)
    } catch (problema) {
      fallar(problema)
    }
  }

  async function guardarLaNovedad() {
    if (!novedad) return
    try {
      const { id, ...datos } = novedad
      const guardada = await guardarNovedad(datos, id)
      setNovedades((lista) => (id ? (lista ?? []).map((otra) => (otra.id === guardada.id ? guardada : otra)) : [guardada, ...(lista ?? [])]))
      setNovedad(null)
    } catch (problema) {
      fallar(problema)
    }
  }

  return (
    <>
      <TituloSeccion titulo="Comunicación" descripcion="Lo que les dices a las tiendas: en su panel, por WhatsApp y por correo." />
      <AnimatePresence>{error && <div className="mb-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>
      {nota && <p className="mb-3 text-[12.5px] text-sitio-verde">{nota}</p>}

      <div className="flex flex-col gap-2.5">
        <Desplegable titulo="Anuncios en el panel" resumen={anuncios ? `${anuncios.filter((a) => a.activo).length} activos` : ''} abierto>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-sitio-tenue">
              En la campana, o en una barra arriba del panel para lo urgente (“Mantenimiento hoy a las 11 p. m.”).
            </p>
            {escribe && (
              <BotonPanel onClick={() => setAnuncio({ datos: ANUNCIO_VACIO })}>
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                Nuevo
              </BotonPanel>
            )}
          </div>
          {!anuncios ? (
            <Cargando alto="h-20" />
          ) : anuncios.length === 0 ? (
            <Vacio>Ningún anuncio todavía.</Vacio>
          ) : (
            <ul>
              {anuncios.map((fila) => {
                const vencido = fila.hasta && new Date(fila.hasta) < new Date()
                return (
                  <li key={fila.id} className="flex items-center gap-3 border-b border-sitio-borde py-3 last:border-0">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px]">{fila.titulo}</span>
                      <span className="block truncate text-[11.5px] text-sitio-tenue">
                        {fila.tipo === 'BARRA' ? 'Barra arriba' : 'Campana'} ·{' '}
                        {fila.planes.length ? fila.planes.map((p) => PLANES[p].nombre).join(', ') : 'todos'}
                        {fila.hasta && ` · hasta ${fecha(fila.hasta)}`}
                      </span>
                    </span>
                    <Etiqueta tono={!fila.activo || vencido ? 'neutro' : 'verde'}>{!fila.activo ? 'Apagado' : vencido ? 'Terminado' : 'Visible'}</Etiqueta>
                    {escribe && (
                      <>
                        <button
                          type="button"
                          aria-label="Editar"
                          onClick={() => setAnuncio({ id: fila.id, datos: { ...fila } })}
                          className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-white"
                        >
                          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          onClick={() =>
                            void confirmar({ titulo: '¿Eliminar el anuncio?', confirmar: 'Eliminar', peligro: true }).then(
                              async (ok) => {
                                if (!ok) return
                                await eliminarAnuncio(fila.id)
                                setAnuncios((lista) => lista?.filter((otro) => otro.id !== fila.id) ?? null)
                              },
                            )
                          }
                          className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-sitio-rojo"
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Desplegable>

        <Desplegable titulo="Novedades" resumen={novedades ? `${novedades.length} publicadas` : ''}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-sitio-tenue">El historial de cambios que las tiendas ven en su panel (“Nuevo: pagos con Bold”).</p>
            {escribe && (
              <BotonPanel onClick={() => setNovedad({ titulo: '', cuerpo: '', etiqueta: 'Nuevo' })}>
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                Nueva
              </BotonPanel>
            )}
          </div>
          {!novedades ? (
            <Cargando alto="h-20" />
          ) : novedades.length === 0 ? (
            <Vacio>Aún no hay novedades publicadas.</Vacio>
          ) : (
            <ul>
              {novedades.map((fila) => (
                <li key={fila.id} className="flex items-start gap-3 border-b border-sitio-borde py-3 last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px]">
                      {fila.etiqueta && <span className="mr-2 text-[11px] tracking-[0.1em] text-sitio-azul-claro uppercase">{fila.etiqueta}</span>}
                      {fila.titulo}
                    </span>
                    <span className="line-clamp-2 text-[12px] text-sitio-tenue">{fila.cuerpo}</span>
                    <span className="text-[11px] text-sitio-tenue">{fecha(fila.publicadaEn)}</span>
                  </span>
                  {escribe && (
                    <>
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => setNovedad({ id: fila.id, titulo: fila.titulo, cuerpo: fila.cuerpo, etiqueta: fila.etiqueta })}
                        className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-white"
                      >
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() =>
                          void confirmar({ titulo: '¿Eliminar la novedad?', confirmar: 'Eliminar', peligro: true }).then(
                            async (ok) => {
                              if (!ok) return
                              await eliminarNovedad(fila.id)
                              setNovedades((lista) => lista?.filter((otra) => otra.id !== fila.id) ?? null)
                            },
                          )
                        }
                        className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-sitio-rojo"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable titulo="Plantillas de WhatsApp" resumen={plantillas ? `${plantillas.length} plantillas` : ''}>
          <p className="mb-4 text-[13px] text-sitio-tenue">
            Aparecen en la ficha de cada tienda para escribirle con un clic. Usa <span className="font-mono">{'{nombre}'}</span>,{' '}
            <span className="font-mono">{'{tienda}'}</span> y <span className="font-mono">{'{plan}'}</span>.
          </p>
          {plantillas && (
            <div className="flex flex-col gap-4">
              {plantillas.map((plantilla, indice) => (
                <div key={indice} className="flex flex-col gap-2 rounded-lg border border-sitio-borde p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Campo
                        etiqueta="Título"
                        valor={plantilla.titulo}
                        alCambiar={(titulo) => setPlantillas(plantillas.map((otra, i) => (i === indice ? { ...otra, titulo } : otra)))}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Quitar plantilla"
                      onClick={() => setPlantillas(plantillas.filter((_, i) => i !== indice))}
                      className="grid h-[38px] w-9 place-items-center text-sitio-tenue hover:text-sitio-rojo"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CampoArea
                    etiqueta="Mensaje"
                    valor={plantilla.texto}
                    alCambiar={(texto) => setPlantillas(plantillas.map((otra, i) => (i === indice ? { ...otra, texto } : otra)))}
                    filas={3}
                    maximo={1000}
                  />
                </div>
              ))}
              {escribe && (
                <div className="flex gap-2">
                  <BotonPanel onClick={() => setPlantillas([...plantillas, { titulo: 'Nueva', texto: 'Hola {nombre}, ' }])}>
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                    Agregar
                  </BotonPanel>
                  <BotonPanel
                    variante="primario"
                    onClick={() =>
                      void guardarPlantillasWhatsapp(plantillas)
                        .then(() => avisar('Plantillas guardadas'))
                        .catch(fallar)
                    }
                  >
                    Guardar plantillas
                  </BotonPanel>
                </div>
              )}
            </div>
          )}
        </Desplegable>

        <Desplegable titulo="Correos automáticos" resumen={correos ? (correos.configurado ? 'Configurados' : 'Falta el SMTP') : ''}>
          {!correos ? (
            <Cargando alto="h-20" />
          ) : (
            <div className="flex flex-col gap-4">
              {!correos.configurado && (
                <Aviso tono="nota">
                  Para enviar correos llena SMTP_HOST, SMTP_USUARIO y SMTP_CLAVE en backend/.env del servidor (con Gmail sirve una contraseña de
                  aplicación). Mientras tanto no se envía nada.
                </Aviso>
              )}
              {(
                [
                  ['bienvenida', 'Bienvenida al crear la tienda'],
                  ['vencePronto', 'Aviso 3 días antes de que venza el plan'],
                  ['teExtranamos', '“Te extrañamos” si no entra en 3 semanas'],
                ] as const
              ).map(([clave, texto]) => (
                <Interruptor
                  key={clave}
                  activo={correos.ajustes[clave]}
                  alCambiar={(activo) => {
                    if (!dueno) return
                    const ajustes = { ...correos.ajustes, [clave]: activo }
                    setCorreos({ ...correos, ajustes })
                    void guardarCorreos(ajustes).catch(fallar)
                  }}
                >
                  {texto}
                  <span className="ml-2 text-[11.5px] text-sitio-tenue">{correos.enviados[clave] ?? 0} enviados</span>
                </Interruptor>
              ))}
              {dueno && correos.configurado && (
                <BotonPanel className="self-start" onClick={() => void probarCorreo().then(() => avisar(`Te mandamos un correo a ${admin.email}`)).catch(fallar)}>
                  Enviarme un correo de prueba
                </BotonPanel>
              )}
            </div>
          )}
        </Desplegable>
      </div>

      <AnimatePresence>
        {anuncio && (
          <ModalPanel titulo={anuncio.id ? 'Editar anuncio' : 'Nuevo anuncio'} alCerrar={() => setAnuncio(null)}>
            <div className="flex flex-col gap-4">
              <Segmentado
                opciones={[
                  { valor: 'CAMPANA', etiqueta: 'En la campana' },
                  { valor: 'BARRA', etiqueta: 'Barra arriba' },
                ]}
                valor={anuncio.datos.tipo}
                alCambiar={(tipo) => setAnuncio({ ...anuncio, datos: { ...anuncio.datos, tipo } })}
              />
              <Campo etiqueta="Título" valor={anuncio.datos.titulo} alCambiar={(titulo) => setAnuncio({ ...anuncio, datos: { ...anuncio.datos, titulo } })} maximo={120} />
              <CampoArea etiqueta="Texto (opcional)" valor={anuncio.datos.cuerpo} alCambiar={(cuerpo) => setAnuncio({ ...anuncio, datos: { ...anuncio.datos, cuerpo } })} maximo={1000} />
              <SelectorPlanes valor={anuncio.datos.planes} alCambiar={(planes) => setAnuncio({ ...anuncio, datos: { ...anuncio.datos, planes } })} />
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] text-sitio-suave">Visible hasta (opcional)</span>
                <input
                  type="date"
                  value={anuncio.datos.hasta?.slice(0, 10) ?? ''}
                  onChange={(evento) =>
                    setAnuncio({ ...anuncio, datos: { ...anuncio.datos, hasta: evento.target.value ? new Date(`${evento.target.value}T23:59:59`).toISOString() : null } })
                  }
                  className={CLASES_ENTRADA}
                />
              </label>
              <Interruptor activo={anuncio.datos.activo} alCambiar={(activo) => setAnuncio({ ...anuncio, datos: { ...anuncio.datos, activo } })}>
                Visible
              </Interruptor>
              <BotonPanel variante="primario" className="self-start" onClick={() => void guardarElAnuncio()}>
                Publicar anuncio
              </BotonPanel>
            </div>
          </ModalPanel>
        )}
        {novedad && (
          <ModalPanel titulo={novedad.id ? 'Editar novedad' : 'Nueva novedad'} alCerrar={() => setNovedad(null)}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <Campo etiqueta="Título" valor={novedad.titulo} alCambiar={(titulo) => setNovedad({ ...novedad, titulo })} maximo={120} />
                <Campo etiqueta="Etiqueta" valor={novedad.etiqueta ?? ''} alCambiar={(etiqueta) => setNovedad({ ...novedad, etiqueta: etiqueta || null })} marcador="Nuevo" maximo={24} />
              </div>
              <CampoArea etiqueta="Qué cambió" valor={novedad.cuerpo} alCambiar={(cuerpo) => setNovedad({ ...novedad, cuerpo })} filas={5} maximo={3000} />
              <BotonPanel variante="primario" className="self-start" onClick={() => void guardarLaNovedad()}>
                Publicar novedad
              </BotonPanel>
            </div>
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}
