import { cn } from '@/utilidades/clases'

/** Ancho común de todas las secciones del sitio (el mismo de llanostudio.co). */
export function Contenedor({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-[22px] md:px-8', className)}>{children}</div>
}

/** Antetítulo de sección: mayúsculas espaciadas y tenues. */
export function Rotulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('antetitulo', className)}>{children}</span>
}
