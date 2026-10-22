'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, LayoutGrid, LogOut, Package, Settings, Store } from 'lucide-react'
import { cerrarSesion } from '@/servicios/panel'
import { urlTienda } from '@/utilidades/dominios'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'

const ENLACES = [
  { href: '/panel', etiqueta: 'Resumen', Icono: LayoutGrid },
  { href: '/panel/plantillas', etiqueta: 'Mi tienda', Icono: Store },
  { href: '/panel/productos', etiqueta: 'Productos', Icono: Package },
  { href: '/panel/configuracion', etiqueta: 'Configuración', Icono: Settings },
] as const

/** Barra lateral del panel: marca, tienda, navegación y cuenta. */
export function NavegacionPanel() {
  const rutaActual = usePathname()
  const { sesion } = useSesion()
  const iniciales = (sesion.tienda?.nombre ?? sesion.usuario.nombre)
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')

  function salir() {
    cerrarSesion()
    window.location.assign('/panel/ingresar')
  }

  return (
    <aside className="flex shrink-0 flex-col border-sitio-borde bg-[#0a0a0b] md:sticky md:top-0 md:h-screen md:w-[248px] md:border-r">
      <div className="flex items-center justify-between gap-3 border-b border-sitio-borde px-4 py-4 md:block md:border-0 md:px-5 md:pt-6">
        <Link href="/panel" className="flex items-center gap-[11px]">
          <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-7 w-auto" />
          <span className="flex flex-col">
            <span className="text-[15px] leading-none font-semibold tracking-[-0.02em]">Mi Tienda</span>
            <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">Panel</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={salir}
          className="text-[11px] tracking-[0.09em] text-sitio-tenue uppercase md:hidden"
        >
          Salir
        </button>
      </div>

      <a
        href={urlTienda(sesion.tenant.subdominio)}
        target="_blank"
        rel="noopener noreferrer"
        className="group mx-4 mt-6 hidden items-center gap-3 rounded-[10px] border border-sitio-borde bg-white/[0.02] p-3 transition-colors hover:border-white/20 md:flex"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-xs font-semibold text-black">
          {iniciales || 'MT'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{sesion.tienda?.nombre ?? 'Mi tienda'}</span>
          <span className="block truncate text-[11px] text-sitio-tenue group-hover:text-sitio-suave">
            Ver tienda <ArrowUpRight aria-hidden="true" className="inline h-3 w-3" />
          </span>
        </span>
      </a>

      <nav className="flex gap-1 overflow-x-auto px-3 py-2 md:mt-5 md:flex-col md:overflow-visible md:px-3 md:py-0">
        {ENLACES.map((enlace) => {
          const activo =
            enlace.href === '/panel' ? rutaActual === '/panel' : rutaActual.startsWith(enlace.href)
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors',
                activo ? 'bg-white/[0.08] text-white' : 'text-sitio-suave hover:bg-white/[0.04] hover:text-white',
              )}
            >
              <enlace.Icono aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              {enlace.etiqueta}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto hidden border-t border-sitio-borde p-4 md:block">
        <p className="truncate text-[13px]">{sesion.usuario.nombre}</p>
        <p className="truncate text-[11.5px] text-sitio-tenue">{sesion.usuario.email}</p>
        <button
          type="button"
          onClick={salir}
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] tracking-[0.09em] text-sitio-tenue uppercase transition-colors hover:text-white"
        >
          <LogOut aria-hidden="true" className="h-3 w-3" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
