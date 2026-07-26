import { cn } from '@/utilidades/clases'

interface Props {
  titulo?: string
  descripcion?: string
  children?: React.ReactNode
  className?: string
}

export function Tarjeta({ titulo, descripcion, children, className }: Props) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-6', className)}>
      {titulo && <h2 className="font-semibold text-slate-900">{titulo}</h2>}
      {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      {children && <div className={cn(titulo || descripcion ? 'mt-4' : undefined)}>{children}</div>}
    </section>
  )
}
