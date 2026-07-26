import { cn } from '@/utilidades/clases'

/** Ancho común de todas las secciones del sitio. */
export function Contenedor({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-6xl px-6 lg:px-8', className)}>{children}</div>
}

/**
 * Rótulo de sección con número y filete.
 *
 * El índice numerado le da al recorrido una lectura editorial y evita que cada
 * bloque parezca empezar de cero.
 */
export function Rotulo({ indice, children }: { indice: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-display text-xs font-medium tracking-[0.18em] text-sitio-tenue uppercase">
      <span className="text-sitio-azul">{indice}</span>
      <span className="h-px w-8 bg-sitio-borde-fuerte" />
      <span>{children}</span>
    </div>
  )
}
