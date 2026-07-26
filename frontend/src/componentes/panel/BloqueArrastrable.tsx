'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ETIQUETAS_BLOQUE, type Bloque } from '@/tipos/bloques'
import { cn } from '@/utilidades/clases'

interface Props {
  bloque: Bloque
  onQuitar: (id: string) => void
  onAlternarVisibilidad: (id: string) => void
}

/** Fila arrastrable del editor. El asa es sólo el icono, para que los botones sigan siendo clicables. */
export function BloqueArrastrable({ bloque, onQuitar, onAlternarVisibilidad }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloque.id,
  })

  const estilo = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const oculto = bloque.visible === false

  return (
    <li
      ref={setNodeRef}
      style={estilo}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4',
        isDragging && 'z-10 shadow-lg ring-2 ring-slate-900/10',
        oculto && 'opacity-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-slate-400 active:cursor-grabbing"
        aria-label={`Reordenar ${ETIQUETAS_BLOQUE[bloque.tipo]}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{ETIQUETAS_BLOQUE[bloque.tipo]}</p>
        <p className="truncate text-sm text-slate-500">
          {'titulo' in bloque.props && bloque.props.titulo
            ? bloque.props.titulo
            : bloque.id}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onAlternarVisibilidad(bloque.id)}
        className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
      >
        {oculto ? 'Mostrar' : 'Ocultar'}
      </button>

      <button
        type="button"
        onClick={() => onQuitar(bloque.id)}
        className="rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
      >
        Quitar
      </button>
    </li>
  )
}
