'use client'

/* eslint-disable @next/next/no-img-element -- logo de la tienda subido por el usuario */
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import {
  ArrowUpRight,
  LayoutGrid,
  LogOut,
  Package,
  Paintbrush,
  Receipt,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cerrarSesion } from '@/servicios/panel'
import { urlTienda } from '@/utilidades/dominios'
import { limitesDe } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'
import { SALIDA } from './ui/movimiento'

interface Enlace {
  href: string
  etiqueta: string
  /** Nombre corto para las pestañas del celular. */
  corta: string
  Icono: typeof LayoutGrid
}

const GRUPOS: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: 'Tienda',
    enlaces: [
      { href: '/panel', etiqueta: 'Resumen', corta: 'Inicio', Icono: LayoutGrid },
      { href: '/panel/plantillas', etiqueta: 'Diseño', corta: 'Diseño', Icono: Paintbrush },
      { href: '/panel/productos', etiqueta: 'Productos', corta: 'Productos', Icono: Package },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [{ href: '/panel/configuracion', etiqueta: 'Configuración', corta: 'Ajustes', Icono: Settings }],
  },
]

const TODOS = GRUPOS.flatMap((grupo) => grupo.enlaces)

const esActivo = (href: string, ruta: string) => (href === '/panel' ? ruta === '/panel' : ruta.startsWith(href))

export function iniciales(texto: string) {
  return texto
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')
}

function salir() {
  cerrarSesion()
  window.location.assign('/panel/ingresar')
}

/** Logo de la tienda o, si no tiene, sus iniciales sobre blanco. */
export function SelloTienda({ className }: { className?: string }) {
  const { sesion } = useSesion()
  const logo = sesion.tienda?.logoUrl
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-xs font-semibold text-black',
        className,
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        iniciales(sesion.tienda?.nombre ?? sesion.usuario.nombre) || 'MT'
      )}
    </span>
  )
}

/**
 * Navegación del panel. En escritorio, barra lateral fija con grupos, una
 * píldora que se desliza al enlace activo y el plan abajo. En celular, barra
 * superior compacta y pestañas abajo, como una app.
 */
