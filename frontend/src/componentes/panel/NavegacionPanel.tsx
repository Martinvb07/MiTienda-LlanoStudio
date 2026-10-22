'use client'

/* eslint-disable @next/next/no-img-element -- logo de la tienda subido por el usuario */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  BarChart3,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Paintbrush,
  Receipt,
  Search,
  Settings,
  Ticket,
} from 'lucide-react'
import { cerrarSesion } from '@/servicios/panel'
import { urlTienda } from '@/utilidades/dominios'
import { limitesDe } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'
import { SALIDA } from './ui/movimiento'
import { CampanaAvisos, useAvisos } from './Avisos'
import { useAbrirBuscador } from './BuscadorRapido'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'
import { BotonTema } from '@/componentes/comunes/BotonTema'

interface Enlace {
  href: string
  etiqueta: string
  /** Nombre corto para las pestañas del celular. */
  corta: string
  Icono: typeof LayoutGrid
  /** false = no va en las pestañas del celular (sólo hay espacio para cinco). */
  movil?: boolean
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
    titulo: 'Ventas',
    enlaces: [
      { href: '/panel/pedidos', etiqueta: 'Pedidos', corta: 'Pedidos', Icono: Receipt },
      { href: '/panel/descuentos', etiqueta: 'Descuentos', corta: 'Cupones', Icono: Ticket, movil: false },
      { href: '/panel/estadisticas', etiqueta: 'Estadísticas', corta: 'Datos', Icono: BarChart3, movil: false },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [{ href: '/panel/configuracion', etiqueta: 'Configuración', corta: 'Ajustes', Icono: Settings }],
  },
]

const TODOS = GRUPOS.flatMap((grupo) => grupo.enlaces).filter((enlace) => enlace.movil !== false)

