'use client'

import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { Bloque, DiapositivaCarrusel, ItemCategoria } from '@/tipos/bloques'
import { planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { Campo, CampoArea, Candado, Interruptor, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'

interface Props {
  bloque: Bloque
  /** Mezcla cambios en las props del bloque. */
  alCambiar: (cambios: Record<string, unknown>) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  limites: LimitesPlan
  /** Categorías que ya usan los productos, para sugerirlas. */
  categorias?: string[]
}

const nuevoId = () => Math.random().toString(36).slice(2, 10)

/**
 * Lista editable de elementos (diapositivas, categorías): cada uno en su
 * tarjeta, con subir, bajar y quitar, y un botón para agregar al final.
 */
function ListaEditable<T extends { id: string }>({
  elementos,
  alCambiar,
  crear,
  maximo,
  textoAgregar,
  titulo,
  children,
}: {
  elementos: T[]
  alCambiar: (elementos: T[]) => void
  crear: () => T
  maximo: number
  textoAgregar: string
  titulo: (elemento: T, indice: number) => string
  children: (elemento: T, cambiar: (cambios: Partial<T>) => void) => ReactNode
}) {
  function mover(indice: number, delta: number) {
    const copia = [...elementos]
    const [elemento] = copia.splice(indice, 1)
    copia.splice(indice + delta, 0, elemento!)
    alCambiar(copia)
  }
  const boton =
    'grid h-6 w-6 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30'

  return (
    <div className="flex flex-col gap-2">
      {elementos.map((elemento, indice) => (
        <div
          key={elemento.id}
          className="flex flex-col gap-2.5 rounded-[10px] border border-sitio-borde bg-white/[0.02] p-2.5"
        >
          <div className="flex items-center gap-1">
            <span className="flex-1 truncate text-[11.5px] text-sitio-suave">{titulo(elemento, indice)}</span>
            <button
              type="button"
              className={boton}
              disabled={indice === 0}
              onClick={() => mover(indice, -1)}
              aria-label="Subir"
            >
              <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={boton}
              disabled={indice === elementos.length - 1}
              onClick={() => mover(indice, 1)}
              aria-label="Bajar"
            >
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`${boton} hover:!text-red-300`}
              disabled={elementos.length <= 1}
              onClick={() => alCambiar(elementos.filter((otro) => otro.id !== elemento.id))}
              aria-label="Quitar"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          {children(elemento, (cambios) =>
            alCambiar(elementos.map((otro) => (otro.id === elemento.id ? { ...otro, ...cambios } : otro))),
          )}
        </div>
      ))}
      {elementos.length < maximo && (
        <button
          type="button"
          onClick={() => alCambiar([...elementos, crear()])}
          className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-sitio-borde text-[12px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          {textoAgregar}
        </button>
      )}
    </div>
  )
}

const ALINEACIONES = [
  { valor: 'izquierda', etiqueta: 'Izquierda' },
  { valor: 'centro', etiqueta: 'Centro' },
] as const

/** Los campos que edita cada tipo de sección. */
export function CamposBloque({ bloque, alCambiar, alError, alSubiendo, limites, categorias = [] }: Props) {
  const subida = { alError, alSubiendo }

  switch (bloque.tipo) {
    case 'anuncio':
      return (
        <>
          <Campo etiqueta="Texto" valor={bloque.props.texto} alCambiar={(texto) => alCambiar({ texto })} maximo={120} />
          <Campo
            etiqueta="Enlace (opcional)"
            valor={bloque.props.enlace ?? ''}
            alCambiar={(enlace) => alCambiar({ enlace })}
            marcador="#productos o https://…"
          />
        </>
      )

    case 'hero':
      return (
        <>
          <Campo
            etiqueta="Título"
            valor={bloque.props.titulo}
            alCambiar={(titulo) => alCambiar({ titulo })}
            maximo={90}
          />
          <CampoArea
            etiqueta="Subtítulo"
            valor={bloque.props.subtitulo ?? ''}
            alCambiar={(subtitulo) => alCambiar({ subtitulo })}
            filas={2}
            maximo={200}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Campo
              etiqueta="Texto del botón"
              valor={bloque.props.textoBoton ?? ''}
              alCambiar={(textoBoton) => alCambiar({ textoBoton })}
              marcador="Vacío = sin botón"
            />
            <Campo
              etiqueta="Enlace del botón"
              valor={bloque.props.enlaceBoton ?? ''}
              alCambiar={(enlaceBoton) => alCambiar({ enlaceBoton })}
              marcador="#productos"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Alineación</span>
            <Segmentado
              opciones={ALINEACIONES}
              valor={bloque.props.alineacion ?? 'centro'}
              alCambiar={(alineacion) => alCambiar({ alineacion })}
              chico
            />
          </div>
          <span className="text-[11.5px] text-sitio-suave">
            Imagen de fondo <small className="text-sitio-tenue">(opcional)</small>
          </span>
          <ZonaImagen
            url={bloque.props.imagenUrl}
            alCambiar={(imagenUrl) => alCambiar({ imagenUrl: imagenUrl ?? undefined })}
            {...subida}
          />
        </>
      )

    case 'carrusel':
      return (
        <>
          <ListaEditable
            elementos={bloque.props.diapositivas}
            alCambiar={(diapositivas) => alCambiar({ diapositivas })}
            crear={(): DiapositivaCarrusel => ({
              id: nuevoId(),
              titulo: 'Nuevo banner',
            })}
            maximo={limites.bannersCarrusel}
            textoAgregar={`Agregar banner (hasta ${limites.bannersCarrusel})`}
            titulo={(diapositiva, indice) => diapositiva.titulo || `Banner ${indice + 1}`}
          >
            {(diapositiva, cambiar) => (
              <>
                <ZonaImagen
                  url={diapositiva.imagenUrl}
                  alCambiar={(imagenUrl) => cambiar({ imagenUrl: imagenUrl ?? undefined })}
                  proporcion="aspect-[21/9]"
                  texto="Imagen del banner"
                  {...subida}
                />
                <Campo
                  etiqueta="Título"
                  valor={diapositiva.titulo ?? ''}
                  alCambiar={(titulo) => cambiar({ titulo })}
                  marcador="Vacío = sólo la imagen"
                  maximo={90}
                />
                <Campo
                  etiqueta="Subtítulo"
                  valor={diapositiva.subtitulo ?? ''}
                  alCambiar={(subtitulo) => cambiar({ subtitulo })}
                  maximo={160}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <Campo
                    etiqueta="Texto del botón"
                    valor={diapositiva.textoBoton ?? ''}
                    alCambiar={(textoBoton) => cambiar({ textoBoton })}
                    marcador="Vacío = sin botón"
                  />
                  <Campo
                    etiqueta="Enlace"
                    valor={diapositiva.enlaceBoton ?? ''}
                    alCambiar={(enlaceBoton) => cambiar({ enlaceBoton })}
                    marcador="#productos"
                  />
                </div>
              </>
            )}
          </ListaEditable>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-sitio-suave">Alto</span>
              <Segmentado
                opciones={[
                  { valor: 'bajo', etiqueta: 'Bajo' },
                  { valor: 'medio', etiqueta: 'Medio' },
                  { valor: 'alto', etiqueta: 'Alto' },
                ]}
                valor={bloque.props.alto ?? 'medio'}
                alCambiar={(alto) => alCambiar({ alto })}
                chico
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-sitio-suave">Pasa cada</span>
              <Segmentado
                opciones={[
                  { valor: '0', etiqueta: 'No', titulo: 'No avanza solo' },
                  { valor: '4', etiqueta: '4s' },
                  { valor: '6', etiqueta: '6s' },
                  { valor: '8', etiqueta: '8s' },
                ]}
                valor={String(bloque.props.intervalo ?? 5) as '0' | '4' | '6' | '8'}
                alCambiar={(intervalo) => alCambiar({ intervalo: Number(intervalo) })}
                chico
              />
            </div>
          </div>
        </>
      )

    case 'categorias':
      return (
        <>
          <Campo
            etiqueta="Título"
            valor={bloque.props.titulo ?? ''}
            alCambiar={(titulo) => alCambiar({ titulo })}
            marcador="Vacío = sin título"
          />
          <ListaEditable
            elementos={bloque.props.items}
            alCambiar={(items) => alCambiar({ items })}
            crear={(): ItemCategoria => ({ id: nuevoId(), nombre: '' })}
            maximo={limites.itemsCategorias}
            textoAgregar={`Agregar categoría (hasta ${limites.itemsCategorias})`}
            titulo={(item, indice) => item.nombre || `Categoría ${indice + 1}`}
          >
            {(item, cambiar) => (
              <div className="grid grid-cols-[72px_1fr] items-start gap-2.5">
                <ZonaImagen
                  url={item.imagenUrl}
                  alCambiar={(imagenUrl) => cambiar({ imagenUrl: imagenUrl ?? undefined })}
                  proporcion="aspect-square"
                  texto="Foto"
                  {...subida}
                />
                <Campo
                  etiqueta="Nombre"
                  valor={item.nombre}
                  alCambiar={(nombre) => cambiar({ nombre })}
                  lista={categorias}
                  maximo={40}
                  ayuda="Lleva a los productos con esta categoría."
                />
              </div>
            )}
          </ListaEditable>
        </>
      )

    case 'grilla-productos':
      return (
        <>
          <Campo
            etiqueta="Título"
            valor={bloque.props.titulo ?? ''}
            alCambiar={(titulo) => alCambiar({ titulo })}
            marcador="Vacío = sin título"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Campo
              etiqueta="Cuántos mostrar"
              tipo="number"
              min={1}
              valor={bloque.props.limite ?? 8}
              alCambiar={(limite) =>
                alCambiar({
                  limite: Math.min(48, Math.max(1, Number(limite) || 1)),
                })
              }
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-sitio-suave">Columnas</span>
              <Segmentado
                opciones={[
                  { valor: '2', etiqueta: '2' },
                  { valor: '3', etiqueta: '3' },
                  { valor: '4', etiqueta: '4' },
                  ...(limites.grillaAvanzada ? [{ valor: '5' as const, etiqueta: '5' }] : []),
                ]}
                valor={String(bloque.props.columnas ?? 3) as '2' | '3' | '4' | '5'}
                alCambiar={(columnas) => alCambiar({ columnas: Number(columnas) })}
                chico
              />
            </div>
          </div>
          {limites.grillaAvanzada ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] text-sitio-suave">Estilo de las tarjetas</span>
                <Segmentado
                  opciones={[
                    { valor: 'simple', etiqueta: 'Simple' },
                    {
                      valor: 'tarjeta',
                      etiqueta: 'Con borde y precio destacado',
                    },
                  ]}
                  valor={bloque.props.estilo ?? 'simple'}
                  alCambiar={(estilo) => alCambiar({ estilo })}
                  chico
                />
              </div>
              <Campo
                etiqueta="Sólo de la categoría"
                valor={bloque.props.categoria ?? ''}
                alCambiar={(categoria) => alCambiar({ categoria: categoria || undefined })}
                lista={categorias}
                marcador="Vacío = todos los productos"
              />
            </>
          ) : (
            <Candado plan={planMinimo((plan) => plan.grillaAvanzada)}>
              Tarjetas con borde, 5 columnas y productos de una sola categoría.
            </Candado>
          )}
          <p className="text-[11.5px] leading-relaxed text-sitio-tenue">
            Se muestran tus productos visibles, del más nuevo al más antiguo.
          </p>
        </>
      )

    case 'imagen-texto':
      return (
        <>
          <Campo
            etiqueta="Título"
            valor={bloque.props.titulo}
            alCambiar={(titulo) => alCambiar({ titulo })}
            maximo={90}
          />
          <CampoArea
            etiqueta="Texto"
            valor={bloque.props.contenido ?? ''}
            alCambiar={(contenido) => alCambiar({ contenido })}
            filas={4}
            maximo={800}
          />
          <ZonaImagen
            url={bloque.props.imagenUrl}
            alCambiar={(imagenUrl) => alCambiar({ imagenUrl: imagenUrl ?? undefined })}
            proporcion="aspect-[4/3]"
            {...subida}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Imagen a la</span>
            <Segmentado
              opciones={[
                { valor: 'izquierda', etiqueta: 'Izquierda' },
                { valor: 'derecha', etiqueta: 'Derecha' },
              ]}
              valor={bloque.props.lado ?? 'izquierda'}
              alCambiar={(lado) => alCambiar({ lado })}
              chico
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Campo
              etiqueta="Texto del botón"
              valor={bloque.props.textoBoton ?? ''}
              alCambiar={(textoBoton) => alCambiar({ textoBoton })}
              marcador="Vacío = sin botón"
            />
            <Campo
              etiqueta="Enlace del botón"
              valor={bloque.props.enlaceBoton ?? ''}
              alCambiar={(enlaceBoton) => alCambiar({ enlaceBoton })}
              marcador="#productos"
            />
          </div>
        </>
      )

    case 'texto':
      return (
        <>
          <Campo
            etiqueta="Título"
            valor={bloque.props.titulo ?? ''}
            alCambiar={(titulo) => alCambiar({ titulo })}
            marcador="Vacío = sin título"
          />
          <CampoArea
            etiqueta="Texto"
            valor={bloque.props.contenido}
            alCambiar={(contenido) => alCambiar({ contenido })}
            filas={6}
            maximo={2000}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Alineación</span>
            <Segmentado
              opciones={ALINEACIONES}
              valor={bloque.props.alineacion ?? 'izquierda'}
              alCambiar={(alineacion) => alCambiar({ alineacion })}
              chico
            />
          </div>
        </>
      )

    case 'pie':
      return (
        <>
          <Campo etiqueta="Texto" valor={bloque.props.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} />
          <Interruptor
            activo={bloque.props.mostrarRedes ?? false}
            alCambiar={(mostrarRedes) => alCambiar({ mostrarRedes })}
          >
            Mostrar redes
          </Interruptor>
          {bloque.props.mostrarRedes && (
            <div className="grid grid-cols-2 gap-2.5">
              <Campo
                etiqueta="Instagram"
                valor={bloque.props.instagram ?? ''}
                alCambiar={(instagram) => alCambiar({ instagram })}
                marcador="@tutienda"
              />
              <Campo
                etiqueta="WhatsApp"
                valor={bloque.props.whatsapp ?? ''}
                alCambiar={(whatsapp) => alCambiar({ whatsapp })}
                marcador="3001234567"
              />
            </div>
          )}
          {limites.quitarMarca ? (
            <Interruptor
              activo={bloque.props.ocultarMarca ?? false}
              alCambiar={(ocultarMarca) => alCambiar({ ocultarMarca })}
            >
              Quitar “Hecho con Mi Tienda”
            </Interruptor>
          ) : (
            <Candado plan={planMinimo((plan) => plan.quitarMarca)}>Quitar “Hecho con Mi Tienda” del pie.</Candado>
          )}
        </>
      )

    default:
      return null
  }
}

/** Línea secundaria de cada fila de la lista: lo más reconocible del bloque. */
export function resumenBloque(bloque: Bloque): string {
  switch (bloque.tipo) {
    case 'anuncio':
      return bloque.props.texto
    case 'hero':
    case 'imagen-texto':
      return bloque.props.titulo
    case 'carrusel':
      return `${bloque.props.diapositivas.length} banners`
    case 'categorias':
      return bloque.props.items
        .map((item) => item.nombre)
        .filter(Boolean)
        .join(', ')
    case 'grilla-productos':
      return bloque.props.titulo || `${bloque.props.limite ?? 8} productos`
    case 'texto':
      return bloque.props.titulo || bloque.props.contenido
    case 'pie':
      return bloque.props.texto ?? ''
    default:
      return ''
  }
}
