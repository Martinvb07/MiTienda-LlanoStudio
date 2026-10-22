import Link from 'next/link'
import { cn } from '@/utilidades/clases'

type Variante = 'primario' | 'secundario'
type Tamano = 'normal' | 'grande'

interface Props {
  href: string
  children: React.ReactNode
  variante?: Variante
  tamano?: Tamano
  flecha?: boolean
  className?: string
}

const VARIANTES: Record<Variante, string> = {
  primario: 'boton-primario',
  secundario: 'boton-contorno',
}

/**
 * Botón de la web comercial, el mismo de llanostudio.co: blanco sólido o
 * contorno, en mayúsculas finas. La flecha se desplaza al pasar el cursor.
 */
export function Boton({
  href,
  children,
  variante = 'primario',
  tamano = 'grande',
  flecha = false,
  className,
}: Props) {
  return (
    <Link
      href={href}
      className={cn('group boton', VARIANTES[variante], tamano === 'normal' && 'boton-chico', className)}
    >
      {children}
      {flecha && <Flecha className="h-[15px] w-[15px] transition-transform duration-500 ease-salida group-hover:translate-x-1" />}
    </Link>
  )
}

export function Flecha({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
