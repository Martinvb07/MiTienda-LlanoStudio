import { ArrowUpRight } from 'lucide-react'
import type { PropsEnlaces } from '@/tipos/bloques'
import type { AjustesTienda } from '@/tipos/tienda'
import { IconoBloque } from '@/componentes/comunes/IconoBloque'
import { hrefEnlace } from '@/utilidades/enlacesBio'

const ESTILOS = {
  relleno: 'bg-marca text-marca-contraste shadow-[0_10px_24px_-14px_var(--marca)] hover:shadow-[0_16px_30px_-14px_var(--marca)]',
  contorno: 'border-2 border-marca text-tinta hover:bg-marca hover:text-marca-contraste',
  suave: 'bg-tinta/[0.06] text-tinta ring-1 ring-tinta/10 hover:bg-tinta/10',
} as const

/**
 * Los botones de la bio, uno debajo del otro y a lo ancho. Entran escalonados
 * (globals.css, .bio-entrada) y el destacado lleva un brillo que pasa cada
 * tanto para que se vea primero.
 */
export function Enlaces({ titulo, estilo = 'relleno', items, ajustes }: PropsEnlaces & { ajustes?: AjustesTienda }) {
  if (items.length === 0) return null

  return (
    <section className="px-6 py-4">
      {titulo && <h2 className="mb-4 text-center text-sm font-semibold tracking-[0.14em] text-tinta/60 uppercase">{titulo}</h2>}
      <ul className="bio-entrada space-y-3">
        {items.map((enlace) => {
          const href = hrefEnlace(enlace, ajustes)
          const externo = /^https?:/.test(href)
          return (
            <li key={enlace.id}>
              <a
                href={href}
                {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                data-destacado={enlace.destacado || undefined}
                className={`boton-tienda enlace-bio group relative flex min-h-[58px] w-full items-center gap-3 overflow-hidden rounded-(--radius-marca) px-4 py-3 transition-[transform,background-color,color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] ${ESTILOS[estilo]}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center">
                  <IconoBloque valor={enlace.icono} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-center">
                  <span className="block font-medium leading-snug">{enlace.texto}</span>
                  {enlace.descripcion && <span className="mt-0.5 block text-[13px] leading-snug tracking-normal normal-case opacity-70">{enlace.descripcion}</span>}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:opacity-70">
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
