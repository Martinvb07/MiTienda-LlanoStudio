'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { LogoMarca } from './LogoMarca'
import { BotonTema } from './BotonTema'

const SALIDA = [0.16, 1, 0.3, 1] as const

const SUGERENCIAS = [
  { href: '/caracteristicas', texto: 'Producto' },
  { href: '/plantillas', texto: 'Plantillas' },
  { href: '/precios', texto: 'Precios' },
  { href: '/blog', texto: 'Recursos' },
  { href: '/contacto', texto: 'Contacto' },
]

/**
 * 404 de la web y del panel: el número enorme y fino que se desvanece, la ruta
 * que no existe y las salidas útiles. Sigue el tema claro u oscuro.
 */
export function Pantalla404() {
  const ruta = usePathname()
  const enPanel = ruta.startsWith('/panel')

  return (
    <main className="marco-oscuro relative isolate flex min-h-screen flex-col overflow-hidden font-sans">
      {/* Cuadrícula que se apaga hacia los bordes y luz azul detrás del número. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(color-mix(in_srgb,var(--color-white)_5%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-white)_5%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[size:56px_56px]"
      />
      <motion.div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,96,255,0.22),transparent_65%)] blur-2xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMarca prioridad className="h-7 w-auto" />
        </Link>
        <BotonTema />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
        <motion.p
          aria-hidden="true"
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: SALIDA }}
          className="bg-[linear-gradient(180deg,var(--color-white)_20%,transparent_95%)] bg-clip-text text-[clamp(120px,26vw,340px)] leading-[0.8] font-normal tracking-[-0.08em] text-transparent select-none"
        >
          404
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: SALIDA }}
          className="-mt-2 flex flex-col items-center sm:-mt-6"
        >
          <span className="antetitulo">Error 404</span>
          <h1 className="titulo-3 mt-3 max-w-[20ch]">Esta página no existe</h1>
          <p className="bajada mx-auto mt-4 !max-w-[40ch]">
            Puede que el enlace esté mal escrito o que la página se haya movido.
          </p>

          <span className="direccion mt-6 max-w-[min(100%,420px)]">
            <span className="min-w-0 px-3">
              <span className="truncate text-sitio-tenue line-through decoration-sitio-tenue/60">{ruta}</span>
            </span>
          </span>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link href={enPanel ? '/panel' : '/'} className="group boton boton-primario boton-chico">
              <ArrowLeft
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:-translate-x-1"
              />
              {enPanel ? 'Volver al panel' : 'Volver al inicio'}
            </Link>
            {!enPanel && (
              <Link href="/panel" className="group boton boton-contorno boton-chico">
                Ir a mi panel
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        aria-label="Sugerencias"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-sitio-borde px-5 py-5 text-[11px] tracking-[0.12em] uppercase"
      >
        <span className="text-sitio-tenue">Quizá buscabas</span>
        {SUGERENCIAS.map((enlace) => (
          <Link key={enlace.href} href={enlace.href} className="text-sitio-suave transition-colors hover:text-white">
            {enlace.texto}
          </Link>
        ))}
      </motion.nav>
    </main>
  )
}
