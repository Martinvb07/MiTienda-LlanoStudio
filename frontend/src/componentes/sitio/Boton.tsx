import Link from 'next/link'
import { cn } from '@/utilidades/clases'

type Variante = 'primario' | 'secundario' | 'claro'
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
  primario:
    'bg-sitio-azul text-white hover:bg-sitio-azul-fuerte shadow-[0_1px_2px_rgba(10,15,28,0.16)]',
  secundario:
    'bg-white text-sitio-tinta border border-sitio-borde-fuerte hover:border-sitio-tinta',
  claro: 'bg-white text-sitio-profundo hover:bg-sitio-crema',
}

const TAMANOS: Record<Tamano, string> = {
  normal: 'px-5 py-2.5 text-sm',
  grande: 'px-7 py-3.5 text-base',
}

/**
 * La flecha se desplaza al pasar el cursor. Es un gesto mínimo, pero es lo que
 * hace que el botón se sienta vivo sin recurrir a una animación aparatosa.
 */
export function Boton({
  href,
  children,
  variante = 'primario',
  tamano = 'normal',
  flecha = false,
  className,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
    >
      {children}
      {flecha && (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
        >
          <path
            d="M2.5 8h11m0 0L9 3.5M13.5 8L9 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Link>
  )
}
