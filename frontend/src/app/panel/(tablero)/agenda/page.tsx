import type { Metadata } from 'next'
import { PantallaAgenda } from '@/componentes/panel/PantallaAgenda'

export const metadata: Metadata = { title: 'Agenda' }

export default function PaginaAgenda() {
  return <PantallaAgenda />
}
