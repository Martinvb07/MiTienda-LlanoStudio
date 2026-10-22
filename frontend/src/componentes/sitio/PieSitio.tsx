import Link from 'next/link'
import { Instagram, MapPin } from 'lucide-react'
import { Contenedor } from './Contenedor'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'

const COLUMNAS = [
  {
    titulo: 'Producto',
    enlaces: [
      { etiqueta: 'Características', href: '/caracteristicas' },
      { etiqueta: 'Plantillas', href: '/plantillas' },
      { etiqueta: 'Precios', href: '/precios' },
    ],
  },
  {
    titulo: 'Empresa',
    enlaces: [
      { etiqueta: 'Sobre nosotros', href: '/sobre-nosotros' },
      { etiqueta: 'Recursos', href: '/blog' },
      { etiqueta: 'Contacto', href: '/contacto' },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [
      { etiqueta: 'Ingresar', href: '/panel/ingresar' },
      { etiqueta: 'Crear tienda', href: '/panel/crear-cuenta' },
    ],
  },
  {
    titulo: 'Legal',
    enlaces: [
      { etiqueta: 'Términos', href: '/terminos' },
      { etiqueta: 'Privacidad', href: '/privacidad' },
    ],
  },
]

export function PieSitio() {
  const anio = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-sitio-borde bg-sitio-crema">

      <Contenedor className="relative pt-[72px] pb-9">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link href="/" className="flex items-center gap-[11px]">
              <LogoMarca alt="" className="h-7 w-auto" />
              <span className="text-base font-semibold tracking-[-0.02em] text-white">Mi Tienda</span>
            </Link>

            <p className="mt-[18px] max-w-[16ch] text-xl leading-[1.3] tracking-[-0.02em] text-white">
              Tiendas en línea para negocios colombianos.
            </p>

            <p className="mt-5 flex items-center gap-2 text-sm text-white/55">
              <MapPin aria-hidden="true" className="h-4 w-4 text-white/40" strokeWidth={1.6} />
              Colombia
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.instagram.com/llanostudio.co/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Llano Studio"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white hover:text-black hover:ring-white"
              >
                <Instagram aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
              </a>
            </div>
          </div>

          {COLUMNAS.map((columna) => (
            <nav key={columna.titulo}>
              <h3 className="text-[13px] font-medium tracking-[-0.01em] text-white">
                {columna.titulo}
              </h3>
              <ul className="mt-4 space-y-3">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.etiqueta}>
                    <Link
                      href={enlace.href}
                      className="text-[13px] text-sitio-tenue transition-colors duration-300 hover:text-white"
                    >
                      {enlace.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            © {anio} Mi Tienda. Todos los derechos reservados.
          </p>

          <a
            href="https://llanostudio.co"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-xs text-white/40 transition-colors hover:text-white/70"
          >
            Un producto de
            {/* La versión clara del logotipo es la que corresponde sobre fondo
                oscuro; la oscura viviría en public/llanostudio-logo.png. */}
            <LogoMarca alt="" className="h-5 w-auto opacity-80 transition-opacity group-hover:opacity-100" />
            <span className="font-bold text-white/70 transition-colors group-hover:text-white">
              Llano Studio
            </span>
          </a>
        </div>
      </Contenedor>
    </footer>
  )
}
