import type { Metadata } from 'next'
import { FormularioRegistro } from '@/componentes/panel/FormularioRegistro'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function PaginaCrearCuenta() {
  return <FormularioRegistro />
}
