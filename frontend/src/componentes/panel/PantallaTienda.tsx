'use client'

import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'motion/react'
import { listarProductos, obtenerTienda } from '@/servicios/panel'
import { ETIQUETAS_BLOQUE } from '@/tipos/bloques'
import type { Producto, Tienda } from '@/tipos/tienda'
import { urlTienda } from '@/utilidades/dominios'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { ESTILOS_PREDEFINIDOS } from '@/utilidades/tema'
import { CabeceraPanel } from './CabeceraPanel'
import { EditorTienda } from './editor/EditorTienda'
import { VistaPrevia } from './editor/VistaPrevia'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, Etiqueta } from './ui/basicos'

/** "Mi sitio": cómo se ve hoy, sus datos, y la entrada al editor. */
export function PantallaTienda() {
  const router = useRouter()
  const parametros = useSearchParams()
  const { recargar } = useSesion()
  const [datos, setDatos] = useState<{ tienda: Tienda; subdominio: string } | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(parametros.get('editar') === '1')

  useEffect(() => {
    obtenerTienda()
      .then(setDatos)
      .catch((problema: Error) => setError(problema.message))
    listarProductos()
      .then((lista) => setProductos(lista.filter((producto) => producto.activo)))
      .catch(() => setProductos([]))
  }, [])

  const datosVista = useMemo(
    () =>
      datos && {
        tienda: { ...datos.tienda, tema: datos.tienda.tema },
        productos,
        vista: 'tienda' as const,
      },
    [datos, productos],
  )

  function cerrarEditor() {
    setEditando(false)
    if (parametros.get('editar')) router.replace('/panel/plantillas')
  }

  if (error) return <Aviso>{error}</Aviso>
  if (!datos || !datosVista) {
    return <div className="brillo h-[560px] rounded-[14px] border border-sitio-borde" />
  }

  const { tienda, subdominio } = datos
  const estilo =
    ESTILOS_PREDEFINIDOS.find((opcion) => opcion.clave === tienda.plantilla)?.nombre ??
    PLANTILLAS_TIENDA.find((opcion) => opcion.clave === tienda.plantilla)?.nombre ??
    'Personalizado'
  const secciones = tienda.configuracionBloques.filter((bloque) => bloque.visible !== false)

  return (
    <>
      <CabeceraPanel
        titulo="Mi sitio"
        descripcion="Diseña tu página con secciones, cambia colores y letras, y mira el resultado en vivo."
        accion={
          <BotonPanel variante="primario" onClick={() => setEditando(true)} className="h-10 px-5">
            Editar tienda
          </BotonPanel>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="group relative h-[560px] overflow-hidden rounded-[14px] border border-sitio-borde text-left"
          aria-label="Abrir el editor"
        >
          <div className="pointer-events-none grid h-full">
            <VistaPrevia datos={datosVista} dispositivo="escritorio" />
          </div>
          <span className="absolute inset-0 grid place-items-center bg-black/55 text-xs tracking-[0.1em] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Abrir editor
          </span>
        </button>

        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-medium">Estado</h2>
              <Etiqueta tono={tienda.publicada ? 'verde' : 'ambar'}>
                {tienda.publicada ? 'Publicada' : 'Borrador'}
              </Etiqueta>
            </div>
            <a
              href={urlTienda(subdominio)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block truncate font-mono text-[12px] text-sitio-azul-claro hover:underline"
            >
              {urlTienda(subdominio).replace(/^https?:\/\//, '')} <ArrowUpRight aria-hidden="true" className="inline h-3 w-3 align-[-1px]" />
            </a>
            {!tienda.publicada && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-sitio-tenue">
                Cuando esté lista, actívala en el editor, sección Publicación.
              </p>
            )}
          </div>

          <div className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5">
            <h2 className="text-[15px] font-medium">Página</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-sitio-tenue">Estilo</dt>
                <dd>{estilo}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-sitio-tenue">Productos visibles</dt>
                <dd>{productos.length}</dd>
              </div>
            </dl>
            <ol className="mt-4 space-y-1.5 border-t border-sitio-borde pt-4">
              {secciones.map((bloque, indice) => (
                <li key={bloque.id} className="flex items-center gap-2.5 text-[12.5px] text-sitio-suave">
                  <span className="w-5 font-mono text-[11px] text-sitio-tenue">
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                  {ETIQUETAS_BLOQUE[bloque.tipo]}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editando && (
          <EditorTienda
            tienda={tienda}
            subdominio={subdominio}
            plantillaInicial={parametros.get('plantilla')}
            alCerrar={cerrarEditor}
            alGuardar={(guardada) => {
              setDatos({ tienda: guardada, subdominio })
              void recargar()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
