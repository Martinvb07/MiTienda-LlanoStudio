import type { Metadata } from 'next'
import { PantallaPedidos } from '@/componentes/panel/PantallaPedidos'
import { SoloTienda } from '@/componentes/panel/SoloTienda'

export const metadata: Metadata = { title: 'Pedidos' }

export default function PaginaPedidos() {
  return (
    <SoloTienda titulo="Pedidos">
      <PantallaPedidos />
    </SoloTienda>
  )
}
