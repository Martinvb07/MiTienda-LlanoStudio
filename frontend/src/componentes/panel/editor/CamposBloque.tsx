'use client'

import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type {
  BannerPromo,
  Bloque,
  DiapositivaCarrusel,
  ImagenGaleria,
  ItemCategoria,
  ItemColumna,
  LogoMarca,
  Pregunta,
  Testimonio,
} from '@/tipos/bloques'
import { planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { CLASES_ENTRADA, Campo, CampoArea, Candado, Interruptor, Segmentado } from '../ui/basicos'
import { CamposLienzo } from './CamposLienzo'
import { CamposEquipo, CamposHorario, CamposServicios } from './CamposNegocio'
import { ZonaImagen } from '../ui/imagenes'
import { ICONOS_BLOQUE, claveIcono } from '@/componentes/comunes/IconoBloque'
import { cn } from '@/utilidades/clases'

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
export function ListaEditable<T extends { id: string }>({
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
          <Interruptor activo={bloque.props.soloDestacados ?? false} alCambiar={(soloDestacados) => alCambiar({ soloDestacados })}>
            Sólo los destacados
            <small className="block text-[11.5px] text-sitio-tenue">Marca productos como destacados al editarlos.</small>
          </Interruptor>
          <p className="text-[11.5px] leading-relaxed text-sitio-tenue">
            Se muestran tus productos visibles: primero los destacados, luego del más nuevo al más antiguo.
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
              Quitar “Hecho con Mi Sitio”
            </Interruptor>
          ) : (
            <Candado plan={planMinimo((plan) => plan.quitarMarca)}>Quitar “Hecho con Mi Sitio” del pie.</Candado>
          )}
        </>
      )

    case 'columnas':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <Campo etiqueta="Bajada" valor={bloque.props.subtitulo ?? ''} alCambiar={(subtitulo) => alCambiar({ subtitulo })} />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-sitio-suave">Columnas</span>
              <Segmentado
                opciones={[
                  { valor: '2', etiqueta: '2' },
                  { valor: '3', etiqueta: '3' },
                  { valor: '4', etiqueta: '4' },
                ]}
                valor={String(bloque.props.columnas ?? 3) as '2' | '3' | '4'}
                alCambiar={(columnas) => alCambiar({ columnas: Number(columnas) })}
                chico
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-sitio-suave">Alineación</span>
              <Segmentado opciones={ALINEACIONES} valor={bloque.props.alineacion ?? 'centro'} alCambiar={(alineacion) => alCambiar({ alineacion })} chico />
            </div>
          </div>
          <ListaEditable
            elementos={bloque.props.items}
            alCambiar={(items) => alCambiar({ items })}
            crear={(): ItemColumna => ({ id: nuevoId(), icono: 'brillo', titulo: 'Nuevo beneficio' })}
            maximo={limites.itemsLista}
            textoAgregar={`Agregar columna (hasta ${limites.itemsLista})`}
            titulo={(item, indice) => item.titulo || `Columna ${indice + 1}`}
          >
            {(item, cambiar) => (
              <>
                <Campo etiqueta="Título" valor={item.titulo} alCambiar={(titulo) => cambiar({ titulo })} maximo={60} />
                <SelectorIcono valor={item.icono} alCambiar={(icono) => cambiar({ icono })} />
                <CampoArea etiqueta="Texto" valor={item.texto ?? ''} alCambiar={(texto) => cambiar({ texto })} filas={2} maximo={240} />
                <ZonaImagen
                  url={item.imagenUrl}
                  alCambiar={(imagenUrl) => cambiar({ imagenUrl: imagenUrl ?? undefined })}
                  proporcion="aspect-[4/3]"
                  texto="Foto en vez de ícono (opcional)"
                  {...subida}
                />
              </>
            )}
          </ListaEditable>
        </>
      )

    case 'galeria':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Disposición</span>
            <Segmentado
              opciones={[
                { valor: 'cuadricula', etiqueta: 'Cuadrícula' },
                { valor: 'mosaico', etiqueta: 'Mosaico' },
                { valor: 'tira', etiqueta: 'Tira' },
              ]}
              valor={bloque.props.disposicion ?? 'cuadricula'}
              alCambiar={(disposicion) => alCambiar({ disposicion })}
              chico
            />
          </div>
          {bloque.props.disposicion !== 'tira' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11.5px] text-sitio-suave">Columnas</span>
              <Segmentado
                opciones={[
                  { valor: '2', etiqueta: '2' },
                  { valor: '3', etiqueta: '3' },
                  { valor: '4', etiqueta: '4' },
                ]}
                valor={String(bloque.props.columnas ?? 3) as '2' | '3' | '4'}
                alCambiar={(columnas) => alCambiar({ columnas: Number(columnas) })}
                chico
              />
            </div>
          )}
          <ListaEditable
            elementos={bloque.props.imagenes}
            alCambiar={(imagenes) => alCambiar({ imagenes })}
            crear={(): ImagenGaleria => ({ id: nuevoId() })}
            maximo={limites.itemsLista}
            textoAgregar={`Agregar foto (hasta ${limites.itemsLista})`}
            titulo={(_, indice) => `Foto ${indice + 1}`}
          >
            {(imagen, cambiar) => (
              <div className="grid grid-cols-[88px_1fr] items-start gap-2.5">
                <ZonaImagen url={imagen.url} alCambiar={(url) => cambiar({ url: url ?? undefined })} proporcion="aspect-square" texto="Foto" {...subida} />
                <Campo etiqueta="Enlace (opcional)" valor={imagen.enlace ?? ''} alCambiar={(enlace) => cambiar({ enlace })} marcador="#productos" />
              </div>
            )}
          </ListaEditable>
        </>
      )

    case 'video':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <Campo
            etiqueta="Enlace del video"
            valor={bloque.props.url}
            alCambiar={(url) => alCambiar({ url })}
            marcador="https://youtube.com/watch?v=…"
            ayuda="YouTube (también Shorts) o Vimeo."
          />
          <CampoArea etiqueta="Texto (opcional)" valor={bloque.props.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} filas={2} maximo={240} />
        </>
      )

    case 'testimonios':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <ListaEditable
            elementos={bloque.props.items}
            alCambiar={(items) => alCambiar({ items })}
            crear={(): Testimonio => ({ id: nuevoId(), nombre: 'Cliente', texto: '¡Excelente!', estrellas: 5 })}
            maximo={limites.itemsLista}
            textoAgregar={`Agregar testimonio (hasta ${limites.itemsLista})`}
            titulo={(item, indice) => item.nombre || `Testimonio ${indice + 1}`}
          >
            {(item, cambiar) => (
              <>
                <CampoArea etiqueta="Lo que dijo" valor={item.texto} alCambiar={(texto) => cambiar({ texto })} filas={3} maximo={400} />
                <div className="grid grid-cols-2 gap-2.5">
                  <Campo etiqueta="Nombre" valor={item.nombre} alCambiar={(nombre) => cambiar({ nombre })} maximo={40} />
                  <Campo etiqueta="Ciudad o detalle" valor={item.detalle ?? ''} alCambiar={(detalle) => cambiar({ detalle })} maximo={40} />
                </div>
                <div className="grid grid-cols-[72px_1fr] items-start gap-2.5">
                  <ZonaImagen
                    url={item.fotoUrl}
                    alCambiar={(fotoUrl) => cambiar({ fotoUrl: fotoUrl ?? undefined })}
                    proporcion="aspect-square"
                    texto="Foto"
                    {...subida}
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] text-sitio-suave">Estrellas</span>
                    <Segmentado
                      opciones={[
                        { valor: '0', etiqueta: 'No' },
                        { valor: '3', etiqueta: '3' },
                        { valor: '4', etiqueta: '4' },
                        { valor: '5', etiqueta: '5' },
                      ]}
                      valor={String(item.estrellas ?? 0) as '0' | '3' | '4' | '5'}
                      alCambiar={(estrellas) => cambiar({ estrellas: Number(estrellas) })}
                      chico
                    />
                  </div>
                </div>
              </>
            )}
          </ListaEditable>
        </>
      )

    case 'preguntas':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <ListaEditable
            elementos={bloque.props.items}
            alCambiar={(items) => alCambiar({ items })}
            crear={(): Pregunta => ({ id: nuevoId(), pregunta: '¿Nueva pregunta?', respuesta: '' })}
            maximo={limites.itemsLista}
            textoAgregar={`Agregar pregunta (hasta ${limites.itemsLista})`}
            titulo={(item, indice) => item.pregunta || `Pregunta ${indice + 1}`}
          >
            {(item, cambiar) => (
              <>
                <Campo etiqueta="Pregunta" valor={item.pregunta} alCambiar={(pregunta) => cambiar({ pregunta })} maximo={140} />
                <CampoArea etiqueta="Respuesta" valor={item.respuesta} alCambiar={(respuesta) => cambiar({ respuesta })} filas={3} maximo={800} />
              </>
            )}
          </ListaEditable>
        </>
      )

    case 'cuenta-regresiva':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo} alCambiar={(titulo) => alCambiar({ titulo })} maximo={80} />
          <Campo etiqueta="Bajada" valor={bloque.props.subtitulo ?? ''} alCambiar={(subtitulo) => alCambiar({ subtitulo })} maximo={160} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] text-sitio-suave" htmlFor={`fecha-${bloque.id}`}>
              Termina el
            </label>
            <input
              id={`fecha-${bloque.id}`}
              type="datetime-local"
              value={bloque.props.fecha}
              onChange={(evento) => alCambiar({ fecha: evento.target.value })}
              className={CLASES_ENTRADA}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Campo etiqueta="Texto del botón" valor={bloque.props.textoBoton ?? ''} alCambiar={(textoBoton) => alCambiar({ textoBoton })} marcador="Vacío = sin botón" />
            <Campo etiqueta="Enlace" valor={bloque.props.enlaceBoton ?? ''} alCambiar={(enlaceBoton) => alCambiar({ enlaceBoton })} marcador="#productos" />
          </div>
          <Campo
            etiqueta="Al terminar dice"
            valor={bloque.props.textoFinal ?? ''}
            alCambiar={(textoFinal) => alCambiar({ textoFinal })}
            maximo={120}
          />
        </>
      )

    case 'logos':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <Interruptor activo={bloque.props.animado ?? false} alCambiar={(animado) => alCambiar({ animado })}>
            Pasan en una cinta animada
          </Interruptor>
          <ListaEditable
            elementos={bloque.props.items}
            alCambiar={(items) => alCambiar({ items })}
            crear={(): LogoMarca => ({ id: nuevoId(), nombre: 'Marca' })}
            maximo={limites.itemsLista}
            textoAgregar={`Agregar marca (hasta ${limites.itemsLista})`}
            titulo={(item, indice) => item.nombre || `Marca ${indice + 1}`}
          >
            {(item, cambiar) => (
              <div className="grid grid-cols-[88px_1fr] items-start gap-2.5">
                <ZonaImagen
                  url={item.imagenUrl}
                  alCambiar={(imagenUrl) => cambiar({ imagenUrl: imagenUrl ?? undefined })}
                  proporcion="aspect-[3/2]"
                  texto="Logo"
                  {...subida}
                />
                <Campo etiqueta="Nombre" valor={item.nombre ?? ''} alCambiar={(nombre) => cambiar({ nombre })} maximo={40} ayuda="Se lee si no hay logo." />
              </div>
            )}
          </ListaEditable>
        </>
      )

    case 'banner-doble':
      return (
        <>
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
          <ListaEditable
            elementos={bloque.props.items}
            alCambiar={(items) => alCambiar({ items })}
            crear={(): BannerPromo => ({ id: nuevoId(), titulo: 'Nuevo banner' })}
            maximo={3}
            textoAgregar="Agregar banner (hasta 3)"
            titulo={(item, indice) => item.titulo || `Banner ${indice + 1}`}
          >
            {(item, cambiar) => (
              <>
                <ZonaImagen
                  url={item.imagenUrl}
                  alCambiar={(imagenUrl) => cambiar({ imagenUrl: imagenUrl ?? undefined })}
                  proporcion="aspect-[16/10]"
                  texto="Imagen (vacío = color de marca)"
                  {...subida}
                />
                <Campo etiqueta="Título" valor={item.titulo ?? ''} alCambiar={(titulo) => cambiar({ titulo })} maximo={60} />
                <Campo etiqueta="Subtítulo" valor={item.subtitulo ?? ''} alCambiar={(subtitulo) => cambiar({ subtitulo })} maximo={120} />
                <div className="grid grid-cols-2 gap-2.5">
                  <Campo etiqueta="Texto del botón" valor={item.textoBoton ?? ''} alCambiar={(textoBoton) => cambiar({ textoBoton })} />
                  <Campo etiqueta="Enlace" valor={item.enlace ?? ''} alCambiar={(enlace) => cambiar({ enlace })} marcador="#productos" />
                </div>
              </>
            )}
          </ListaEditable>
        </>
      )

    case 'llamado':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo} alCambiar={(titulo) => alCambiar({ titulo })} maximo={90} />
          <CampoArea etiqueta="Texto" valor={bloque.props.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} filas={2} maximo={240} />
          <Campo etiqueta="Texto del botón" valor={bloque.props.textoBoton ?? ''} alCambiar={(textoBoton) => alCambiar({ textoBoton })} marcador="Vacío = sin botón" />
          <Interruptor activo={bloque.props.aWhatsapp ?? false} alCambiar={(aWhatsapp) => alCambiar({ aWhatsapp })}>
            El botón abre WhatsApp
            <small className="block text-[11.5px] text-sitio-tenue">Usa el número de “Contacto y redes”.</small>
          </Interruptor>
          {!bloque.props.aWhatsapp && (
            <Campo etiqueta="Enlace del botón" valor={bloque.props.enlaceBoton ?? ''} alCambiar={(enlaceBoton) => alCambiar({ enlaceBoton })} marcador="#productos" />
          )}
        </>
      )

    case 'mapa':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" />
          <Campo
            etiqueta="Dirección"
            valor={bloque.props.direccion}
            alCambiar={(direccion) => alCambiar({ direccion })}
            marcador="Calle 10 # 5-20, Villavicencio"
            ayuda="Vacío = la de “Contacto y redes”."
          />
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
        </>
      )

    case 'servicios':
      return <CamposServicios bloque={bloque} alCambiar={alCambiar} limites={limites} {...subida} />

    case 'equipo':
      return <CamposEquipo bloque={bloque} alCambiar={alCambiar} limites={limites} {...subida} />

    case 'horario':
      return <CamposHorario bloque={bloque} alCambiar={alCambiar} limites={limites} {...subida} />

    case 'lienzo':
      return (
        <CamposLienzo bloqueId={bloque.id} props={bloque.props} alCambiar={alCambiar} alError={alError} alSubiendo={alSubiendo} />
      )

    case 'espaciador':
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Alto</span>
            <Segmentado
              opciones={[
                { valor: 'chico', etiqueta: 'Chico' },
                { valor: 'medio', etiqueta: 'Medio' },
                { valor: 'grande', etiqueta: 'Grande' },
              ]}
              valor={bloque.props.alto ?? 'medio'}
              alCambiar={(alto) => alCambiar({ alto })}
              chico
            />
          </div>
          <Interruptor activo={bloque.props.linea ?? false} alCambiar={(linea) => alCambiar({ linea })}>
            Con línea divisoria
          </Interruptor>
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
    case 'columnas':
    case 'testimonios':
    case 'preguntas':
    case 'logos':
      return bloque.props.titulo || `${bloque.props.items.length} elementos`
    case 'galeria':
      return bloque.props.titulo || `${bloque.props.imagenes.length} fotos`
    case 'video':
      return bloque.props.titulo || bloque.props.url || 'Sin enlace'
    case 'cuenta-regresiva':
      return bloque.props.fecha ? `Hasta ${new Date(bloque.props.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Sin fecha'
    case 'banner-doble':
      return bloque.props.items.map((item) => item.titulo).filter(Boolean).join(' · ')
    case 'llamado':
      return bloque.props.titulo
    case 'mapa':
      return bloque.props.direccion
    case 'servicios':
      return bloque.props.titulo || `${bloque.props.items.length} servicios`
    case 'equipo':
      return bloque.props.titulo || `${bloque.props.items.length} personas`
    case 'horario':
      return bloque.props.dias.map((fila) => fila.dia).filter(Boolean).join(' · ')
    case 'espaciador':
      return bloque.props.linea ? 'Con línea' : 'Espacio'
    case 'lienzo':
      return `${bloque.props.elementos.length} piezas sueltas`
    default:
      return ''
  }
}

/** Cuadrícula de íconos para las columnas; el ícono elegido se guarda por su clave. */
function SelectorIcono({ valor, alCambiar }: { valor?: string; alCambiar: (icono: string) => void }) {
  const actual = claveIcono(valor)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-sitio-suave">Ícono</span>
      <div role="radiogroup" aria-label="Ícono" className="grid grid-cols-8 gap-1">
        {Object.entries(ICONOS_BLOQUE).map(([clave, { Icono, nombre }]) => (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={actual === clave}
            aria-label={nombre}
            title={nombre}
            onClick={() => alCambiar(clave)}
            className={cn(
              'grid aspect-square place-items-center rounded-md border transition-colors',
              actual === clave ? 'border-sitio-tinta bg-sitio-tinta text-sitio-fondo' : 'border-sitio-borde text-sitio-suave hover:border-sitio-tinta/40 hover:text-sitio-tinta',
            )}
          >
            <Icono aria-hidden="true" className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
