import Image from 'next/image'
import Link from 'next/link'
import { Contenedor } from './Contenedor'

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
      { etiqueta: 'Blog', href: '/blog' },
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
      {/* Halo de marca: levanta el bloque oscuro para que no se lea como un
          rectángulo negro y sin más. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-sitio-azul/10 blur-3xl"
      />

      <Contenedor className="relative pt-[72px] pb-9">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link href="/" className="flex items-center gap-[11px]">
              <Image src="/llanostudio-marca.png" alt="" width={232} height={205} className="h-7 w-auto" />
              <span className="text-base font-semibold tracking-[-0.02em] text-white">Mi Tienda</span>
            </Link>

            <p className="mt-[18px] max-w-[16ch] text-xl leading-[1.3] tracking-[-0.02em] text-white">
              Tiendas en línea para negocios colombianos.
            </p>

            <p className="mt-5 flex items-center gap-2 text-sm text-white/55">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-sitio-azul-claro">
                <path
                  d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                />
                <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" fill="none" />
              </svg>
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
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
                </svg>
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
            <Image
              src="/llanostudio-marca.png"
              alt=""
              width={232}
              height={205}
              className="h-5 w-auto opacity-80 transition-opacity group-hover:opacity-100"
            />
            <span className="font-bold text-white/70 transition-colors group-hover:text-white">
              Llano Studio
            </span>
          </a>
        </div>
      </Contenedor>
    </footer>
  )
}
