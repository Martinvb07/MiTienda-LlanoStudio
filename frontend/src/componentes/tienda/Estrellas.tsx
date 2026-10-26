import { Star } from 'lucide-react'

/** Cinco estrellas con la parte que corresponde llena (admite medias: 4,5). */
export function Estrellas({ valor, tamano = 'h-4 w-4', className = '' }: { valor: number; tamano?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${valor.toLocaleString('es-CO')} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((posicion) => {
        const lleno = Math.max(0, Math.min(1, valor - posicion + 1))
        return (
          <span key={posicion} className={`relative ${tamano}`}>
            <Star aria-hidden="true" className={`absolute inset-0 ${tamano} text-tinta/20`} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${lleno * 100}%` }}>
              <Star aria-hidden="true" className={`${tamano} fill-amber-400 text-amber-400`} strokeWidth={1.5} />
            </span>
          </span>
        )
      })}
    </span>
  )
}
