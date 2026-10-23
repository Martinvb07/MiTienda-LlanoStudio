'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUp, Copy, Maximize2, Minimize2, Monitor, Plus, Smartphone, Trash2, Wand2, X } from 'lucide-react'
import type { ElementoLienzo, OpcionesTarjeta, PropsLienzo, RedSocial, TipoElementoLienzo } from '@/tipos/bloques'
import { ICONOS_LIENZO } from '@/componentes/tienda/bloques/PiezasLienzo'
import { cn } from '@/utilidades/clases'
import {
  TAMANO_INICIAL,
  acomodarParaCelular,
  cajaVisible,
  cambiarCapa,
  conCaja,
  duplicarElemento,
  escalarElemento,
} from '@/utilidades/lienzo'
import { tamanoMovil } from '@/componentes/tienda/bloques/Lienzo'
import { CURVA, Campo, CampoArea, CampoColor, Interruptor, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'
import { useLienzo } from './ContextoLienzo'
import { Selector } from '../ui/flotantes'
import { iconoPieza, nombrePieza } from './piezasLienzo'

/** Las que llevan letra propia (tamaño y color). */
const CON_LETRA: readonly TipoElementoLienzo[] = ['titulo', 'texto', 'boton', 'whatsapp', 'enlace', 'menu', 'categorias', 'redes', 'buscador', 'cuenta', 'logo']
/** Las que se alinean a la izquierda, al centro o a la derecha. */
const CON_ALINEACION: readonly TipoElementoLienzo[] = ['titulo', 'texto', 'enlace', 'menu', 'categorias', 'redes', 'logo', 'carrito']

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
export function CamposLienzo({ bloqueId, props, alCambiar }: Props) {
  const { elegido, elegir, movil } = useLienzo()
  const actual = elegido?.bloque === bloqueId ? props.elementos.find((pieza) => pieza.id === elegido.elemento) : undefined

  return (
    <>
      <p className="flex items-start gap-2 text-[12px] leading-relaxed text-sitio-tenue">
        {movil ? <Smartphone aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Monitor aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
        <span>
          Arrastra y estira en la vista previa ({movil ? 'celular' : 'computador'}). Toca una pieza para editarla; agrega desde la derecha.
        </span>
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <Campo
          etiqueta={movil ? 'Alto en el celular' : 'Alto'}
          tipo="number"
          min={40}
          valor={movil ? props.altoMovil : props.alto}
          alCambiar={(valor) => {
            const alto = Math.min(2400, Math.max(40, Number(valor) || 40))
            alCambiar(movil ? { altoMovil: alto } : { alto })
          }}
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
          Acomodar para celular
        </button>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-[11.5px] text-sitio-suave">Piezas</span>
        {props.elementos.length === 0 && <p className="text-[12px] text-sitio-tenue">Vacío: arrastra algo desde la derecha.</p>}
        <ul className="flex flex-col gap-0.5">
          {[...props.elementos].reverse().map((pieza) => {
            const Icono = iconoPieza(pieza.tipo)
            const activa = actual?.id === pieza.id
            return (
              <li key={pieza.id}>
                <button
                  type="button"
                  data-capa={pieza.id}
                  aria-pressed={activa}
                  onClick={() => elegir(bloqueId, activa ? null : pieza.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors',
                    activa ? 'bg-sitio-azul/15 text-white' : 'text-sitio-suave hover:bg-white/[0.05] hover:text-white',
                  )}
                >
                  <Icono aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{nombrePieza(pieza)}</span>
                  {movil && pieza.movil?.oculto && <span className="ml-auto text-[10.5px] text-sitio-tenue">oculta</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}

/**
 * Las opciones de la pieza elegida, en un modal flotante sobre la vista previa
 * (no en la columna de la izquierda, que queda para las secciones).
 */
export function ModalPieza({
  bloqueId,
  props,
  alCambiar,
  alError,
  alSubiendo,
}: Props) {
  const { elegido, elegir, movil } = useLienzo()
  const actual = elegido?.bloque === bloqueId ? props.elementos.find((pieza) => pieza.id === elegido.elemento) : undefined
  const cambiarPieza = (id: string, cambios: Partial<ElementoLienzo>) =>
    alCambiar({ elementos: props.elementos.map((pieza) => (pieza.id === id ? { ...pieza, ...cambios } : pieza)) })

  useEffect(() => {
    if (!actual) return
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && elegir(bloqueId, null)
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [actual, bloqueId, elegir])

  return (
    <AnimatePresence>
      {actual && (
        <motion.div
          key="modal-pieza"
          role="dialog"
          aria-label={`Editar ${nombrePieza(actual)}`}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: CURVA }}
          className="absolute top-4 right-4 z-30 flex max-h-[calc(100%-32px)] w-[320px] flex-col overflow-hidden rounded-[14px] border border-sitio-borde bg-sitio-lateral shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center gap-2 border-b border-sitio-borde px-3.5 py-2.5">
            {(() => {
              const Icono = iconoPieza(actual.tipo)
              return <Icono aria-hidden="true" className="h-4 w-4 text-sitio-suave" />
            })()}
            <span className="flex-1 truncate text-[13px] text-white">{nombrePieza(actual)}</span>
            <button
              type="button"
              onClick={() => elegir(bloqueId, null)}
              aria-label="Cerrar"
              className="grid h-7 w-7 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-3">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const conLetra = CON_LETRA.includes(pieza.tipo)
  const { productos, categorias } = useLienzo()
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

      <div className="flex items-center gap-1.5">
        <span className="flex-1 text-[11.5px] text-sitio-suave">Tamaño {movil ? '(celular)' : ''}</span>
        <button type="button" title="Achicar" onClick={() => alCambiar(escalarElemento(pieza, 0.9, movil))} className={cn(boton, 'flex-none px-3')}>
          <Minimize2 aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Agrandar" onClick={() => alCambiar(escalarElemento(pieza, 1.1, movil))} className={cn(boton, 'flex-none px-3')}>
          <Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />
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
          <Campo etiqueta="Lleva a (opcional)" valor={pieza.enlace ?? ''} marcador="/categoria/…" alCambiar={(enlace) => alCambiar({ enlace: enlace || undefined })} />
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

      <CamposEspeciales pieza={pieza} alCambiar={alCambiar} productos={productos} categorias={categorias} />

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
      {CON_ALINEACION.includes(pieza.tipo) && (
        <div className="flex flex-wrap gap-2">
          {(pieza.tipo === 'titulo' || pieza.tipo === 'texto') && (
            <Segmentado
              opciones={[
                { valor: 'normal', etiqueta: 'Normal' },
                { valor: 'negrita', etiqueta: 'Negrita' },
              ]}
              valor={pieza.peso ?? (pieza.tipo === 'titulo' ? 'negrita' : 'normal')}
              alCambiar={(peso) => alCambiar({ peso })}
              chico
            />
          )}
          <Segmentado
            opciones={[
              { valor: 'izquierda', etiqueta: 'Izq.' },
              { valor: 'centro', etiqueta: 'Centro' },
              { valor: 'derecha', etiqueta: 'Der.' },
            ]}
            valor={pieza.alineacion ?? (pieza.tipo === 'titulo' || pieza.tipo === 'texto' ? 'izquierda' : 'centro')}
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
        {['imagen', 'forma', 'boton', 'whatsapp', 'video', 'mapa'].includes(pieza.tipo) && (
          <Campo
            etiqueta="Esquinas (px)"
            tipo="number"
            min={0}
            valor={pieza.radio ?? 0}
            alCambiar={(valor) => alCambiar({ radio: Math.min(999, Math.max(0, Number(valor) || 0)) })}
          />
        )}
        {(pieza.tipo === 'imagen' || pieza.tipo === 'forma' || pieza.tipo === 'linea') && (
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

const REDES: { valor: RedSocial; etiqueta: string }[] = [
  { valor: 'instagram', etiqueta: 'Instagram' },
  { valor: 'facebook', etiqueta: 'Facebook' },
  { valor: 'tiktok', etiqueta: 'TikTok' },
  { valor: 'whatsapp', etiqueta: 'WhatsApp' },
]

/** Qué se ve en cada tarjeta de producto: todo se puede apagar. */
function CamposTarjeta({ tarjeta = {}, alCambiar }: { tarjeta?: OpcionesTarjeta; alCambiar: (tarjeta: OpcionesTarjeta) => void }) {
  const cambiar = (cambios: Partial<OpcionesTarjeta>) => alCambiar({ ...tarjeta, ...cambios })
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-sitio-borde p-2.5">
      <span className="text-[11.5px] text-sitio-suave">Qué muestra la tarjeta</span>
      <Segmentado
        opciones={[
          { valor: 'tarjeta', etiqueta: 'Con borde' },
          { valor: 'simple', etiqueta: 'Simple' },
        ]}
        valor={tarjeta.estilo ?? 'tarjeta'}
        alCambiar={(estilo) => cambiar({ estilo })}
        chico
      />
      <Interruptor activo={tarjeta.nombre !== false} alCambiar={(nombre) => cambiar({ nombre })}>
        Nombre
      </Interruptor>
      <Interruptor activo={tarjeta.precio !== false} alCambiar={(precio) => cambiar({ precio })}>
        Precio
      </Interruptor>
      <Interruptor activo={tarjeta.precioAntes !== false} alCambiar={(precioAntes) => cambiar({ precioAntes })}>
        Precio antes (tachado)
      </Interruptor>
      <Interruptor activo={tarjeta.oferta !== false} alCambiar={(oferta) => cambiar({ oferta })}>
        Insignia de oferta
      </Interruptor>
      {tarjeta.oferta !== false && (
        <Campo etiqueta="Texto de la insignia" valor={tarjeta.textoOferta ?? ''} marcador="Oferta" maximo={20} alCambiar={(textoOferta) => cambiar({ textoOferta })} />
      )}
      <Interruptor activo={tarjeta.boton !== false} alCambiar={(boton) => cambiar({ boton })}>
        Botón Agregar
      </Interruptor>
    </div>
  )
}

/** Campos de las piezas vivas y especiales: producto, grilla, redes, video… */
function CamposEspeciales({
  pieza,
  alCambiar,
  productos,
  categorias,
}: {
  pieza: ElementoLienzo
  alCambiar: (cambios: Partial<ElementoLienzo>) => void
  productos: { id: string; nombre: string }[]
  categorias: string[]
}) {
  const colores = (textoEtiqueta: string, fondoEtiqueta?: string) => (
    <div className="grid grid-cols-2 gap-2">
      {fondoEtiqueta && <CampoColor etiqueta={fondoEtiqueta} valor={pieza.fondo ?? '#111111'} alCambiar={(fondo) => alCambiar({ fondo })} />}
      <CampoColor etiqueta={textoEtiqueta} valor={pieza.color ?? '#ffffff'} alCambiar={(color) => alCambiar({ color })} />
    </div>
  )
  const ayuda = (texto: string) => <p className="text-[11.5px] leading-relaxed text-sitio-tenue">{texto}</p>

  switch (pieza.tipo) {
    case 'producto':
      return (
        <>
          {productos.length ? (
            <Selector
              etiqueta="Producto"
              valor={pieza.productoId ?? productos[0]!.id}
              opciones={productos.map((producto) => ({ valor: producto.id, etiqueta: producto.nombre }))}
              alCambiar={(productoId) => alCambiar({ productoId })}
            />
          ) : (
            ayuda('Todavía no tienes productos: créalos en Productos y aquí eliges cuál mostrar.')
          )}
          {ayuda('Se actualiza solo: si cambias el precio, la foto o el stock, la tarjeta cambia.')}
          <CamposTarjeta tarjeta={pieza.tarjeta} alCambiar={(tarjeta) => alCambiar({ tarjeta })} />
        </>
      )
    case 'productos':
      return (
        <>
          <Selector
            etiqueta="De qué categoría"
            valor={pieza.categoria ?? ''}
            opciones={[{ valor: '', etiqueta: 'Todos los productos' }, ...categorias.map((categoria) => ({ valor: categoria, etiqueta: categoria }))]}
            alCambiar={(categoria) => alCambiar({ categoria: categoria || undefined })}
          />
          <Campo
            etiqueta="Cuántos mostrar"
            tipo="number"
            min={1}
            valor={pieza.limite ?? 4}
            alCambiar={(valor) => alCambiar({ limite: Math.min(24, Math.max(1, Number(valor) || 1)) })}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Columnas en el computador</span>
            <Segmentado
              opciones={(['1', '2', '3', '4', '5', '6'] as const).map((valor) => ({ valor, etiqueta: valor }))}
              valor={String(pieza.columnas ?? 4) as '4'}
              alCambiar={(valor) => alCambiar({ columnas: Number(valor) })}
              chico
            />
            <span className="text-[11.5px] text-sitio-suave">Columnas en el celular</span>
            <Segmentado
              opciones={(['1', '2', '3'] as const).map((valor) => ({ valor, etiqueta: valor }))}
              valor={String(pieza.columnasMovil ?? 2) as '2'}
              alCambiar={(valor) => alCambiar({ columnasMovil: Number(valor) })}
              chico
            />
          </div>
          <Interruptor activo={pieza.soloDestacados ?? false} alCambiar={(soloDestacados) => alCambiar({ soloDestacados })}>
            Sólo los destacados
          </Interruptor>
          {ayuda('Se actualiza sola con tu catálogo. Si no caben, agranda la caja o el alto del lienzo.')}
          <CamposTarjeta tarjeta={pieza.tarjeta} alCambiar={(tarjeta) => alCambiar({ tarjeta })} />
        </>
      )
    case 'categorias':
      return (
        <>
          {ayuda('Un botón por cada categoría de tus productos, al día.')}
          {colores('Color del texto', 'Color de los botones')}
        </>
      )
    case 'redes':
      return (
        <>
          <div className="flex flex-col gap-1.5 rounded-[10px] border border-sitio-borde p-2.5">
            <span className="text-[11.5px] text-sitio-suave">Cuáles mostrar</span>
            {REDES.map(({ valor, etiqueta }) => {
              const elegidas = pieza.redes?.length ? pieza.redes : REDES.map((red) => red.valor)
              return (
                <Interruptor
                  key={valor}
                  activo={elegidas.includes(valor)}
                  alCambiar={(activo) => alCambiar({ redes: activo ? [...elegidas, valor] : elegidas.filter((red) => red !== valor) })}
                >
                  {etiqueta}
                </Interruptor>
              )
            })}
          </div>
          {ayuda('Los enlaces salen de Ajustes > Contacto y redes.')}
          {colores('Color de los íconos', 'Fondo (opcional)')}
        </>
      )
    case 'whatsapp':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Campo etiqueta="Texto" valor={pieza.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} maximo={40} />
            <Campo etiqueta="Mensaje inicial" valor={pieza.mensaje ?? ''} marcador="Hola, quiero…" alCambiar={(mensaje) => alCambiar({ mensaje })} maximo={200} />
          </div>
          {ayuda('El número sale de Ajustes > Contacto y redes.')}
          <CampoColor etiqueta="Color del botón" valor={pieza.fondo ?? '#25d366'} alCambiar={(fondo) => alCambiar({ fondo })} />
        </>
      )
    case 'logo':
      return ayuda('Es el logo de la tienda (o su nombre si no tiene). Se cambia en Ajustes.')
    case 'buscador':
      return (
        <>
          <Campo etiqueta="Texto de ayuda" valor={pieza.texto ?? ''} marcador="¿Qué estás buscando?" alCambiar={(texto) => alCambiar({ texto })} maximo={60} />
          {colores('Color de la lupa', 'Color del botón')}
        </>
      )
    case 'menu':
      return ayuda('Los enlaces se arman en Encabezado > Menú.')
    case 'carrito':
      return <CampoColor etiqueta="Color" valor={pieza.color ?? '#111111'} alCambiar={(color) => alCambiar({ color })} />
    case 'icono':
      return (
        <>
          <div className="grid grid-cols-6 gap-1">
            {Object.entries(ICONOS_LIENZO).map(([clave, { Icono, nombre }]) => (
              <button
                key={clave}
                type="button"
                title={nombre}
                aria-pressed={(pieza.icono ?? 'estrella') === clave}
                onClick={() => alCambiar({ icono: clave })}
                className={cn(
                  'grid h-9 place-items-center rounded-lg border transition-colors',
                  (pieza.icono ?? 'estrella') === clave ? 'border-sitio-azul bg-sitio-azul/10 text-white' : 'border-sitio-borde text-sitio-suave hover:border-white/30 hover:text-white',
                )}
              >
                <Icono aria-hidden="true" className="h-4 w-4" />
              </button>
            ))}
          </div>
          <CampoColor etiqueta="Color" valor={pieza.color ?? '#111111'} alCambiar={(color) => alCambiar({ color })} />
        </>
      )
    case 'enlace':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Campo etiqueta="Texto" valor={pieza.texto ?? ''} alCambiar={(texto) => alCambiar({ texto })} maximo={60} />
          <Campo etiqueta="Lleva a" valor={pieza.enlace ?? ''} marcador="/buscar" alCambiar={(enlace) => alCambiar({ enlace })} />
        </div>
      )
    case 'linea':
      return <CampoColor etiqueta="Color" valor={pieza.fondo ?? '#111111'} alCambiar={(fondo) => alCambiar({ fondo })} />
    case 'video':
      return <Campo etiqueta="Enlace del video" valor={pieza.url ?? ''} marcador="https://youtu.be/…" alCambiar={(url) => alCambiar({ url })} />
    case 'mapa':
      return (
        <>
          <Campo etiqueta="Dirección" valor={pieza.direccion ?? ''} marcador="Calle 10 # 5-20, Villavicencio" alCambiar={(direccion) => alCambiar({ direccion })} />
          {ayuda('Vacía, usa la dirección de Ajustes.')}
        </>
      )
    case 'cuenta':
      return (
        <>
          <Campo etiqueta="Termina el" tipo="datetime-local" valor={pieza.fecha ?? ''} alCambiar={(fecha) => alCambiar({ fecha })} />
          {colores('Color de los números', 'Color de las casillas')}
        </>
      )
    default:
      return null
  }
}
