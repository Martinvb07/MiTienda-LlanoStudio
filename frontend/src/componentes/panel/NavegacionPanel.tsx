'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilidades/clases'

const ENLACES = [
  { href: '/panel', etiqueta: 'Resumen' },
  { href: '/panel/productos', etiqueta: 'Productos' },
  { href: '/panel/plantillas', etiqueta: 'Diseño' },
  { href: '/panel/configuracion', etiqueta: 'Configuración' },
] as const

export function NavegacionPanel() {
  const rutaActual = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {ENLACES.map((enlace) => {
        const activo =
          enlace.href === '/panel' ? rutaActual === '/panel' : rutaActual.startsWith(enlace.href)

        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              activo ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {enlace.etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
