'use client'

import { ArrowDown, ArrowUp, Copy, Heading, ImageIcon, Monitor, MousePointerClick, Plus, Smartphone, Square, Trash2, Type, Wand2 } from 'lucide-react'
import type { ElementoLienzo, PropsLienzo, TipoElementoLienzo } from '@/tipos/bloques'
import { cn } from '@/utilidades/clases'
import {
  DISENOS_LIENZO,
  TAMANO_INICIAL,
  acomodarParaCelular,
  cajaVisible,
  cambiarCapa,
  conCaja,
  duplicarElemento,
  nuevoElemento,
} from '@/utilidades/lienzo'
import { tamanoMovil } from '@/componentes/tienda/bloques/Lienzo'
import { Campo, CampoArea, CampoColor, Interruptor, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'
import { useLienzo } from './ContextoLienzo'
import { confirmar } from '../ui/confirmar'

const PIEZAS: { tipo: TipoElementoLienzo; etiqueta: string; Icono: typeof Type }[] = [
  { tipo: 'titulo', etiqueta: 'Título', Icono: Heading },
  { tipo: 'texto', etiqueta: 'Texto', Icono: Type },
  { tipo: 'boton', etiqueta: 'Botón', Icono: MousePointerClick },
  { tipo: 'imagen', etiqueta: 'Foto', Icono: ImageIcon },
  { tipo: 'forma', etiqueta: 'Forma', Icono: Square },
]

const ICONO_PIEZA = Object.fromEntries(PIEZAS.map(({ tipo, Icono }) => [tipo, Icono])) as Record<TipoElementoLienzo, typeof Type>

const nombrePieza = (pieza: ElementoLienzo) =>
  pieza.texto?.trim() || PIEZAS.find((opcion) => opcion.tipo === pieza.tipo)?.etiqueta || 'Pieza'

interface Props {
  bloqueId: string
  props: PropsLienzo
  alCambiar: (cambios: Partial<PropsLienzo>) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
}

/**
 * Panel del lienzo libre. Lo grueso (mover y estirar) se hace con el mouse en
 * la vista previa; aquí van el contenido de cada pieza, sus colores, las capas
 * y los atajos: diseños de arranque y el acomodo automático para el celular.
 */
export function CamposLienzo({ bloqueId, props, alCambiar, alError, alSubiendo }: Props) {
  const { elegido, elegir, movil } = useLienzo()
  const actual = elegido?.bloque === bloqueId ? props.elementos.find((pieza) => pieza.id === elegido.elemento) : undefined

  const cambiarPieza = (id: string, cambios: Partial<ElementoLienzo>) =>
    alCambiar({ elementos: props.elementos.map((pieza) => (pieza.id === id ? { ...pieza, ...cambios } : pieza)) })

  function agregar(tipo: TipoElementoLienzo) {
    const pieza = nuevoElemento(tipo)
    alCambiar({ elementos: [...props.elementos, pieza] })
    elegir(bloqueId, pieza.id)
  }

  async function usarDiseno(clave: string) {
    const diseno = DISENOS_LIENZO.find((opcion) => opcion.clave === clave)
    if (!diseno) return
    if (
      props.elementos.length > 0 &&
      !(await confirmar({
        titulo: `¿Usar "${diseno.nombre}"?`,
        mensaje: 'Reemplaza las piezas de este lienzo. Puedes volver atrás con Ctrl+Z.',
        confirmar: 'Usar diseño',
      }))
    )
      return
    alCambiar(diseno.armar())
    elegir(bloqueId, null)
  }

  return (
    <>
      <div className="flex items-start gap-2.5 rounded-[10px] border border-sitio-azul/30 bg-sitio-azul/[0.08] p-3 text-[12px] leading-relaxed text-sitio-suave">
        {movil ? <Smartphone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sitio-azul-claro" /> : <Monitor aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sitio-azul-claro" />}
        <span>
          Arrastra las piezas en la vista previa para moverlas; los puntos de las esquinas las agrandan o achican. Estás acomodando la versión de{' '}
          <b className="font-medium text-white">{movil ? 'celular' : 'computador'}</b>: cambia arriba con el ícono del{' '}
          {movil ? 'computador' : 'celular'}.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Diseños para empezar</span>
        <div className="grid grid-cols-2 gap-1.5">
          {DISENOS_LIENZO.map((diseno) => (
            <button
              key={diseno.clave}
              type="button"
              onClick={() => void usarDiseno(diseno.clave)}
              className="rounded-lg border border-sitio-borde px-2.5 py-2 text-left text-[11.5px] leading-snug text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
            >
              {diseno.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Campo
          etiqueta={movil ? 'Alto en el celular' : 'Alto en el computador'}
          tipo="number"
          min={120}
          valor={movil ? props.altoMovil : props.alto}
          alCambiar={(valor) => {
            const alto = Math.min(2400, Math.max(120, Number(valor) || 120))
            alCambiar(movil ? { altoMovil: alto } : { alto })
          }}
          ayuda="También con la barrita azul de abajo."
        />
        <CampoColor etiqueta="Fondo" valor={props.fondo ?? '#ffffff'} alCambiar={(fondo) => alCambiar({ fondo })} />
      </div>

      {movil && (
        <button
          type="button"
          onClick={() => alCambiar(acomodarParaCelular(props))}
          className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-sitio-borde text-[12px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
        >
          <Wand2 aria-hidden="true" className="h-3.5 w-3.5" />
          Acomodar para celular automáticamente
        </button>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Agregar</span>
        <div className="grid grid-cols-5 gap-1">
          {PIEZAS.map(({ tipo, etiqueta, Icono }) => (
            <button
              key={tipo}
              type="button"
              onClick={() => agregar(tipo)}
              className="flex flex-col items-center gap-1 rounded-lg border border-sitio-borde py-2 text-[10.5px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
            >
              <Icono aria-hidden="true" className="h-4 w-4" />
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">
          Capas <small className="text-sitio-tenue">(la de arriba queda encima)</small>
        </span>
        {props.elementos.length === 0 && <p className="text-[12px] text-sitio-tenue">Lienzo vacío: agrega una pieza o usa un diseño.</p>}
        <ul className="flex flex-col gap-1">
          {[...props.elementos].reverse().map((pieza) => {
            const Icono = ICONO_PIEZA[pieza.tipo]
            const activa = actual?.id === pieza.id
            return (
              <li key={pieza.id}>
                <button
                  type="button"
                  data-capa={pieza.id}
                  aria-pressed={activa}
                  onClick={() => elegir(bloqueId, activa ? null : pieza.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[12.5px] transition-colors',
                    activa ? 'border-sitio-azul bg-sitio-azul/10 text-white' : 'border-sitio-borde text-sitio-suave hover:border-white/25 hover:text-white',
                  )}
                >
                  <Icono aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{nombrePieza(pieza)}</span>
                  {movil && pieza.movil?.oculto && <span className="ml-auto text-[10.5px] text-sitio-tenue">oculta en celular</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {actual && (
        <CamposPieza
          key={actual.id}
          pieza={actual}
          movil={movil}
          alCambiar={(cambios) => cambiarPieza(actual.id, cambios)}
          alCapa={(paso) => alCambiar({ elementos: cambiarCapa(props.elementos, actual.id, paso) })}
          alDuplicar={() => {
            const { elementos, nuevo } = duplicarElemento(props.elementos, actual.id)
            alCambiar({ elementos })
            if (nuevo) elegir(bloqueId, nuevo)
          }}
          alQuitar={() => {
            alCambiar({ elementos: props.elementos.filter((pieza) => pieza.id !== actual.id) })
            elegir(bloqueId, null)
          }}
          alError={alError}
          alSubiendo={alSubiendo}
        />
      )}
    </>
  )
}

function CamposPieza({
  pieza,
  movil,
  alCambiar,
  alCapa,
  alDuplicar,
  alQuitar,
  alError,
  alSubiendo,
}: {
  pieza: ElementoLienzo
  movil: boolean
  alCambiar: (cambios: Partial<ElementoLienzo>) => void
  alCapa: (paso: 1 | -1) => void
  alDuplicar: () => void
  alQuitar: () => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
}) {
  const caja = cajaVisible(pieza, movil)
  const conLetra = pieza.tipo === 'titulo' || pieza.tipo === 'texto' || pieza.tipo === 'boton'
  const boton = 'grid h-8 flex-1 place-items-center rounded-lg border border-sitio-borde text-sitio-suave transition-colors hover:border-white/30 hover:text-white'

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-sitio-azul/40 bg-white/[0.02] p-3">
      <div className="flex gap-1">
        <button type="button" title="Traer adelante" onClick={() => alCapa(1)} className={boton}>
          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Enviar atrás" onClick={() => alCapa(-1)} className={boton}>
          <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Duplicar" onClick={alDuplicar} className={boton}>
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Eliminar" onClick={alQuitar} className={cn(boton, 'hover:!border-red-400/60 hover:!text-red-300')}>
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>

      {(pieza.tipo === 'titulo' || pieza.tipo === 'texto') && (
        <CampoArea etiqueta="Texto" valor={pieza.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} filas={3} maximo={600} />
      )}
      {pieza.tipo === 'boton' && (
        <div className="grid grid-cols-2 gap-2">
          <Campo etiqueta="Texto" valor={pieza.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} maximo={40} />
          <Campo etiqueta="Lleva a" valor={pieza.enlace ?? ''} alCambiar={(enlace) => alCambiar({ enlace })} marcador="#productos" />
        </div>
      )}
      {pieza.tipo === 'imagen' && (
        <>
          <ZonaImagen
            url={pieza.imagenUrl}
            alCambiar={(imagenUrl) => alCambiar({ imagenUrl: imagenUrl ?? undefined })}
            proporcion="aspect-[16/10]"
            texto="Sube la foto"
            alError={alError}
            alSubiendo={alSubiendo}
          />
          <Segmentado
            opciones={[
              { valor: 'cubrir', etiqueta: 'Llenar la caja' },
              { valor: 'contener', etiqueta: 'Foto completa' },
            ]}
            valor={pieza.ajuste ?? 'cubrir'}
            alCambiar={(ajuste) => alCambiar({ ajuste })}
            chico
          />
        </>
      )}

      {conLetra && (
        <div className="grid grid-cols-2 gap-2">
          <Campo
            etiqueta={movil ? 'Tamaño de letra (celular)' : 'Tamaño de letra'}
            tipo="number"
            min={8}
            valor={movil ? tamanoMovil(pieza) : (pieza.tamano ?? TAMANO_INICIAL[pieza.tipo])}
            alCambiar={(valor) => {
              const tamano = Math.min(200, Math.max(8, Number(valor) || 8))
              alCambiar(movil ? { movil: { ...pieza.movil, tamano } } : { tamano })
            }}
          />
          <CampoColor
            etiqueta="Color del texto"
            valor={pieza.color ?? '#111111'}
            alCambiar={(color) => alCambiar({ color })}
          />
        </div>
      )}
      {(pieza.tipo === 'titulo' || pieza.tipo === 'texto') && (
        <div className="flex flex-wrap gap-2">
          <Segmentado
            opciones={[
              { valor: 'normal', etiqueta: 'Normal' },
              { valor: 'negrita', etiqueta: 'Negrita' },
            ]}
            valor={pieza.peso ?? (pieza.tipo === 'titulo' ? 'negrita' : 'normal')}
            alCambiar={(peso) => alCambiar({ peso })}
            chico
          />
          <Segmentado
            opciones={[
              { valor: 'izquierda', etiqueta: 'Izq.' },
              { valor: 'centro', etiqueta: 'Centro' },
              { valor: 'derecha', etiqueta: 'Der.' },
            ]}
            valor={pieza.alineacion ?? 'izquierda'}
            alCambiar={(alineacion) => alCambiar({ alineacion })}
            chico
          />
        </div>
      )}
      {pieza.tipo === 'boton' && (
        <>
          <Interruptor activo={pieza.contorno ?? false} alCambiar={(contorno) => alCambiar({ contorno })}>
            Sólo con borde
          </Interruptor>
          {!pieza.contorno && (
            <CampoColor etiqueta="Color del botón" valor={pieza.fondo ?? '#111111'} alCambiar={(fondo) => alCambiar({ fondo })} />
          )}
        </>
      )}
      {pieza.tipo === 'forma' && (
        <CampoColor etiqueta="Color" valor={pieza.fondo ?? '#111111'} alCambiar={(fondo) => alCambiar({ fondo })} />
      )}

      <div className="grid grid-cols-2 gap-2">
        {(pieza.tipo === 'imagen' || pieza.tipo === 'forma' || pieza.tipo === 'boton') && (
          <Campo
            etiqueta="Esquinas (px)"
            tipo="number"
            min={0}
            valor={pieza.radio ?? 0}
            alCambiar={(valor) => alCambiar({ radio: Math.min(999, Math.max(0, Number(valor) || 0)) })}
          />
        )}
        {(pieza.tipo === 'imagen' || pieza.tipo === 'forma') && (
          <Campo
            etiqueta="Opacidad (%)"
            tipo="number"
            min={0}
            valor={pieza.opacidad ?? 100}
            alCambiar={(valor) => alCambiar({ opacidad: Math.min(100, Math.max(0, Number(valor) || 0)) })}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">
          Posición y tamaño en % <small className="text-sitio-tenue">({movil ? 'celular' : 'computador'})</small>
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {(['x', 'y', 'w', 'h'] as const).map((eje) => (
            <Campo
              key={eje}
              etiqueta={{ x: 'Izq.', y: 'Arriba', w: 'Ancho', h: 'Alto' }[eje]}
              tipo="number"
              valor={Math.round(caja[eje] * 10) / 10}
              alCambiar={(valor) => alCambiar(conCaja(pieza, { [eje]: Number(valor) || 0 }, movil))}
            />
          ))}
        </div>
      </div>

      {movil && (
        <Interruptor
          activo={pieza.movil?.oculto ?? false}
          alCambiar={(oculto) => alCambiar({ movil: { ...pieza.movil, oculto } })}
        >
          Ocultar en el celular
        </Interruptor>
      )}
      <p className="flex items-center gap-1.5 text-[11px] text-sitio-tenue">
        <Plus aria-hidden="true" className="h-3 w-3 rotate-45" />
        Con la pieza elegida: flechas para moverla, Shift para saltos grandes, Supr para borrarla.
      </p>
    </div>
  )
}
