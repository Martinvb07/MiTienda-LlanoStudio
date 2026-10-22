import type { Metadata } from 'next'
import { PantallaEstadisticas } from '@/componentes/panel/PantallaEstadisticas'

export const metadata: Metadata = { title: 'Estadísticas' }

export default function PaginaEstadisticas() {
  return <PantallaEstadisticas />
}
