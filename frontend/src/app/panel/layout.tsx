import Link from 'next/link'
import type { Metadata } from 'next'
import { NavegacionPanel } from '@/componentes/panel/NavegacionPanel'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel de MiTienda' },
  // El panel nunca debe aparecer en buscadores.
  robots: { index: false, follow: false },
}

/**
 * Marco del panel de administración. Siempre se sirve en
 * mitienda.llanostudio.co; el middleware garantiza que ningún dominio de tienda
 * llegue hasta aquí.
 */
export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/panel" className="font-semibold tracking-tight">
            MiTienda
          </Link>
          <span className="text-sm text-slate-400">Llano Studio</span>
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
