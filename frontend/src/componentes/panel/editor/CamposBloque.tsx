'use client'

import type { Bloque } from '@/tipos/bloques'
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
}

const ALINEACIONES = [
  { valor: 'izquierda', etiqueta: 'Izquierda' },
  { valor: 'centro', etiqueta: 'Centro' },
] as const

/** Los campos que edita cada tipo de sección. */
export function CamposBloque({ bloque, alCambiar, alError, alSubiendo, limites }: Props) {
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
          <Campo etiqueta="Título" valor={bloque.props.titulo} alCambiar={(titulo) => alCambiar({ titulo })} maximo={90} />
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
              alCambiar={(limite) => alCambiar({ limite: Math.min(48, Math.max(1, Number(limite) || 1)) })}
            />
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
              />
            </div>
          </div>
          <p className="text-[11.5px] leading-relaxed text-sitio-tenue">
            Se muestran tus productos visibles, del más nuevo al más antiguo.
          </p>
        </>
      )

    case 'imagen-texto':
      return (
        <>
          <Campo etiqueta="Título" valor={bloque.props.titulo} alCambiar={(titulo) => alCambiar({ titulo })} maximo={90} />
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
