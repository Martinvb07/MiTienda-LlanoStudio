import type { Metadata } from 'next'
import { Pantalla404 } from '@/componentes/comunes/Pantalla404'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
}

/** 404 de la web comercial y del panel (las tiendas tienen la suya, con su tema). */
export default function NoEncontrada() {
  return <Pantalla404 />
}
