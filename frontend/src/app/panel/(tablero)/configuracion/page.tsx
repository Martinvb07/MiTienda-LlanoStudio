import type { Metadata } from 'next'
import { PantallaConfiguracion } from '@/componentes/panel/PantallaConfiguracion'

export const metadata: Metadata = { title: 'Configuración' }

export default function PaginaConfiguracion() {
  return <PantallaConfiguracion />
}
