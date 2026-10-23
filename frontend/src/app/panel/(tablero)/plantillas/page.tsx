import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PantallaTienda } from '@/componentes/panel/PantallaTienda'

export const metadata: Metadata = { title: 'Mi sitio' }

/**
 * "Mi sitio": vista previa del diseño actual y entrada al editor. El diseño
 * se guarda como JSON de bloques en Tienda.configuracionBloques, nunca como HTML.
 */
export default function PaginaPlantillas() {
  return (
    <Suspense>
      <PantallaTienda />
    </Suspense>
  )
}
