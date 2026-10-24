import Link from 'next/link'
import type { OpcionMenu } from './productos'
import { cn } from '@/utilidades/clases'

/** En el celular no caben los nombres completos. */
const CORTOS: Record<OpcionMenu['clave'], string> = { tienda: 'Tienda', pagina: 'Página', enlaces: 'Enlaces' }

/**
 * Pestañas con los tres productos bajo el titular de Plantillas y Precios:
 * se cambia de uno a otro sin volver al menú. Lo que aún no existe se ve,
 * pero no se puede tocar.
 */
export function SelectorProducto({ opciones, actual }: { opciones: readonly OpcionMenu[]; actual: OpcionMenu['clave'] }) {
  return (
    <nav aria-label="Producto" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/12 bg-white/[0.03] p-1">
      {opciones.map((opcion) => {
        const elegido = opcion.clave === actual
        const contenido = (
          <>
            <opcion.icono aria-hidden="true" strokeWidth={1.6} className="h-[15px] w-[15px] shrink-0" />
            <span className="whitespace-nowrap sm:hidden">{CORTOS[opcion.clave]}</span>
            <span className="hidden whitespace-nowrap sm:inline">{opcion.nombre}</span>
            {!opcion.disponible && <span className="hidden text-[9.5px] tracking-[0.14em] uppercase opacity-60 sm:inline">Pronto</span>}
          </>
        )
        const clases = cn(
          'inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] sm:px-4 tracking-[-0.005em] transition-colors duration-300',
          elegido ? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.06] hover:text-white',
        )
        return opcion.disponible ? (
          <Link key={opcion.clave} href={opcion.href} aria-current={elegido ? 'page' : undefined} scroll={false} className={clases}>
            {contenido}
          </Link>
        ) : (
          <span key={opcion.clave} aria-disabled="true" className={cn(clases, 'cursor-not-allowed text-white/30 hover:bg-transparent hover:text-white/30')}>
            {contenido}
          </span>
        )
      })}
    </nav>
  )
}
