import type { Metadata } from 'next'
import { PantallaDescuentos } from '@/componentes/panel/PantallaDescuentos'

export const metadata: Metadata = { title: 'Descuentos' }

export default function PaginaDescuentos() {
  return <PantallaDescuentos />
}
