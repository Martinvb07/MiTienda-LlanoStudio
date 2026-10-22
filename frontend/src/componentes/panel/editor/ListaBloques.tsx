'use client'

import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { ChevronDown, Eye, EyeOff, GripVertical, Plus, X } from 'lucide-react'
import {
  DESCRIPCIONES_BLOQUE,
  ETIQUETAS_BLOQUE,
  crearBloque,
  type Bloque,
  type TipoBloque,
} from '@/tipos/bloques'
import { cn } from '@/utilidades/clases'
import { planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { CURVA, Candado, PlanRequerido } from '../ui/basicos'
import { CamposBloque, resumenBloque } from './CamposBloque'

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
}

const TIPOS = Object.keys(ETIQUETAS_BLOQUE) as TipoBloque[]

/**
 * Secciones de la página, en orden. Se arrastran por el asa para reordenar,
 * se ocultan con el ojo y se abren para editar su contenido.
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
}: Props) {
  const [menu, setMenu] = useState(false)
  const lleno = bloques.length >= limites.secciones

  // Distancia mínima: si no, un clic en los botones de la fila contaría como arrastre.
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const desde = bloques.findIndex((bloque) => bloque.id === active.id)
    const hasta = bloques.findIndex((bloque) => bloque.id === over.id)
    if (desde !== -1 && hasta !== -1) alCambiar(arrayMove(bloques, desde, hasta))
  }

  function actualizar(id: string, cambios: Partial<Bloque>) {
    alCambiar(bloques.map((bloque) => (bloque.id === id ? ({ ...bloque, ...cambios } as Bloque) : bloque)))
  }

  function agregar(tipo: TipoBloque) {
    const nuevo = crearBloque(tipo)
    // El pie se queda al final; lo demás entra justo antes de él.
    const pie = bloques.findIndex((bloque) => bloque.tipo === 'pie')
    const posicion = tipo === 'anuncio' ? 0 : pie === -1 || tipo === 'pie' ? bloques.length : pie
    alCambiar([...bloques.slice(0, posicion), nuevo, ...bloques.slice(posicion)])
    alAbrir(nuevo.id)
    setMenu(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensores}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={alSoltar}
      >
        <SortableContext items={bloques.map((bloque) => bloque.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {bloques.map((bloque) => (
              <FilaBloque
                key={bloque.id}
                bloque={bloque}
                abierto={abierto === bloque.id}
                alAbrir={() => alAbrir(abierto === bloque.id ? null : bloque.id)}
                alAlternar={() => actualizar(bloque.id, { visible: bloque.visible === false })}
                alQuitar={() => {
                  alCambiar(bloques.filter((otro) => otro.id !== bloque.id))
                  if (abierto === bloque.id) alAbrir(null)
                }}
                alCambiarProps={(cambios) =>
                  actualizar(bloque.id, { props: { ...bloque.props, ...cambios } } as Partial<Bloque>)
                }
                alError={alError}
                alSubiendo={alSubiendo}
                limites={limites}
                categorias={categorias}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {bloques.length === 0 && (
        <p className="rounded-[10px] border border-dashed border-white/15 p-6 text-center text-[13px] text-sitio-tenue">
          Tu página está vacía. Agrega una sección para empezar.
        </p>
      )}

      {lleno && (
        <Candado plan={planMinimo((plan) => plan.secciones > bloques.length)}>
          Tu plan {limites.nombre} admite hasta {limites.secciones} secciones.
        </Candado>
      )}

      <button
        type="button"
        disabled={lleno && !menu}
        onClick={() => setMenu((valor) => !valor)}
        aria-expanded={menu}
        className="mt-1 flex h-10 items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/[0.18] text-[12.5px] text-sitio-suave transition-colors enabled:hover:border-white/50 enabled:hover:text-white disabled:opacity-40"
      >
        {menu ? <X aria-hidden="true" className="h-3.5 w-3.5" /> : <Plus aria-hidden="true" className="h-3.5 w-3.5" />}
        {menu ? 'Cerrar' : 'Agregar sección'}
      </button>

      <AnimatePresence initial={false}>
        {menu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: CURVA }}
            className="overflow-hidden"
          >
            <div className="grid gap-1.5 pt-1">
              {TIPOS.map((tipo) => {
                const incluido = limites.bloques.includes(tipo)
                return (
                <button
                  key={tipo}
                  type="button"
                  disabled={!incluido}
                  onClick={() => agregar(tipo)}
                  className="rounded-[10px] border border-sitio-borde bg-[#121214] px-3 py-2.5 text-left transition-colors enabled:hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center justify-between gap-2 text-[13px] text-white">
                    {ETIQUETAS_BLOQUE[tipo]}
                    {!incluido && <PlanRequerido plan={planMinimo((plan) => plan.bloques.includes(tipo))} />}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-sitio-tenue">
                    {DESCRIPCIONES_BLOQUE[tipo]}
                  </span>
                </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilaBloque({
  bloque,
  abierto,
  alAbrir,
  alAlternar,
  alQuitar,
  alCambiarProps,
  alError,
  alSubiendo,
  limites,
  categorias,
}: {
  bloque: Bloque
  abierto: boolean
  alAbrir: () => void
  alAlternar: () => void
  alQuitar: () => void
  alCambiarProps: (cambios: Record<string, unknown>) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  limites: LimitesPlan
  categorias?: string[]
}) {
  // Misma curva y duración que el reordenamiento del editor de llanostudio.co.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloque.id,
    transition: { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  })
  const oculto = bloque.visible === false
  const fueraDelPlan = !limites.bloques.includes(bloque.tipo)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-[10px] border bg-[#121214] transition-[border-color,box-shadow]',
        abierto ? 'border-white/30' : 'border-sitio-borde hover:border-white/15',
        isDragging && 'relative z-10 scale-[1.02] border-white/30 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.95)]',
      )}
    >
      <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-1">
        <button
          type="button"
          aria-label={`Reordenar ${ETIQUETAS_BLOQUE[bloque.tipo]}`}
          className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-sitio-tenue hover:text-white active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        <button type="button" onClick={alAbrir} className={cn('min-w-0 flex-1 py-1 text-left', oculto && 'opacity-45')}>
          <span className="flex items-center gap-2 text-[13px] text-white">
            {ETIQUETAS_BLOQUE[bloque.tipo]}
            {fueraDelPlan && <PlanRequerido plan={planMinimo((plan) => plan.bloques.includes(bloque.tipo))} />}
          </span>
          <span className="block truncate text-[11.5px] text-sitio-tenue">{resumenBloque(bloque) || '—'}</span>
        </button>

        <button
          type="button"
          onClick={alAlternar}
          aria-label={oculto ? 'Mostrar sección' : 'Ocultar sección'}
          title={oculto ? 'Mostrar' : 'Ocultar'}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-white"
        >
          {oculto ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={alAbrir}
          aria-label={abierto ? 'Cerrar' : 'Editar'}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-white"
        >
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
            <div className="flex flex-col gap-3.5 border-t border-sitio-borde px-3 pt-3.5 pb-3">
              {fueraDelPlan && (
                <Candado plan={planMinimo((plan) => plan.bloques.includes(bloque.tipo))}>
                  Esta sección no está en tu plan: quítala para poder guardar.
                </Candado>
              )}
              <CamposBloque
                bloque={bloque}
                alCambiar={alCambiarProps}
                alError={alError}
                alSubiendo={alSubiendo}
                limites={limites}
                categorias={categorias}
              />
              <button
                type="button"
                onClick={alQuitar}
                className="self-start text-[11.5px] text-sitio-rojo/80 transition-colors hover:text-sitio-rojo"
              >
                Eliminar sección
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
