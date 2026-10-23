'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Contenedor } from './Contenedor'
import { Flecha } from './Boton'
import { cn } from '@/utilidades/clases'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'
import { BotonTema } from '@/componentes/comunes/BotonTema'
import { leerToken } from '@/servicios/panel'

const ENLACES = [
  { href: '/caracteristicas', etiqueta: 'Producto' },
  { href: '/plantillas', etiqueta: 'Plantillas' },
  { href: '/precios', etiqueta: 'Precios' },
  { href: '/blog', etiqueta: 'Recursos' },
] as const

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
                  Crear tienda
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
                    Crear mi tienda
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
