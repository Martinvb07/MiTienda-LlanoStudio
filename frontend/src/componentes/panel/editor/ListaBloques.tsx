'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Copy, Eye, EyeOff, GripVertical, Lock, Move, Plus, Trash2, X } from 'lucide-react'
import {
  DESCRIPCIONES_BLOQUE,
  ETIQUETAS_BLOQUE,
  GRUPOS_BLOQUE,
  crearBloque,
  duplicarBloque,
  etiquetaBloque,
  type Bloque,
  type EstiloSeccion,
  type TipoBloque,
} from '@/tipos/bloques'
import type { EsquemaColor } from '@/tipos/tienda'
import { cn } from '@/utilidades/clases'
import { planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { CURVA, Candado, PlanRequerido, Segmentado } from '../ui/basicos'
import { CamposBloque, resumenBloque } from './CamposBloque'
import { CamposEstilo } from './CamposEstilo'
import { confirmar } from '../ui/confirmar'
import { motivoNoLibre } from '@/utilidades/editarLibre'

interface Props {
  bloques: Bloque[]
  alCambiar: (bloques: Bloque[]) => void
  /** Bloque abierto: también es el que se resalta en la vista previa. */
  abierto: string | null
  alAbrir: (id: string | null) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  limites: LimitesPlan
  categorias?: string[]
  /** Esquemas de color del tema, para la pestaña Estilo. */
  esquemas: EsquemaColor[]
  /** Pasa la sección a Lienzo libre (pide confirmación el editor). */
  alEditarLibre?: (id: string) => void
}

const PREFIJO_NUEVO = 'nuevo:'

/**
 * Las filas se reordenan por cercanía; una sección nueva cae donde está el
 * puntero, que es donde se dibuja la línea de inserción.
 */
const colision: CollisionDetection = (argumentos) => {
  if (!String(argumentos.active.id).startsWith('nuevo:')) return closestCenter(argumentos)
  const bajoPuntero = pointerWithin(argumentos)
  return bajoPuntero.length > 0 ? bajoPuntero : closestCenter(argumentos)
}
const ZONA_FINAL = 'zona-final'

/** Dónde entra una sección nueva si no se suelta en un lugar concreto. */
export function posicionNueva(bloques: Bloque[], tipo: TipoBloque, despuesDe: string | null): number {
  if (tipo === 'anuncio') return 0
  const pie = bloques.findIndex((bloque) => bloque.tipo === 'pie')
  if (tipo === 'pie') return bloques.length
  const abierto = despuesDe ? bloques.findIndex((bloque) => bloque.id === despuesDe) : -1
  if (abierto !== -1 && bloques[abierto]!.tipo !== 'pie') return abierto + 1
  return pie === -1 ? bloques.length : pie
}

/**
 * Secciones de la página, en orden. Se arrastran por el asa para reordenar;
 * las nuevas se arrastran desde la paleta hasta el lugar exacto (o se agregan
 * con un clic, después de la que esté abierta). Cada una se edita en dos
 * pestañas: su contenido y su estilo.
 */
export function ListaBloques({
  bloques,
  alCambiar,
  abierto,
  alAbrir,
  alError,
  alSubiendo,
  limites,
  categorias,
  esquemas,
  alEditarLibre,
}: Props) {
  const [paleta, setPaleta] = useState(false)
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [encima, setEncima] = useState<string | null>(null)
  const lleno = bloques.length >= limites.secciones
  const nuevoEnCurso = arrastrando?.startsWith(PREFIJO_NUEVO) ?? false

  // Distancia mínima: si no, un clic en los botones de la fila contaría como arrastre.
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function insertar(tipo: TipoBloque, posicion: number) {
    if (lleno || !limites.bloques.includes(tipo)) return
    const nuevo = crearBloque(tipo)
    alCambiar([...bloques.slice(0, posicion), nuevo, ...bloques.slice(posicion)])
    alAbrir(nuevo.id)
  }

  function alEmpezar({ active }: DragStartEvent) {
    setArrastrando(String(active.id))
  }

  function alPasar({ over }: DragOverEvent) {
    setEncima(over ? String(over.id) : null)
  }

  function alSoltar({ active, over }: DragEndEvent) {
    setArrastrando(null)
    setEncima(null)
    const id = String(active.id)

    if (id.startsWith(PREFIJO_NUEVO)) {
      if (!over) return
      const tipo = id.slice(PREFIJO_NUEVO.length) as TipoBloque
      const destino = String(over.id)
      const indice = destino === ZONA_FINAL ? bloques.length : bloques.findIndex((bloque) => bloque.id === destino)
      insertar(tipo, indice === -1 ? bloques.length : indice)
      return
    }

    if (!over || active.id === over.id) return
    const desde = bloques.findIndex((bloque) => bloque.id === active.id)
    const hasta = bloques.findIndex((bloque) => bloque.id === over.id)
    if (desde !== -1 && hasta !== -1) alCambiar(arrayMove(bloques, desde, hasta))
  }

  function actualizar(id: string, cambios: Partial<Bloque>) {
    alCambiar(bloques.map((bloque) => (bloque.id === id ? ({ ...bloque, ...cambios } as Bloque) : bloque)))
  }

  function duplicar(bloque: Bloque) {
    if (lleno) return
    const copia = duplicarBloque(bloque)
    const indice = bloques.findIndex((otro) => otro.id === bloque.id)
    alCambiar([...bloques.slice(0, indice + 1), copia, ...bloques.slice(indice + 1)])
    alAbrir(copia.id)
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={colision}
      // Las filas sólo suben y bajan; una sección nueva viene desde la paleta.
      modifiers={nuevoEnCurso ? [] : [restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={alEmpezar}
      onDragOver={alPasar}
      onDragEnd={alSoltar}
      onDragCancel={() => {
        setArrastrando(null)
        setEncima(null)
      }}
    >
      <div className="flex flex-col gap-2">
        <SortableContext items={bloques.map((bloque) => bloque.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {bloques.map((bloque) => (
              <FilaBloque
                key={bloque.id}
                bloque={bloque}
                abierto={abierto === bloque.id}
                destino={nuevoEnCurso && encima === bloque.id}
                alAbrir={() => alAbrir(abierto === bloque.id ? null : bloque.id)}
                alAlternar={() => actualizar(bloque.id, { visible: bloque.visible === false })}
                alDuplicar={lleno ? undefined : () => duplicar(bloque)}
                alQuitar={() =>
                  void confirmar({
                    titulo: `¿Eliminar la sección "${etiquetaBloque(bloque)}"?`,
                    mensaje: 'Se quita de tu tienda con todo lo que tiene adentro. Puedes recuperarla con Ctrl+Z mientras no cierres el editor.',
                    confirmar: 'Sí, eliminar',
                    peligro: true,
                  }).then((si) => {
                    if (!si) return
                    alCambiar(bloques.filter((otro) => otro.id !== bloque.id))
                    if (abierto === bloque.id) alAbrir(null)
                  })
                }
                alCambiarProps={(cambios) =>
                  actualizar(bloque.id, { props: { ...bloque.props, ...cambios } } as Partial<Bloque>)
                }
                alCambiarEstilo={(estilo) => actualizar(bloque.id, { estilo })}
                alError={alError}
                alSubiendo={alSubiendo}
                limites={limites}
                categorias={categorias}
                esquemas={esquemas}
                alEditarLibre={alEditarLibre && (() => alEditarLibre(bloque.id))}
              />
            ))}
          </ul>
        </SortableContext>

        <ZonaFinal activa={nuevoEnCurso} encima={encima === ZONA_FINAL} vacia={bloques.length === 0} />

        {lleno && (
          <Candado plan={planMinimo((plan) => plan.secciones > bloques.length)}>
            Tu plan {limites.nombre} admite hasta {limites.secciones} secciones.
          </Candado>
        )}

        <button
          type="button"
          disabled={lleno && !paleta}
          onClick={() => setPaleta((valor) => !valor)}
          aria-expanded={paleta}
          className="mt-1 flex h-10 items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.18] text-[12.5px] text-sitio-suave transition-colors enabled:hover:border-white/50 enabled:hover:text-white disabled:opacity-40"
        >
          {paleta ? <X aria-hidden="true" className="h-3.5 w-3.5" /> : <Plus aria-hidden="true" className="h-3.5 w-3.5" />}
          {paleta ? 'Cerrar' : 'Agregar sección'}
        </button>

        <AnimatePresence initial={false}>
          {paleta && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: CURVA }}
              className="overflow-hidden"
            >
              <p className="pt-1 pb-2 text-[11.5px] text-sitio-tenue">
                Arrástrala al lugar que quieras o haz clic para agregarla
                {abierto ? ' debajo de la que tienes abierta' : ''}.
              </p>
              <div className="flex flex-col gap-3.5">
                {GRUPOS_BLOQUE.map((grupo) => (
                  <div key={grupo.titulo}>
                    <p className="mb-1.5 text-[10px] tracking-[0.16em] text-sitio-tenue uppercase">{grupo.titulo}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grupo.tipos.map((tipo) => (
                        <FichaPaleta
                          key={tipo}
                          tipo={tipo}
                          incluido={limites.bloques.includes(tipo)}
                          deshabilitado={lleno}
                          alElegir={() => insertar(tipo, posicionNueva(bloques, tipo, abierto))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DragOverlay dropAnimation={{ duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {nuevoEnCurso && arrastrando ? (
          <div className="w-44 rotate-2 rounded-[10px] border border-white/40 bg-sitio-elevado px-3 py-2.5 text-[12.5px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.95)]">
            {ETIQUETAS_BLOQUE[arrastrando.slice(PREFIJO_NUEVO.length) as TipoBloque]}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/** Destino al final de la lista (y el único cuando la página está vacía). */
function ZonaFinal({ activa, encima, vacia }: { activa: boolean; encima: boolean; vacia: boolean }) {
  const { setNodeRef } = useDroppable({ id: ZONA_FINAL })
  if (!activa && !vacia) return <div ref={setNodeRef} className="h-0" />
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-[10px] border border-dashed p-5 text-center text-[12.5px] transition-colors',
        encima ? 'border-white/60 bg-white/[0.06] text-white' : 'border-white/15 text-sitio-tenue',
      )}
    >
      {activa ? 'Suelta aquí para ponerla al final' : 'Tu página está vacía. Agrega una sección para empezar.'}
    </div>
  )
}

function FichaPaleta({
  tipo,
  incluido,
  deshabilitado,
  alElegir,
}: {
  tipo: TipoBloque
  incluido: boolean
  deshabilitado: boolean
  alElegir: () => void
}) {
  const bloqueado = !incluido || deshabilitado
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PREFIJO_NUEVO}${tipo}`,
    disabled: bloqueado,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={bloqueado}
      onClick={alElegir}
      title={DESCRIPCIONES_BLOQUE[tipo]}
      className={cn(
        'flex min-h-[58px] flex-col justify-between gap-1 rounded-[10px] border border-sitio-borde bg-sitio-campo px-2.5 py-2 text-left transition-[border-color,opacity,transform] duration-300 enabled:cursor-grab enabled:hover:-translate-y-px enabled:hover:border-white/30 disabled:cursor-not-allowed',
        isDragging && 'opacity-30',
        !incluido && 'opacity-55',
      )}
      {...attributes}
      {...listeners}
    >
      <span className="text-[12px] leading-tight text-white">{ETIQUETAS_BLOQUE[tipo]}</span>
      {incluido ? (
        <span className="line-clamp-1 text-[10.5px] text-sitio-tenue">{DESCRIPCIONES_BLOQUE[tipo]}</span>
      ) : (
        <PlanRequerido plan={planMinimo((plan) => plan.bloques.includes(tipo))} />
      )}
    </button>
  )
}

function FilaBloque({
  bloque,
  abierto,
  destino,
  alAbrir,
  alAlternar,
  alDuplicar,
  alQuitar,
  alCambiarProps,
  alCambiarEstilo,
  alError,
  alSubiendo,
  limites,
  categorias,
  esquemas,
  alEditarLibre,
}: {
  bloque: Bloque
  abierto: boolean
  /** Una sección nueva se va a soltar aquí: se marca la línea de inserción. */
  destino: boolean
  alAbrir: () => void
  alAlternar: () => void
  alDuplicar?: () => void
  alQuitar: () => void
  alCambiarProps: (cambios: Record<string, unknown>) => void
  alCambiarEstilo: (estilo: EstiloSeccion) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  limites: LimitesPlan
  categorias?: string[]
  esquemas: EsquemaColor[]
  alEditarLibre?: () => void
}) {
  // Misma curva y duración que el reordenamiento del editor de llanostudio.co.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloque.id,
    transition: { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  })
  const [pestana, setPestana] = useState<'contenido' | 'estilo'>('contenido')
  const fila = useRef<HTMLLIElement | null>(null)
  const unirRef = useCallback(
    (nodo: HTMLLIElement | null) => {
      fila.current = nodo
      setNodeRef(nodo)
    },
    [setNodeRef],
  )
  // Al abrirla (también desde el lápiz de la vista previa) la fila se trae a
  // la vista; la espera deja que el panel termine de desplegarse.
  useEffect(() => {
    if (!abierto) return
    const espera = setTimeout(() => fila.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 460)
    return () => clearTimeout(espera)
  }, [abierto])
  const oculto = bloque.visible === false
  const fueraDelPlan = !limites.bloques.includes(bloque.tipo)
  const conEstilo = Boolean(bloque.estilo && Object.values(bloque.estilo).some((valor) => valor !== undefined))
  const boton =
    'grid h-7 w-7 shrink-0 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-white'
  // Editar libre: el botón sólo en lo que pasa a lienzo; con candado si el plan no trae el lienzo.
  const noLibre = motivoNoLibre(bloque.tipo)
  const conLienzo = limites.bloques.includes('lienzo')
  const planLienzo = planMinimo((plan) => plan.bloques.includes('lienzo'))

  return (
    <li
      ref={unirRef}
      style={{ transform: CSS.Transform.toString(transform), transition, scrollMarginTop: 12 }}
      className={cn(
        'relative rounded-[10px] border bg-sitio-campo transition-[border-color,box-shadow]',
        abierto ? 'border-white/30' : 'border-sitio-borde hover:border-white/15',
        isDragging && 'z-10 scale-[1.02] border-white/30 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.95)]',
      )}
    >
      {destino && (
        <motion.span
          layoutId="linea-insercion"
          className="absolute -top-[5px] right-1 left-1 h-[2px] rounded-full bg-sitio-azul-claro shadow-[0_0_12px_rgba(107,141,255,0.8)]"
        />
      )}
      <div className="flex items-center gap-0.5 py-1.5 pr-1.5 pl-1">
        <button
          type="button"
          aria-label={`Reordenar ${etiquetaBloque(bloque)}`}
          className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-sitio-tenue hover:text-white active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        <button type="button" onClick={alAbrir} className={cn('min-w-0 flex-1 py-1 text-left', oculto && 'opacity-45')}>
          <span className="flex items-center gap-2 text-[13px] text-white">
            {etiquetaBloque(bloque)}
            {conEstilo && <span title="Con estilo propio" className="h-1.5 w-1.5 rounded-full bg-sitio-azul-claro" />}
            {fueraDelPlan && <PlanRequerido plan={planMinimo((plan) => plan.bloques.includes(bloque.tipo))} />}
          </span>
          <span className="block truncate text-[11.5px] text-sitio-tenue">{resumenBloque(bloque) || '—'}</span>
        </button>

        {alEditarLibre && !noLibre && (
          <button
            type="button"
            onClick={conLienzo ? alEditarLibre : undefined}
            aria-disabled={!conLienzo}
            aria-label="Editar libre"
            title={conLienzo ? 'Editar libre: mueve y estira cada pieza' : `Editar libre: desde el plan ${planLienzo}`}
            className={cn(boton, !conLienzo && 'cursor-not-allowed hover:bg-transparent hover:text-sitio-tenue')}
          >
            {conLienzo ? <Move aria-hidden="true" className="h-3.5 w-3.5" /> : <Lock aria-hidden="true" className="h-3 w-3" />}
          </button>
        )}
        {alDuplicar && (
          <button type="button" onClick={alDuplicar} aria-label="Duplicar sección" title="Duplicar" className={boton}>
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={alAlternar}
          aria-label={oculto ? 'Mostrar sección' : 'Ocultar sección'}
          title={oculto ? 'Mostrar' : 'Ocultar'}
          className={boton}
        >
          {oculto ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
        <button type="button" onClick={alAbrir} aria-label={abierto ? 'Cerrar' : 'Editar'} className={boton}>
          <ChevronDown
            aria-hidden="true"
            className={cn('h-4 w-4 transition-transform duration-[450ms] ease-salida', abierto && 'rotate-180')}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: CURVA }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3.5 border-t border-sitio-borde px-3 pt-3 pb-3">
              <Segmentado
                opciones={[
                  { valor: 'contenido', etiqueta: 'Contenido' },
                  {
                    valor: 'estilo',
                    etiqueta: (
                      <span className="flex items-center gap-1">
                        Estilo
                        {limites.estiloSeccion === 'ninguno' && <Lock aria-hidden="true" className="h-2.5 w-2.5" />}
                      </span>
                    ),
                  },
                ]}
                valor={pestana}
                alCambiar={setPestana}
                chico
              />
              {fueraDelPlan && (
                <Candado plan={planMinimo((plan) => plan.bloques.includes(bloque.tipo))}>
                  Esta sección no está en tu plan: quítala para poder guardar.
                </Candado>
              )}
              {pestana === 'contenido' ? (
                <CamposBloque
                  bloque={bloque}
                  alCambiar={alCambiarProps}
                  alError={alError}
                  alSubiendo={alSubiendo}
                  limites={limites}
                  categorias={categorias}
                />
              ) : (
                <CamposEstilo
                  estilo={bloque.estilo ?? {}}
                  alCambiar={alCambiarEstilo}
                  limites={limites}
                  alError={alError}
                  alSubiendo={alSubiendo}
                  esquemas={esquemas}
                />
              )}
              {alEditarLibre && bloque.tipo !== 'lienzo' && (
                noLibre ? (
                  <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-sitio-tenue">
                    <Move aria-hidden="true" className="mt-[3px] h-3 w-3 shrink-0" />
                    {noLibre}
                  </p>
                ) : conLienzo ? (
                  <button
                    type="button"
                    onClick={alEditarLibre}
                    className="flex h-8 items-center justify-center gap-2 rounded-lg border border-sitio-borde text-[12px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
                  >
                    <Move aria-hidden="true" className="h-3.5 w-3.5" />
                    Editar libre
                  </button>
                ) : (
                  <Candado plan={planLienzo}>Editar libre: mueve y estira cada pieza de esta sección.</Candado>
                )
              )}
              <button
                type="button"
                onClick={alQuitar}
                className="inline-flex items-center gap-1.5 self-start text-[11.5px] text-sitio-rojo/80 transition-colors hover:text-sitio-rojo"
              >
                <Trash2 aria-hidden="true" className="h-3 w-3" />
                Eliminar sección
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
