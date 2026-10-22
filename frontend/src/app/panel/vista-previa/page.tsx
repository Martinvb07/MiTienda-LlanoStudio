import type { Metadata } from 'next'
import { LienzoVistaPrevia } from './LienzoVistaPrevia'

export const metadata: Metadata = { title: 'Vista previa' }

/** Página que vive dentro del iframe del editor. Sola no muestra nada. */
export default function PaginaVistaPrevia() {
  return <LienzoVistaPrevia />
}
