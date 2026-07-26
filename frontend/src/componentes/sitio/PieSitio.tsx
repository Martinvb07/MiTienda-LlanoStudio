import Image from 'next/image'
import Link from 'next/link'
import { Contenedor } from './Contenedor'

const COLUMNAS = [
  {
    titulo: 'Producto',
    enlaces: [
      { etiqueta: 'Características', href: '#producto' },
      { etiqueta: 'Plantillas', href: '#plantillas' },
      { etiqueta: 'Precios', href: '#precios' },
    ],
  },
  {
    titulo: 'Empresa',
    enlaces: [
      { etiqueta: 'Sobre nosotros', href: '#recursos' },
      { etiqueta: 'Blog', href: '#recursos' },
      { etiqueta: 'Contacto', href: '#recursos' },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [
      { etiqueta: 'Ingresar', href: '/panel/ingresar' },
      { etiqueta: 'Crear tienda', href: '/panel/ingresar' },
    ],
  },
  {
    titulo: 'Legal',
    enlaces: [
      { etiqueta: 'Términos', href: '#recursos' },
      { etiqueta: 'Privacidad', href: '#recursos' },
    ],
  },
]

export function PieSitio() {
  const anio = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-sitio-tinta">
      {/* Halo de marca: levanta el bloque oscuro para que no se lea como un
          rectángulo negro y sin más. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-sitio-azul/15 blur-3xl"
      />

      <Contenedor className="relative py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link href="/" className="font-display text-xl font-bold tracking-tight text-white">
              MiTienda
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Tiendas en línea para emprendedores colombianos. Sin código y sin complicaciones.
            </p>

            <p className="mt-5 flex items-center gap-2 text-sm text-white/55">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-sitio-azul">
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-sitio-azul hover:text-white hover:ring-sitio-azul"
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
              <h3 className="font-display text-sm font-bold tracking-wider text-white/85 uppercase">
                {columna.titulo}
              </h3>
              <ul className="mt-4 space-y-3">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.etiqueta}>
                    <a
                      href={enlace.href}
                      className="text-sm text-white/55 transition-colors hover:text-sitio-azul"
                    >
                      {enlace.etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            © {anio} MiTienda. Todos los derechos reservados.
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
