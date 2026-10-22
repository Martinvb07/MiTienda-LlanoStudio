import type { Metadata } from 'next'
import { PantallaPedidos } from '@/componentes/panel/PantallaPedidos'

export const metadata: Metadata = { title: 'Pedidos' }

export default function PaginaPedidos() {
  return <PantallaPedidos />
}
