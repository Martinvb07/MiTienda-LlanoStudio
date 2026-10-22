'use client'

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
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { BloqueFicha, PlantillaProducto } from '@/tipos/tienda'
import { ETIQUETAS_FICHA, plantillaCompleta } from '@/utilidades/fichaProducto'
import { cn } from '@/utilidades/clases'
import { Campo, CampoArea, Interruptor, Seccion, Segmentado } from '../ui/basicos'

interface Props {
  plantilla?: PlantillaProducto
  alCambiar: (plantilla: PlantillaProducto) => void
}

function Pieza({ id, visible, alAlternar }: { id: BloqueFicha; visible: boolean; alAlternar: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-1 rounded-[10px] border border-sitio-borde bg-[#121214] py-1 pr-1.5 pl-1',
        isDragging && 'relative z-10 border-white/30 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9)]',
      )}
    >
      <button
        type="button"
        aria-label={`Mover ${ETIQUETAS_FICHA[id]}`}
        className="grid h-8 w-6 cursor-grab touch-none place-items-center text-sitio-tenue hover:text-white"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="h-4 w-4" />
      </button>
      <span className={cn('flex-1 text-[13px]', !visible && 'text-sitio-tenue line-through')}>{ETIQUETAS_FICHA[id]}</span>
      <button
        type="button"
        onClick={alAlternar}
        aria-label={visible ? 'Ocultar' : 'Mostrar'}
        className="grid h-7 w-7 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-white"
      >
        {visible ? <Eye aria-hidden="true" className="h-4 w-4" /> : <EyeOff aria-hidden="true" className="h-4 w-4" />}
      </button>
    </li>
  )
}

/** Plantilla de la página de producto: piezas en orden, fotos y extras. */
export function CamposFicha({ plantilla, alCambiar }: Props) {
  const completa = plantillaCompleta(plantilla)
  const cambiar = (cambios: Partial<PlantillaProducto>) => alCambiar({ ...completa, ...cambios })
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const desde = completa.orden.findIndex((pieza) => pieza.id === active.id)
    const hasta = completa.orden.findIndex((pieza) => pieza.id === over.id)
    cambiar({ orden: arrayMove(completa.orden, desde, hasta) })
  }

  return (
    <>
      <Seccion titulo="Información del producto" abierta>
        <p className="text-[11.5px] leading-relaxed text-sitio-tenue">
          Arrastra para cambiar el orden y usa el ojo para mostrar u ocultar cada pieza.
        </p>
        <DndContext sensors={sensores} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={alSoltar}>
          <SortableContext items={completa.orden.map((pieza) => pieza.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-1.5">
              {completa.orden.map((pieza) => (
                <Pieza
                  key={pieza.id}
                  id={pieza.id}
                  visible={pieza.visible}
                  alAlternar={() =>
                    cambiar({
                      orden: completa.orden.map((otra) => (otra.id === pieza.id ? { ...otra, visible: !otra.visible } : otra)),
                    })
                  }
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <Interruptor activo={completa.fijarInfo} alCambiar={(fijarInfo) => cambiar({ fijarInfo })}>
          La información acompaña al bajar por las fotos
        </Interruptor>
      </Seccion>

      <Seccion titulo="Fotos">
        <Segmentado
          opciones={[
            { valor: 'miniaturas', etiqueta: 'Con miniaturas' },
            { valor: 'cuadricula', etiqueta: 'Cuadrícula' },
            { valor: 'apiladas', etiqueta: 'Una debajo de otra' },
          ]}
          valor={completa.galeria}
          alCambiar={(galeria) => cambiar({ galeria })}
          chico
        />
      </Seccion>

      <Seccion titulo="Envío y pestañas">
        <CampoArea
          etiqueta="Información de envío"
          valor={completa.textoEnvio}
          alCambiar={(textoEnvio) => cambiar({ textoEnvio })}
          filas={2}
          maximo={200}
        />
        <span className="text-[11.5px] text-sitio-suave">Pestañas desplegables</span>
        {completa.acordeones.map((acordeon) => (
          <div key={acordeon.id} className="flex flex-col gap-2 rounded-[10px] border border-sitio-borde bg-white/[0.02] p-2.5">
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <Campo
                  etiqueta="Título"
                  valor={acordeon.titulo}
                  alCambiar={(titulo) =>
                    cambiar({ acordeones: completa.acordeones.map((otro) => (otro.id === acordeon.id ? { ...otro, titulo } : otro)) })
                  }
                  maximo={60}
                />
              </div>
              <button
                type="button"
                aria-label="Quitar pestaña"
                onClick={() => cambiar({ acordeones: completa.acordeones.filter((otro) => otro.id !== acordeon.id) })}
                className="grid h-[38px] w-8 place-items-center text-sitio-tenue hover:text-red-300"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
            <CampoArea
              etiqueta="Texto"
              valor={acordeon.texto}
              alCambiar={(texto) =>
                cambiar({ acordeones: completa.acordeones.map((otro) => (otro.id === acordeon.id ? { ...otro, texto } : otro)) })
              }
              filas={3}
              maximo={1000}
            />
          </div>
        ))}
        {completa.acordeones.length < 8 && (
          <button
            type="button"
            onClick={() =>
              cambiar({ acordeones: [...completa.acordeones, { id: Date.now().toString(36), titulo: 'Nueva pestaña', texto: '' }] })
            }
            className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-sitio-borde text-[12px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Agregar pestaña
          </button>
        )}
      </Seccion>

      <Seccion titulo="Productos relacionados">
        <Interruptor activo={completa.relacionados} alCambiar={(relacionados) => cambiar({ relacionados })}>
          Mostrar productos relacionados
          <small className="block text-[11.5px] text-sitio-tenue">Primero los de la misma categoría.</small>
        </Interruptor>
        {completa.relacionados && (
          <Campo
            etiqueta="Título"
            valor={completa.tituloRelacionados}
            alCambiar={(tituloRelacionados) => cambiar({ tituloRelacionados })}
            maximo={60}
          />
        )}
      </Seccion>
    </>
  )
}
