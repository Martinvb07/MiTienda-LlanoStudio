'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  eliminarArticulo,
  guardarArticulo,
  guardarTextos,
  leerTextos,
  listarArticulos,
  type ArticuloAdmin,
  type DatosArticulo,
  type SesionAdmin,
  type TextosWeb,
} from '@/servicios/admin'
import { generarSlug } from '@/utilidades/formato'
import { Aviso, BotonPanel, Campo, CampoArea, Etiqueta, Interruptor } from '../panel/ui/basicos'
import { ModalPanel } from '../panel/ui/flotantes'
import { confirmar } from '../panel/ui/confirmar'
import { Cargando, Desplegable, TituloSeccion, Vacio, fecha } from './ui'

const ARTICULO_VACIO: DatosArticulo = {
  slug: '',
  titulo: '',
  categoria: 'Consejos',
  resumen: '',
  portada: '/fotos/lana-2.webp',
  minutos: 4,
  secciones: [{ parrafos: [''] }],
  publicado: true,
  fecha: new Date().toISOString(),
}

/**
 * El cuerpo se escribe como texto plano: "## " abre una sección con título,
 * "- " hace una lista y una línea en blanco separa párrafos.
 */
function seccionesATexto(secciones: DatosArticulo['secciones']) {
  return secciones
    .map((seccion) =>
      [seccion.titulo ? `## ${seccion.titulo}` : '', ...seccion.parrafos, ...(seccion.lista ?? []).map((punto) => `- ${punto}`)]
        .filter(Boolean)
        .join('\n\n'),
    )
    .join('\n\n')
}

function textoASecciones(texto: string): DatosArticulo['secciones'] {
  const secciones: DatosArticulo['secciones'] = [{ parrafos: [] }]
  for (const bloque of texto.split(/\n\s*\n/).map((parte) => parte.trim()).filter(Boolean)) {
    const actual = secciones.at(-1)!
    if (bloque.startsWith('## ')) {
      secciones.push({ titulo: bloque.slice(3).trim(), parrafos: [] })
    } else if (bloque.split('\n').every((linea) => linea.trim().startsWith('- '))) {
      actual.lista = [...(actual.lista ?? []), ...bloque.split('\n').map((linea) => linea.trim().slice(2))]
    } else {
      actual.parrafos.push(bloque.replace(/\n/g, ' '))
    }
  }
  return secciones.filter((seccion) => seccion.titulo || seccion.parrafos.length || seccion.lista?.length)
}