/** Secciones de dinero y personas: un editor no las ve (la API tampoco se las da). */
const SOLO_GESTION = new Set(['/panel/descuentos', '/panel/estadisticas'])

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
  const { avisos } = useAvisos()
  const abrirBuscador = useAbrirBuscador()
  const [mas, setMas] = useState(false)
  const pedidosNuevos = avisos?.pedidosNuevos ?? 0

  useEffect(() => setMas(false), [ruta])

  return (
    <>
      {/* ── Escritorio ── */}
      <aside className="sticky top-0 z-30 hidden h-screen w-[264px] shrink-0 flex-col border-r border-sitio-borde bg-sitio-lateral md:flex">
        <div className="flex items-center justify-between gap-3 px-5 pt-6">
          <Link href="/panel" className="flex items-center gap-[11px] pl-1">
            <LogoMarca className="h-7 w-auto" />
            <span className="flex flex-col">
              <span className="text-[15px] leading-none font-semibold tracking-[-0.02em]">Mi Tienda</span>
              <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">Panel</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <BotonTema />
            <CampanaAvisos />
          </div>
        </div>

        <a
          href={urlTienda(sesion.tenant.subdominio)}
          target="_blank"
          rel="noopener noreferrer"
          className="group mx-4 mt-7 flex items-center gap-3 rounded-xl border border-sitio-borde bg-white/[0.025] p-3 transition-[border-color,background] duration-300 hover:border-white/20 hover:bg-white/[0.045]"
        >
          <SelloTienda className="h-10 w-10" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">{sesion.tienda?.nombre ?? 'Mi tienda'}</span>
            <span className="mt-1.5 flex items-center gap-2 text-[10px] tracking-[0.12em] text-sitio-tenue uppercase">
              <span
                aria-hidden="true"
                className="estado-punto"
                data-tono={publicada ? 'verde' : 'ambar'}
                data-vivo={publicada || undefined}
              />
              {publicada ? 'En línea' : 'Borrador'}
            </span>
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="h-4 w-4 text-sitio-tenue transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
          />
        </a>

        <button
          type="button"
          onClick={abrirBuscador}
          className="group mx-4 mt-3 flex h-9 items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 text-[12.5px] text-sitio-tenue ring-1 ring-sitio-borde transition-[background,color,box-shadow] duration-300 ring-inset hover:bg-white/[0.07] hover:text-sitio-suave"
        >
          <Search aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:scale-110" />
          <span className="flex-1 text-left">Buscar</span>
          <span className="flex items-center gap-0.5">
            <kbd className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-white/[0.07] px-1 font-sans text-[10px] text-sitio-suave">Ctrl</kbd>
            <kbd className="grid h-5 w-5 place-items-center rounded-[5px] bg-white/[0.07] font-sans text-[10px] text-sitio-suave">K</kbd>
          </span>
        </button>

        <nav className="mt-5 flex flex-col gap-5 overflow-y-auto px-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-3 pb-2 text-[10px] tracking-[0.18em] text-sitio-tenue uppercase">{grupo.titulo}</p>
              <ul className="flex flex-col gap-0.5">
                {grupo.enlaces
                  .filter((enlace) => sesion.usuario.rol !== 'EDITOR' || !SOLO_GESTION.has(enlace.href))
                  .map((enlace) => {
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
                        {enlace.href === '/panel/pedidos' && pedidosNuevos > 0 && (
                          <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-sitio-azul px-1.5 text-[10.5px] font-semibold text-[#fff]">
                            {pedidosNuevos}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto p-4">
          {!esPro && (
            <Link
              href="/precios"
              target="_blank"
              className="group mb-3 flex items-center gap-3 rounded-[10px] px-3 py-2.5 ring-1 ring-sitio-borde transition-colors duration-300 ring-inset hover:bg-white/[0.04]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[9.5px] tracking-[0.16em] text-sitio-tenue uppercase">Tu plan</span>
                <span className="block text-[14px] leading-tight tracking-[-0.01em]">{plan.nombre}</span>
              </span>
              <span className="inline-flex h-7 items-center gap-1 rounded-[3px] bg-white px-2.5 text-[10px] font-medium tracking-[0.09em] text-black uppercase transition-colors group-hover:bg-sitio-hover-primario">
                Mejorar
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-3 w-3 transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
            <span className="mt-0.5 flex items-center gap-2 text-[9.5px] tracking-[0.12em] text-sitio-tenue uppercase">
              <span aria-hidden="true" className="estado-punto" data-tono={publicada ? 'verde' : 'ambar'} />
              {publicada ? 'En línea' : 'Borrador'}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={abrirBuscador}
            aria-label="Buscar"
            className="grid h-9 w-9 place-items-center rounded-lg border border-sitio-borde text-sitio-suave"
          >
            <Search aria-hidden="true" className="h-4 w-4" />
          </button>
          <BotonTema />
          <CampanaAvisos abajo />
          <a
            href={urlTienda(sesion.tenant.subdominio)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver mi tienda"
            className="grid h-9 w-9 place-items-center rounded-lg border border-sitio-borde text-sitio-suave"
          >
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* ── Celular: pestañas abajo ── */}
      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/10 bg-sitio-modal/90 p-1.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,1)] backdrop-blur-xl md:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TODOS.filter((enlace) => enlace.href !== '/panel/configuracion').map((enlace) => {
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
              {enlace.href === '/panel/pedidos' && pedidosNuevos > 0 && (
                <span className="absolute top-1 right-[22%] h-2 w-2 rounded-full bg-sitio-azul-claro" />
              )}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMas(true)}
          className={cn(
            'relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] transition-colors duration-300',
            ['/panel/configuracion', '/panel/descuentos', '/panel/estadisticas'].some((href) => ruta.startsWith(href))
              ? 'text-white'
              : 'text-sitio-tenue',
          )}
        >
          <Menu aria-hidden="true" strokeWidth={1.7} className="h-[18px] w-[18px]" />
          Más
        </button>
      </nav>

      {/* ── Celular: hoja "Más" ── */}
      <AnimatePresence>
        {mas && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Más secciones">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMas(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.45, ease: SALIDA }}
              className="absolute inset-x-0 bottom-0 rounded-t-[22px] border-t border-white/10 bg-sitio-modal px-4 pt-3 pb-8"
            >
              <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-white/20" />
              <ul className="flex flex-col gap-1">
                {GRUPOS.flatMap((grupo) => grupo.enlaces)
                  .filter((enlace) => enlace.movil === false || enlace.href === '/panel/configuracion')
                  .filter((enlace) => sesion.usuario.rol !== 'EDITOR' || !SOLO_GESTION.has(enlace.href))
                  .map((enlace) => (
                    <li key={enlace.href}>
                      <Link
                        href={enlace.href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px]',
                          esActivo(enlace.href, ruta) ? 'bg-white/[0.08] text-white' : 'text-sitio-suave',
                        )}
                      >
                        <enlace.Icono aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                        {enlace.etiqueta}
                      </Link>
                    </li>
                  ))}
                <li className="mt-2 border-t border-sitio-borde pt-2">
                  <button type="button" onClick={salir} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] text-sitio-suave">
                    <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
