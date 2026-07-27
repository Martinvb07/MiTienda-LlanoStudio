import type { Metadata } from 'next'
import { Tarjeta } from '@/componentes/comunes/Tarjeta'

export const metadata: Metadata = { title: 'Productos' }

export default function PaginaProductos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="mt-1 text-slate-500">Catálogo de tu tienda.</p>
      </div>

      <Tarjeta
        titulo="Sin productos todavía"
        descripcion="El alta de productos y la subida de fotos a R2 llegan en la fase del panel. La cola de optimización de imágenes ya está lista para recibirlas."
      />
    </div>
  )
}
