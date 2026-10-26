import type { Metadata } from 'next'
import { PantallaResenas } from '@/componentes/panel/PantallaResenas'
import { SoloTienda } from '@/componentes/panel/SoloTienda'

export const metadata: Metadata = { title: 'Opiniones' }

export default function PaginaResenas() {
  return (
    <SoloTienda titulo="Opiniones">
      <PantallaResenas />
    </SoloTienda>
  )
}
