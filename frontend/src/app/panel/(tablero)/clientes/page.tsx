import type { Metadata } from 'next'
import { PantallaClientes } from '@/componentes/panel/PantallaClientes'

export const metadata: Metadata = { title: 'Clientes' }

export default function PaginaClientes() {
  return <PantallaClientes />
}
