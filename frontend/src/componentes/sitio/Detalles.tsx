import type { LucideIcon } from 'lucide-react'
import { Revelar } from './Revelar'

export interface Detalle {
  icono: LucideIcon
  titulo: string
  texto: string
  /** Desde qué plan, dicho en voz baja. */
  plan?: string
}

/** Tarjetas con ícono, título y una línea: lo que trae un producto, dicho corto. */
export function Detalles({ detalles, columnas = 3 }: { detalles: Detalle[]; columnas?: 3 | 4 }) {
  return (
    <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${columnas === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {detalles.map((detalle, indice) => (
        <Revelar key={detalle.titulo} retardo={indice * 0.06}>
          <article className="baldosa flex h-full flex-col gap-5 p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/12 text-sitio-azul-claro">
                <detalle.icono aria-hidden="true" strokeWidth={1.5} className="h-[18px] w-[18px]" />
              </span>
              {detalle.plan && <span className="text-[10.5px] tracking-[0.14em] text-white/40 uppercase">{detalle.plan}</span>}
            </div>
            <div>
              <h3 className="text-[19px] tracking-[-0.02em]">{detalle.titulo}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{detalle.texto}</p>
            </div>
          </article>
        </Revelar>
      ))}
    </div>
  )
}
