'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { Contenedor } from './Contenedor'
import { Flecha } from './Boton'
import { MENU_PLANTILLAS, MENU_PRECIOS, PRODUCTOS, type OpcionMenu } from './productos'
import { cn } from '@/utilidades/clases'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'
import { BotonTema } from '@/componentes/comunes/BotonTema'
import { leerToken } from '@/servicios/panel'

const ENLACES = [{ href: '/blog', etiqueta: 'Recursos' }] as const

/** Los menús que bajan, en orden: cada uno con una opción por producto. */
const MENUS: readonly { etiqueta: string; opciones: readonly OpcionMenu[] }[] = [
  { etiqueta: 'Productos', opciones: PRODUCTOS },
  { etiqueta: 'Plantillas', opciones: MENU_PLANTILLAS },
  { etiqueta: 'Precios', opciones: MENU_PRECIOS },
]

/**
 * Cabecera fija como la de llanostudio.co: transparente sobre el hero y negra
 * con desenfoque al bajar. Tres columnas (marca | menú | acciones) con las
 * laterales del mismo ancho, para que el menú quede centrado de verdad.
 */
export function Encabezado() {
  const [desplazado, setDesplazado] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rutaActual = usePathname()
  const { scrollY } = useScroll()
  // Con la sesión del panel abierta no tiene sentido ofrecer ingresar o crear
  // otra cuenta: se ofrece volver al panel.
  const [conSesion, setConSesion] = useState(false)
  useEffect(() => setConSesion(Boolean(leerToken())), [])

  useMotionValueEvent(scrollY, 'change', (valor) => setDesplazado(valor > 12))

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background,border-color] duration-300',
        desplazado || menuAbierto
          ? 'border-white/5 bg-black/70 backdrop-blur-[18px] backdrop-saturate-150'
          : 'border-transparent',
      )}
    >
      <Contenedor>
        <div className="flex h-[72px] items-center justify-between gap-6 md:grid md:grid-cols-[1fr_auto_1fr]">
          <Link href="/" className="flex items-center gap-[11px] justify-self-start">
            <LogoMarca prioridad className="h-7 w-auto" />
            <span className="flex flex-col justify-center">
              <span className="text-base leading-none font-semibold tracking-[-0.02em]">Mi Sitio</span>
              <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">
                por Llano Studio
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {MENUS.map((menu) => (
              <MenuDesplegable key={menu.etiqueta} etiqueta={menu.etiqueta} opciones={menu.opciones} rutaActual={rutaActual} />
            ))}
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={cn(
                  'inline-flex h-9 items-center px-3.5 text-[11.5px] font-medium tracking-[0.1em] uppercase transition-colors duration-300',
                  rutaActual.startsWith(enlace.href) ? 'text-white' : 'text-white/60 hover:text-white',
                )}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 justify-self-end md:flex">
            <BotonTema />
            {conSesion ? (
              <Link href="/panel" className="group boton boton-primario boton-chico">
                Ir a mi panel
                <Flecha className="h-[15px] w-[15px] transition-transform duration-500 ease-salida group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/panel/ingresar"
                  className="text-[11.5px] font-medium tracking-[0.1em] text-white/60 uppercase transition-colors hover:text-white"
                >
                  Ingresar
                </Link>
                <Link href="/panel/crear-cuenta" className="group boton boton-primario boton-chico">
                  Empezar gratis
                  <Flecha className="h-[15px] w-[15px] transition-transform duration-500 ease-salida group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
          <BotonTema className="h-[42px] w-[42px] rounded-[9px]" />
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] border border-sitio-borde md:hidden"
          >
            <div className="flex w-[18px] flex-col gap-[4px]">
              <motion.span
                animate={menuAbierto ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-0.5 w-full origin-center bg-white"
              />
              <motion.span
                animate={menuAbierto ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="h-0.5 w-full bg-white"
              />
              <motion.span
                animate={menuAbierto ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-0.5 w-full origin-center bg-white"
              />
            </div>
          </button>
          </div>
        </div>
      </Contenedor>

      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-sitio-borde bg-black/95 md:hidden"
          >
            <Contenedor className="flex flex-col pt-3 pb-7">
              {MENUS.map((menu) => (
                <div key={menu.etiqueta} className="border-b border-white/5 pb-2">
                  <p className="pt-4 pb-1 text-[11px] tracking-[0.14em] text-white/40 uppercase">{menu.etiqueta}</p>
                  {menu.opciones.map((opcion) => (
                    <Link
                      key={opcion.clave}
                      href={opcion.href}
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center gap-3 py-[9px] text-[16px] text-sitio-suave transition-colors hover:text-white"
                    >
                      <opcion.icono aria-hidden="true" strokeWidth={1.5} className="h-[17px] w-[17px] text-white/45" />
                      {opcion.nombre}
                      {!opcion.disponible && (
                        <span className="ml-auto text-[10.5px] tracking-[0.14em] text-white/35 uppercase">Pronto</span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
              {ENLACES.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={() => setMenuAbierto(false)}
                  className="border-b border-white/5 py-[13px] text-[17px] text-sitio-suave transition-colors hover:text-white"
                >
                  {enlace.etiqueta}
                </Link>
              ))}
              {conSesion ? (
                <Link href="/panel" onClick={() => setMenuAbierto(false)} className="boton boton-primario mt-5">
                  Ir a mi panel
                </Link>
              ) : (
                <>
                  <Link
                    href="/panel/ingresar"
                    onClick={() => setMenuAbierto(false)}
                    className="border-b border-white/5 py-[13px] text-[17px] text-sitio-suave"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/panel/crear-cuenta"
                    onClick={() => setMenuAbierto(false)}
                    className="boton boton-primario mt-5"
                  >
                    Empezar gratis
                  </Link>
                </>
              )}
            </Contenedor>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/**
 * Un menú que baja con una opción por producto (Productos, Plantillas o
 * Precios). Se abre al pasar el cursor o con clic, y se cierra con Escape, al
 * salir o al navegar.
 */
function MenuDesplegable({ etiqueta, opciones, rutaActual }: { etiqueta: string; opciones: readonly OpcionMenu[]; rutaActual: string }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  // /enlaces es de Productos: en Plantillas y Precios sólo cuenta su propia ruta.
  const activo = opciones.some((opcion) => opcion.disponible && (rutaActual === opcion.href || rutaActual.startsWith(`${opcion.href}/`)))

  useEffect(() => setAbierto(false), [rutaActual])

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && setAbierto(false)
    const alTocar = (evento: PointerEvent) => {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false)
    }
    window.addEventListener('keydown', alTeclear)
    window.addEventListener('pointerdown', alTocar)
    return () => {
      window.removeEventListener('keydown', alTeclear)
      window.removeEventListener('pointerdown', alTocar)
    }
  }, [abierto])

  return (
    <div ref={caja} className="relative" onMouseEnter={() => setAbierto(true)} onMouseLeave={() => setAbierto(false)}>
      <button
        type="button"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => setAbierto((actual) => !actual)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 px-3.5 text-[11.5px] font-medium tracking-[0.1em] uppercase transition-colors duration-300',
          activo || abierto ? 'text-white' : 'text-white/60 hover:text-white',
        )}
      >
        {etiqueta}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.6}
          className={cn('h-3.5 w-3.5 transition-transform duration-500 ease-salida', abierto && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {abierto && (
          // El pt-3 es un puente invisible: el cursor baja al panel sin cerrarlo.
          <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 6, filter: 'blur(4px)', transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-1/2 w-[440px] -translate-x-1/2 pt-3"
          >
            <div className="overflow-hidden rounded-[8px] border border-white/10 bg-sitio-modal p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,1)]">
              {opciones.map((producto) => (
                <Link
                  key={producto.clave}
                  href={producto.href}
                  aria-current={rutaActual === producto.href ? 'page' : undefined}
                  className={cn(
                    'group flex items-start gap-4 rounded-[6px] p-3.5 transition-colors duration-300 hover:bg-white/[0.05]',
                    rutaActual === producto.href && 'bg-white/[0.04]',
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-white/10 text-white/70 transition-colors duration-300 group-hover:text-white">
                    <producto.icono aria-hidden="true" strokeWidth={1.5} className="h-[17px] w-[17px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[14.5px] tracking-[-0.01em] text-white">{producto.nombre}</span>
                      {!producto.disponible && (
                        <span className="text-[10px] tracking-[0.14em] text-white/35 uppercase">Próximamente</span>
                      )}
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-white/50">{producto.resumen}</span>
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
