import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PantallaProductos } from '@/componentes/panel/PantallaProductos'

export const metadata: Metadata = { title: 'Productos' }

export default function PaginaProductos() {
  return (
    <Suspense>
      <PantallaProductos />
    </Suspense>
  )
}
