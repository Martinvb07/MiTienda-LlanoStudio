import Link from 'next/link'
import { Contenedor } from './Contenedor'

const COLUMNAS = [
  {
    titulo: 'Producto',
    enlaces: [
      { etiqueta: 'Características', href: '#producto' },
      { etiqueta: 'Plantillas', href: '#plantillas' },
      { etiqueta: 'Precios', href: '#precios' },
      { etiqueta: 'Integraciones', href: '#producto' },
    ],
  },
  {
    titulo: 'Empresa',
    enlaces: [
      { etiqueta: 'Sobre nosotros', href: '#recursos' },
      { etiqueta: 'Blog', href: '#recursos' },
      { etiqueta: 'Trabajá con nosotros', href: '#recursos' },
      { etiqueta: 'Contacto', href: '#recursos' },
    ],
  },
  {
    titulo: 'Recursos',
    enlaces: [
      { etiqueta: 'Centro de ayuda', href: '#recursos' },
      { etiqueta: 'Documentación', href: '#recursos' },
      { etiqueta: 'Estado del servicio', href: '#recursos' },
    ],
  },
  {
    titulo: 'Legal',
    enlaces: [
      { etiqueta: 'Términos', href: '#recursos' },
      { etiqueta: 'Privacidad', href: '#recursos' },
      { etiqueta: 'Cookies', href: '#recursos' },
    ],
  },
]

export function PieSitio() {
  return (
    <footer className="border-t border-sitio-borde bg-white">
      <Contenedor className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link
              href="/"
              className="font-display text-lg font-bold tracking-tight text-sitio-tinta"
            >
              Llano<span className="text-sitio-azul">Studio</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sitio-tenue">
              Tiendas en línea para emprendedores colombianos. Sin código, sin complicaciones.
            </p>
          </div>

          {COLUMNAS.map((columna) => (
            <nav key={columna.titulo}>
              <h3 className="font-display text-sm font-semibold text-sitio-tinta">
                {columna.titulo}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.etiqueta}>
                    <a
                      href={enlace.href}
                      className="text-sm text-sitio-tenue transition-colors hover:text-sitio-tinta"
                    >
                      {enlace.etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-sitio-borde pt-7 sm:flex-row">
          <p className="text-sm text-sitio-tenue">
            © {new Date().getFullYear()} Llano Studio. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-2">
            {[
              {
                nombre: 'GitHub',
                url: 'https://github.com/Martinvb07/MiTienda-LlanoStudio',
                trazo:
                  'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z',
              },
            ].map((red) => (
              <a
                key={red.nombre}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={red.nombre}
                className="grid h-8 w-8 place-items-center rounded-lg text-sitio-tenue transition-colors hover:bg-sitio-crema hover:text-sitio-tinta"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d={red.trazo} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </Contenedor>
    </footer>
  )
}
