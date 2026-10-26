import type { Metadata } from 'next'
import { PantallaMensajes } from '@/componentes/panel/PantallaMensajes'

export const metadata: Metadata = { title: 'Mensajes' }

export default function PaginaMensajes() {
  return <PantallaMensajes />
}
