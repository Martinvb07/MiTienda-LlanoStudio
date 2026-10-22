import type { Metadata } from 'next'
import { PantallaAdmin } from '@/componentes/admin/PantallaAdmin'

export const metadata: Metadata = { title: 'Administración' }

/** Panel de la plataforma: todas las tiendas, sus planes y su estado. Sólo Llano Studio. */
export default function PaginaAdmin() {
  return <PantallaAdmin />
}
