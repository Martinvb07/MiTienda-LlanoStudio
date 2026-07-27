import type { Metadata } from 'next'
import { FormularioIngreso } from '@/componentes/panel/FormularioIngreso'

export const metadata: Metadata = { title: 'Ingresar' }

/**
 * La página queda como componente de servidor y el formulario vive aparte como
 * componente de cliente: un archivo con 'use client' no puede exportar
 * `metadata`, y sin ella la pestaña perdería su título.
 */
export default function PaginaIngresar() {
  return <FormularioIngreso />
}
