import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'

/**
 * CONTENIDO DE MUESTRA — reemplazar por testimonios reales antes de publicar.
 *
 * Los nombres y las tiendas son inventados y están aquí sólo para mostrar cómo
 * queda la sección. Publicar esto como si fueran clientes de verdad sería
 * inventar recomendaciones que nadie dio.
 */
const TESTIMONIOS = [
  {
    cita: 'Tenía el catálogo en fotos de WhatsApp y perdía pedidos por no saber qué había en stock. Ahora el cliente ve lo que hay y compra solo.',
    nombre: 'Nombre de la clienta',
    negocio: 'Tienda de ejemplo · Villavicencio',
    inicial: 'A',
  },
  {
    cita: 'Cambié la plantilla tres veces hasta dar con la que me gustaba y no perdí ni una descripción de producto. Eso fue lo que me convenció.',
    nombre: 'Nombre del cliente',
    negocio: 'Tienda de ejemplo · Medellín',
    inicial: 'B',
  },
  {
    cita: 'Lo armé un domingo por la tarde sin ayuda de nadie. El lunes ya tenía la tienda en mi propio dominio y recibiendo visitas.',
    nombre: 'Nombre de la clienta',
    negocio: 'Tienda de ejemplo · Bogotá',
    inicial: 'C',
  },
]

export function Testimonios() {
  return (
    <section className="bg-sitio-crema py-20 lg:py-28">
      <Contenedor>
        <Revelar className="max-w-2xl">
          <Rotulo indice="—">Testimonios</Rotulo>
          <h2 className="mt-5 font-display text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-balance text-sitio-tinta sm:text-5xl">
            Hecho para quien vende, no para quien programa
          </h2>
        </Revelar>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIOS.map((testimonio, indice) => (
            <Revelar key={testimonio.negocio + indice} retardo={indice * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-sitio-borde bg-white p-6">
                {/* Comilla de apertura como elemento gráfico, no como texto. */}
                <svg
                  viewBox="0 0 32 24"
                  aria-hidden="true"
                  className="h-6 w-8 text-sitio-azul/25"
                  fill="currentColor"
                >
                  <path d="M0 24V12C0 5.4 4.6 0.6 11 0v4.8C7.6 5.6 5.8 8 5.8 11.2H11V24H0zm21 0V12c0-6.6 4.6-11.4 11-12v4.8c-3.4.8-5.2 3.2-5.2 6.4H32V24H21z" />
                </svg>

                <blockquote className="mt-4 flex-1 leading-relaxed text-pretty text-sitio-tinta">
                  {testimonio.cita}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-sitio-borde pt-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sitio-crema font-display text-sm font-semibold text-sitio-suave">
                    {testimonio.inicial}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-sitio-tinta">
                      {testimonio.nombre}
                    </span>
                    <span className="block truncate text-xs text-sitio-tenue">
                      {testimonio.negocio}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
