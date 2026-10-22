'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'

const SALIDA = [0.16, 1, 0.3, 1] as const

/** Cada pantalla muestra una tienda distinta al lado del formulario. */
const LADOS: Record<string, { imagen: string; tienda: string; frase: string }> = {
  '/panel/crear-cuenta': {
    imagen: '/ejemplos/lana-andina.webp',
    tienda: 'Lana Andina',
    frase: 'Elige una plantilla, sube tus productos y publica. Hoy mismo.',
  },
  '/panel/ingresar': {
    imagen: '/ejemplos/casa-morichal.webp',
    tienda: 'Casa Morichal',
    frase: 'Tu tienda, tus productos y tu diseño, en un solo panel.',
  },
  '/panel/recuperar': {
    imagen: '/ejemplos/orbita.webp',
    tienda: 'Órbita',
    frase: 'Recupera el acceso y sigue vendiendo.',
  },
}

export function MarcoSesion({ children }: { children: React.ReactNode }) {
  const ruta = usePathname()
  const lado = LADOS[ruta] ?? LADOS['/panel/ingresar']!

  return (
    <div className="marco-oscuro grid min-h-dvh font-sans lg:grid-cols-[1.05fr_1fr]">
      {/* Tienda real de un lado */}
      <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#070707] lg:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={lado.imagen}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: SALIDA }}
            className="absolute inset-0"
          >
            <div className="absolute top-[14%] left-[10%] w-[115%] overflow-hidden rounded-[10px] shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] ring-1 ring-white/10">
              <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-[#141416] px-3">
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
              </div>
              <Image src={lado.imagen} alt={`Tienda de ejemplo ${lado.tienda}`} width={1440} height={900} priority sizes="60vw" className="h-auto w-full" />
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#070707_8%,rgba(7,7,7,0.2)_55%,rgba(7,7,7,0.6))]" />
        <div className="absolute right-12 bottom-12 left-12">
          <p className="max-w-[18ch] text-[clamp(28px,2.6vw,40px)] leading-[1.05] tracking-[-0.04em]">{lado.frase}</p>
          <p className="mt-4 text-[12px] tracking-[0.14em] text-white/45 uppercase">
            {lado.tienda} · hecha con Mi Tienda
          </p>
        </div>
      </aside>

      {/* Formulario del otro */}
      <main className="flex min-h-dvh flex-col px-6 py-5 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[11.5px] tracking-[0.1em] text-white/55 uppercase transition-colors hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:-translate-x-1" />
            Volver al inicio
          </Link>
          <Link href="/" className="flex items-center gap-[10px]">
            <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-6 w-auto" />
            <span className="text-[14px] font-semibold tracking-[-0.02em]">Mi Tienda</span>
          </Link>
        </div>

        <motion.div
          key={ruta}
          initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, ease: SALIDA }}
          className="mx-auto my-auto w-full max-w-[560px] py-6"
        >
          {children}
        </motion.div>

        <p className="text-center text-[11.5px] text-white/35">
          © {new Date().getFullYear()} Mi Tienda · Un producto de Llano Studio
        </p>
      </main>
    </div>
  )
}
