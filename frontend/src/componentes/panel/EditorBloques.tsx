'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ETIQUETAS_BLOQUE, type Bloque, type TipoBloque } from '@/tipos/bloques'
import { useEditorBloques } from '@/hooks/useEditorBloques'
import { BloqueArrastrable } from './BloqueArrastrable'

interface Props {
  bloquesIniciales: Bloque[]
}

const TIPOS_DISPONIBLES = Object.keys(ETIQUETAS_BLOQUE) as TipoBloque[]

/**
 * Editor visual del diseño de la tienda.
 *
 * Trabaja siempre sobre el array de bloques; el resultado es lo que se guardará
 * en Tienda.configuracionBloques y lo que la tienda pública renderiza. El
 * guardado contra la API queda pendiente de la fase del panel.
 */
export function EditorBloques({ bloquesIniciales }: Props) {
  const { bloques, sucio, alSoltar, anadirBloque, quitarBloque, alternarVisibilidad } =
    useEditorBloques(bloquesIniciales)

  // PointerSensor con distancia mínima: si no, un clic en "Quitar" contaría
  // como el inicio de un arrastre.
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Añadir bloque:</span>
        {TIPOS_DISPONIBLES.map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => anadirBloque(tipo)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            + {ETIQUETAS_BLOQUE[tipo]}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensores}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={alSoltar}
      >
        <SortableContext
          items={bloques.map((bloque) => bloque.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {bloques.map((bloque) => (
              <BloqueArrastrable
                key={bloque.id}
                bloque={bloque}
                onQuitar={quitarBloque}
                onAlternarVisibilidad={alternarVisibilidad}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {bloques.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          Todavía no hay bloques. Añade uno para empezar a diseñar.
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500">
          {sucio ? 'Hay cambios sin guardar' : 'Todo guardado'}
        </p>
        {/* TODO: PATCH /api/panel/tienda/bloques con el array actual. */}
        <button
          type="button"
          disabled={!sucio}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          Guardar diseño
        </button>
      </div>
    </div>
  )
}
