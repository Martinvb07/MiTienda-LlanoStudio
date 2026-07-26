'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { cn } from '@/utilidades/clases'

const ENLACES = [
  { href: '#producto', etiqueta: 'Producto' },
  { href: '#plantillas', etiqueta: 'Plantillas' },
  { href: '#precios', etiqueta: 'Precios' },
  { href: '#recursos', etiqueta: 'Recursos' },
] as const

export function Encabezado() {
  const [desplazado, setDesplazado] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { scrollY } = useScroll()

  // El borde inferior sólo aparece al bajar: arriba del todo la cabecera se
  // funde con el hero, lo que da sensación de más aire.
  useMotionValueEvent(scrollY, 'change', (valor) => setDesplazado(valor > 8))

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white/85 backdrop-blur-md transition-shadow duration-300',
        desplazado ? 'border-b border-sitio-borde' : 'border-b border-transparent',
      )}
    >
      <Contenedor>
        <div className="flex h-16 items-center justify-between gap-8">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight text-sitio-tinta"
          >
            Llano<span className="text-sitio-azul">Studio</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="relative text-sm text-sitio-suave transition-colors hover:text-sitio-tinta"
              >
                {enlace.etiqueta}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/panel/ingresar"
              className="text-sm text-sitio-suave transition-colors hover:text-sitio-tinta"
            >
              Ingresar
            </Link>
            <Boton href="/panel/ingresar">Empezar gratis</Boton>
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sitio-tinta md:hidden"
          >
            <div className="flex w-5 flex-col gap-1.5">
              <motion.span
                animate={menuAbierto ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-0.5 w-full origin-center bg-current"
              />
              <motion.span
                animate={menuAbierto ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="h-0.5 w-full bg-current"
              />
              <motion.span
                animate={menuAbierto ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-0.5 w-full origin-center bg-current"
              />
            </div>
          </button>
        </div>
      </Contenedor>

      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-sitio-borde bg-white md:hidden"
          >
            <Contenedor className="flex flex-col gap-1 py-4">
              {ENLACES.map((enlace) => (
                <a
                  key={enlace.href}
                  href={enlace.href}
                  onClick={() => setMenuAbierto(false)}
                  className="rounded-lg px-2 py-2.5 text-sitio-suave transition-colors hover:bg-sitio-crema hover:text-sitio-tinta"
                >
                  {enlace.etiqueta}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <Boton href="/panel/ingresar" variante="secundario">
                  Ingresar
                </Boton>
                <Boton href="/panel/ingresar">Empezar gratis</Boton>
              </div>
            </Contenedor>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
