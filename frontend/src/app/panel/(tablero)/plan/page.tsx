import type { Metadata } from 'next'
import { PantallaPlan } from '@/componentes/panel/PantallaPlan'

export const metadata: Metadata = { title: 'Plan y pagos' }

export default function PaginaPlan() {
  return <PantallaPlan />
}
