import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PantallaProductos } from '@/componentes/panel/PantallaProductos'
import { SoloTienda } from '@/componentes/panel/SoloTienda'

export const metadata: Metadata = { title: 'Productos' }

export default function PaginaProductos() {
  return (
    <Suspense>
      <SoloTienda titulo="Productos">
        <PantallaProductos />
      </SoloTienda>
    </Suspense>
  )
}
