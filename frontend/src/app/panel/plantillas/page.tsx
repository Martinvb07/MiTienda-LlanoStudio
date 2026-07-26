import type { Metadata } from 'next'
import { EditorBloques } from '@/componentes/panel/EditorBloques'
import { Tarjeta } from '@/componentes/comunes/Tarjeta'
import { bloquesPorDefecto } from '@/tipos/bloques'

export const metadata: Metadata = { title: 'Diseño' }

/**
 * Editor visual de la tienda.
 *
 * Los bloques vienen de `bloquesPorDefecto` mientras no exista el endpoint del
 * panel; cuando esté, se cargarán de Tienda.configuracionBloques y se guardarán
 * ahí mismo. El editor ya trabaja con la forma final de los datos.
 */
export default function PaginaPlantillas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Diseño de la tienda</h1>
        <p className="mt-1 text-slate-500">
          Arrastra los bloques para reordenar tu página. Los cambios se guardan como JSON, no
          como HTML.
        </p>
      </div>

      <Tarjeta>
        <EditorBloques bloquesIniciales={bloquesPorDefecto('Mi tienda')} />
      </Tarjeta>
    </div>
  )
}