export function NavegacionPanel() {
  const ruta = usePathname()
  const { sesion } = useSesion()
  const publicada = sesion.tienda?.publicada ?? false
  const plan = limitesDe(sesion.tenant.plan)
  const esPro = sesion.tenant.plan === 'PRO'

  return (
    <>
      {/* ── Escritorio ── */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-sitio-borde bg-[#070707] md:flex">
        <Link href="/panel" className="flex items-center gap-[11px] px-6 pt-7">
          <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-7 w-auto" />
          <span className="flex flex-col">
            <span className="text-[15px] leading-none font-semibold tracking-[-0.02em]">Mi Tienda</span>
            <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">Panel</span>
          </span>
        </Link>

        <a
          href={urlTienda(sesion.tenant.subdominio)}
          target="_blank"
          rel="noopener noreferrer"
          className="group mx-4 mt-7 flex items-center gap-3 rounded-xl border border-sitio-borde bg-white/[0.025] p-3 transition-[border-color,background] duration-300 hover:border-white/20 hover:bg-white/[0.045]"
        >
          <SelloTienda className="h-10 w-10" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">{sesion.tienda?.nombre ?? 'Mi tienda'}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-sitio-tenue">
              <span className="relative flex h-1.5 w-1.5">
                {publicada && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sitio-verde opacity-60" />
                )}
                <span
                  className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', publicada ? 'bg-sitio-verde' : 'bg-sitio-ambar')}
                />
              </span>
              {publicada ? 'En línea' : 'Borrador'}
            </span>
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="h-4 w-4 text-sitio-tenue transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
          />
        </a>

        <nav className="mt-6 flex flex-col gap-6 px-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-3 pb-2 text-[10px] tracking-[0.18em] text-sitio-tenue uppercase">{grupo.titulo}</p>
              <ul className="flex flex-col gap-0.5">
                {grupo.enlaces.map((enlace) => {
                  const activo = esActivo(enlace.href, ruta)
                  return (
                    <li key={enlace.href}>
                      <Link
                        href={enlace.href}
                        aria-current={activo ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] transition-colors duration-300',
                          activo ? 'text-white' : 'text-sitio-suave hover:text-white',
                        )}
                      >
                        {activo && (
                          <motion.span
                            layoutId="nav-activo"
                            transition={{ duration: 0.55, ease: SALIDA }}
                            className="absolute inset-0 rounded-lg border border-white/[0.07] bg-white/[0.07]"
                          />
                        )}
                        <enlace.Icono
                          aria-hidden="true"
                          strokeWidth={1.6}
                          className="relative h-4 w-4 shrink-0 transition-transform duration-500 ease-salida group-hover:scale-110"
                        />
                        <span className="relative">{enlace.etiqueta}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <div>
            <p className="px-3 pb-2 text-[10px] tracking-[0.18em] text-sitio-tenue uppercase">Ventas</p>
            <span className="flex cursor-default items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] text-sitio-tenue">
              <Receipt aria-hidden="true" strokeWidth={1.6} className="h-4 w-4 shrink-0" />
              Pedidos
              <span className="ml-auto rounded-full border border-sitio-azul-claro/30 bg-sitio-azul/10 px-1.5 py-px text-[9.5px] font-semibold text-sitio-azul-claro">
                Pronto
              </span>
            </span>
          </div>
        </nav>

        <div className="mt-auto p-4">
          {!esPro && (
            <Link
              href="/precios"
              target="_blank"
              className="group relative mb-4 block overflow-hidden rounded-xl border border-sitio-borde bg-[radial-gradient(120%_120%_at_0%_0%,rgba(59,96,255,0.22),transparent_60%)] p-4 transition-colors duration-300 hover:border-sitio-azul-claro/40"
            >
              <p className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-sitio-azul-claro uppercase">
                <Sparkles aria-hidden="true" className="h-3 w-3" />
                Plan {plan.nombre}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-sitio-suave">
                Más productos, tus colores y quitar la marca.
              </p>
              <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] text-white">
                Mejorar plan
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </Link>
          )}

          <div className="flex items-center gap-3 border-t border-sitio-borde pt-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11.5px] font-semibold">
              {iniciales(sesion.usuario.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px]">{sesion.usuario.nombre}</p>
              <p className="truncate text-[11px] text-sitio-tenue">{sesion.usuario.email}</p>
            </div>
            <button
              type="button"
              onClick={salir}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sitio-tenue transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Celular: barra superior ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-sitio-borde bg-black/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/panel" className="flex min-w-0 items-center gap-2.5">
          <SelloTienda className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block truncate text-[14px] leading-tight font-medium">{sesion.tienda?.nombre ?? 'Mi tienda'}</span>
            <span className="flex items-center gap-1.5 text-[10.5px] text-sitio-tenue">
              <span className={cn('h-1.5 w-1.5 rounded-full', publicada ? 'bg-sitio-verde' : 'bg-sitio-ambar')} />
              {publicada ? 'En línea' : 'Borrador'}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={urlTienda(sesion.tenant.subdominio)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver mi tienda"
            className="grid h-9 w-9 place-items-center rounded-lg border border-sitio-borde text-sitio-suave"
          >
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={salir}
            aria-label="Cerrar sesión"
            className="grid h-9 w-9 place-items-center rounded-lg border border-sitio-borde text-sitio-suave"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Celular: pestañas abajo ── */}
      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#0e0e0f]/90 p-1.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,1)] backdrop-blur-xl md:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TODOS.map((enlace) => {
          const activo = esActivo(enlace.href, ruta)
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] transition-colors duration-300',
                activo ? 'text-white' : 'text-sitio-tenue',
              )}
            >
              {activo && (
                <motion.span
                  layoutId="pestana-activa"
                  transition={{ duration: 0.5, ease: SALIDA }}
                  className="absolute inset-0 rounded-xl bg-white/[0.08]"
                />
              )}
              <enlace.Icono aria-hidden="true" strokeWidth={1.7} className="relative h-[18px] w-[18px]" />
              <span className="relative">{enlace.corta}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
