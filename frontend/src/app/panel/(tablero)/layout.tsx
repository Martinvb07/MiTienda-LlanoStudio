import Link from 'next/link'
import Image from 'next/image'
import { NavegacionPanel } from '@/componentes/panel/NavegacionPanel'

/**
 * Marco del tablero de administración. Siempre se sirve en
 * mitienda.llanostudio.co; el middleware garantiza que ningún dominio de tienda
 * llegue hasta aquí.
 */
export default function LayoutTablero({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sitio-crema font-sans text-sitio-tinta">
      <header className="sticky top-0 z-40 border-b border-sitio-borde bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/panel"
            className="flex items-center gap-2.5 font-display font-bold tracking-tight"
          >
            <Image
              src="/llanostudio-marca-oscura.png"
              alt="Llano Studio"
              width={220}
              height={194}
              className="h-6 w-auto"
            />
            Mi Tienda
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-sitio-tenue sm:block">Ropa Llanera</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sitio-azul font-display text-xs font-semibold text-white">
              RL
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-8">
        <aside className="w-48 shrink-0">
          <NavegacionPanel />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