function ListaEditable<T extends Record<string, string | undefined>>({
  filas,
  campos,
  nueva,
  alCambiar,
  nombre,
}: {
  filas: T[]
  campos: { clave: keyof T & string; etiqueta: string; largo?: boolean }[]
  nueva: T
  alCambiar: (filas: T[]) => void
  nombre: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {filas.map((fila, indice) => (
        <div key={indice} className="relative flex flex-col gap-2 rounded-lg border border-sitio-borde p-3 pr-11">
          {campos.map((campo) =>
            campo.largo ? (
              <CampoArea
                key={campo.clave}
                etiqueta={campo.etiqueta}
                valor={fila[campo.clave] ?? ''}
                alCambiar={(valor) => alCambiar(filas.map((otra, i) => (i === indice ? { ...otra, [campo.clave]: valor } : otra)))}
                filas={2}
              />
            ) : (
              <Campo
                key={campo.clave}
                etiqueta={campo.etiqueta}
                valor={fila[campo.clave] ?? ''}
                alCambiar={(valor) => alCambiar(filas.map((otra, i) => (i === indice ? { ...otra, [campo.clave]: valor } : otra)))}
              />
            ),
          )}
          <button
            type="button"
            aria-label={`Quitar ${nombre}`}
            onClick={() => alCambiar(filas.filter((_, i) => i !== indice))}
            className="absolute top-3 right-3 grid h-7 w-7 place-items-center text-sitio-tenue hover:text-sitio-rojo"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <BotonPanel className="self-start" onClick={() => alCambiar([...filas, { ...nueva }])}>
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Agregar {nombre}
      </BotonPanel>
    </div>
  )
}

/** Blog, preguntas de la página de precios, testimonios y respuestas rápidas del chat. */
export function SeccionContenido({ admin }: { admin: SesionAdmin }) {
  const escribe = admin.rol !== 'LECTURA'
  const [articulos, setArticulos] = useState<ArticuloAdmin[] | null>(null)
  const [textos, setTextos] = useState<TextosWeb | null>(null)
  const [editando, setEditando] = useState<{ datos: DatosArticulo; cuerpo: string; id?: string } | null>(null)
  const [error, setError] = useState('')
  const [nota, setNota] = useState('')

  useEffect(() => {
    listarArticulos().then(setArticulos).catch((e: Error) => setError(e.message))
    leerTextos().then(setTextos).catch((e: Error) => setError(e.message))
  }, [])

  async function guardarElArticulo() {
    if (!editando) return
    try {
      const datos = { ...editando.datos, slug: editando.datos.slug || generarSlug(editando.datos.titulo), secciones: textoASecciones(editando.cuerpo) }
      const guardado = await guardarArticulo(datos, editando.id)
      setArticulos((lista) => (editando.id ? (lista ?? []).map((otro) => (otro.id === guardado.id ? guardado : otro)) : [guardado, ...(lista ?? [])]))
      setEditando(null)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    }
  }

  async function guardarLosTextos() {
    if (!textos) return
    try {
      await guardarTextos(textos)
      setNota('Textos guardados: se ven en la web en menos de un minuto.')
      setTimeout(() => setNota(''), 2500)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    }
  }

  return (
    <>
      <TituloSeccion titulo="Contenido" descripcion="Lo que se lee en la web: blog, preguntas, testimonios y el chat de ayuda." />
      <AnimatePresence>{error && <div className="mb-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>
      {nota && <p className="mb-3 text-[12.5px] text-sitio-verde">{nota}</p>}

      <div className="flex flex-col gap-2.5">
        <Desplegable titulo="Blog" resumen={articulos ? `${articulos.length} artículos propios` : ''} abierto>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-sitio-tenue">
              Los artículos que escribas aquí se suman a los que ya trae la web. Si usas la misma dirección de uno existente, lo reemplaza.
            </p>
            {escribe && (
              <BotonPanel onClick={() => setEditando({ datos: ARTICULO_VACIO, cuerpo: '' })}>
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                Escribir
              </BotonPanel>
            )}
          </div>
          {!articulos ? (
            <Cargando alto="h-20" />
          ) : articulos.length === 0 ? (
            <Vacio>Aún no escribes artículos desde aquí.</Vacio>
          ) : (
            <ul>
              {articulos.map((articulo) => (
                <li key={articulo.id} className="flex items-center gap-3 border-b border-sitio-borde py-3 last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px]">{articulo.titulo}</span>
                    <span className="text-[11.5px] text-sitio-tenue">
                      /blog/{articulo.slug} · {articulo.categoria} · {fecha(articulo.fecha)}
                    </span>
                  </span>
                  <Etiqueta tono={articulo.publicado ? 'verde' : 'neutro'}>{articulo.publicado ? 'Publicado' : 'Borrador'}</Etiqueta>
                  {escribe && (
                    <>
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => setEditando({ id: articulo.id, datos: { ...articulo }, cuerpo: seccionesATexto(articulo.secciones) })}
                        className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-white"
                      >
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() =>
                          void confirmar({ titulo: `¿Eliminar "${articulo.titulo}"?`, confirmar: 'Eliminar', peligro: true }).then(async (ok) => {
                            if (!ok) return
                            await eliminarArticulo(articulo.id)
                            setArticulos((lista) => lista?.filter((otro) => otro.id !== articulo.id) ?? null)
                          })
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

        {!textos ? (
          <Cargando alto="h-24" />
        ) : (
          <>
            <Desplegable
              titulo="Preguntas de la página de precios"
              resumen={textos.preguntasPrecios.length ? `${textos.preguntasPrecios.length} preguntas` : 'Las de fábrica'}
            >
              <p className="mb-4 text-[13px] text-sitio-tenue">Si dejas la lista vacía, la página usa las preguntas que trae por defecto.</p>
              <ListaEditable
                filas={textos.preguntasPrecios}
                campos={[
                  { clave: 'pregunta', etiqueta: 'Pregunta' },
                  { clave: 'respuesta', etiqueta: 'Respuesta', largo: true },
                ]}
                nueva={{ pregunta: '', respuesta: '' }}
                alCambiar={(preguntasPrecios) => setTextos({ ...textos, preguntasPrecios })}
                nombre="pregunta"
              />
            </Desplegable>

            <Desplegable titulo="Testimonios" resumen={textos.testimonios.length ? `${textos.testimonios.length}` : 'Ninguno'}>
              <p className="mb-4 text-[13px] text-sitio-tenue">Salen en la página de inicio cuando hay al menos uno. Usa tiendas reales y con permiso.</p>
              <ListaEditable
                filas={textos.testimonios}
                campos={[
                  { clave: 'nombre', etiqueta: 'Nombre' },
                  { clave: 'tienda', etiqueta: 'Tienda' },
                  { clave: 'texto', etiqueta: 'Lo que dijo', largo: true },
                  { clave: 'foto', etiqueta: 'Foto (URL, opcional)' },
                ]}
                nueva={{ nombre: '', tienda: '', texto: '', foto: '' }}
                alCambiar={(testimonios) => setTextos({ ...textos, testimonios })}
                nombre="testimonio"
              />
            </Desplegable>

            <Desplegable titulo="Respuestas rápidas del chat" resumen={`${textos.opcionesSoporte.length} opciones`}>
              <p className="mb-4 text-[13px] text-sitio-tenue">
                Lo primero que ve quien abre el chat. Si ninguna le sirve, habla con un asesor.
              </p>
              <ListaEditable
                filas={textos.opcionesSoporte}
                campos={[
                  { clave: 'pregunta', etiqueta: 'Pregunta' },
                  { clave: 'respuesta', etiqueta: 'Respuesta', largo: true },
                  { clave: 'enlace', etiqueta: 'Enlace (opcional, p. ej. /precios)' },
                ]}
                nueva={{ pregunta: '', respuesta: '', enlace: '' }}
                alCambiar={(opcionesSoporte) => setTextos({ ...textos, opcionesSoporte })}
                nombre="respuesta"
              />
            </Desplegable>

            {escribe && (
              <BotonPanel variante="primario" className="self-start" onClick={() => void guardarLosTextos()}>
                Guardar textos de la web
              </BotonPanel>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {editando && (
          <ModalPanel titulo={editando.id ? 'Editar artículo' : 'Nuevo artículo'} alCerrar={() => setEditando(null)}>
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
              <Campo
                etiqueta="Título"
                valor={editando.datos.titulo}
                alCambiar={(titulo) =>
                  setEditando({ ...editando, datos: { ...editando.datos, titulo, slug: editando.id ? editando.datos.slug : generarSlug(titulo) } })
                }
                maximo={160}
              />
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Dirección (/blog/…)" valor={editando.datos.slug} alCambiar={(slug) => setEditando({ ...editando, datos: { ...editando.datos, slug: generarSlug(slug) } })} />
                <Campo etiqueta="Categoría" valor={editando.datos.categoria} alCambiar={(categoria) => setEditando({ ...editando, datos: { ...editando.datos, categoria } })} />
              </div>
              <CampoArea etiqueta="Resumen" valor={editando.datos.resumen} alCambiar={(resumen) => setEditando({ ...editando, datos: { ...editando.datos, resumen } })} filas={2} maximo={400} />
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <Campo etiqueta="Portada (URL de la imagen)" valor={editando.datos.portada} alCambiar={(portada) => setEditando({ ...editando, datos: { ...editando.datos, portada } })} />
                <Campo
                  etiqueta="Minutos"
                  tipo="number"
                  valor={editando.datos.minutos}
                  alCambiar={(minutos) => setEditando({ ...editando, datos: { ...editando.datos, minutos: Number(minutos) || 1 } })}
                />
              </div>
              <CampoArea
                etiqueta="Texto: “## ” para un subtítulo, “- ” para listas y una línea en blanco entre párrafos"
                valor={editando.cuerpo}
                alCambiar={(cuerpo) => setEditando({ ...editando, cuerpo })}
                filas={12}
              />
              <Interruptor activo={editando.datos.publicado} alCambiar={(publicado) => setEditando({ ...editando, datos: { ...editando.datos, publicado } })}>
                Publicado
              </Interruptor>
              <BotonPanel variante="primario" className="self-start" onClick={() => void guardarElArticulo()}>
                Guardar artículo
              </BotonPanel>
            </div>
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}
