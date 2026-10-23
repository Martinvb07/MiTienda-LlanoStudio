import type { Metadata } from 'next'
import { PantallaDescuentos } from '@/componentes/panel/PantallaDescuentos'
import { SoloTienda } from '@/componentes/panel/SoloTienda'

export const metadata: Metadata = { title: 'Descuentos' }

export default function PaginaDescuentos() {
  return (
    <SoloTienda titulo="Descuentos">
      <PantallaDescuentos />
    </SoloTienda>
  )
}
