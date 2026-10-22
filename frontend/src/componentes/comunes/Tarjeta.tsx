import { cn } from '@/utilidades/clases'

interface Props {
  titulo?: string
  descripcion?: string
  children?: React.ReactNode
  className?: string
}

/** Panel oscuro del tablero, como los de llanostudio.co/admin. */
export function Tarjeta({ titulo, descripcion, children, className }: Props) {
  return (
    <section className={cn('rounded-[14px] border border-sitio-borde bg-sitio-superficie p-6', className)}>
      {titulo && <h2 className="text-[15px] font-medium tracking-[-0.01em]">{titulo}</h2>}
      {descripcion && <p className="mt-1 text-[13px] text-sitio-tenue">{descripcion}</p>}
      {children && <div className={cn(titulo || descripcion ? 'mt-5' : undefined)}>{children}</div>}
    </section>
  )
}
