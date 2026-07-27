import type { Metadata } from 'next'
import { FormularioRecuperar } from '@/componentes/panel/FormularioRecuperar'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default function PaginaRecuperar() {
  return <FormularioRecuperar />
}
