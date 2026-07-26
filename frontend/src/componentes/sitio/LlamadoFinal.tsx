import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'

export function LlamadoFinal() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Contenedor>
        <Revelar>
          <div className="relative overflow-hidden rounded-3xl bg-sitio-profundo px-8 py-16 text-center sm:px-16">
            {/* Textura tenue: sin ella el bloque azul se ve plano y barato. */}
            <div
              aria-hidden="true"
              className="trama-puntos pointer-events-none absolute inset-0 text-white/15 [mask-image:radial-gradient(80%_80%_at_50%_0%,black,transparent)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sitio-azul/35 blur-3xl"
            />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl leading-[1.1] font-bold tracking-[-0.03em] text-balance text-white sm:text-5xl">
                ¿Listo para transformar tu negocio online?
              </h2>

              <p className="mx-auto mt-5 max-w-lg text-pretty text-white/70">
                Armá tu tienda hoy, publicala en tu dominio y empezá a vender. Sin código y sin
                tarjeta de crédito.
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Boton href="/panel/ingresar" variante="claro" tamano="grande" flecha>
                  Comenzar gratis hoy
                </Boton>
                <a
                  href="#producto"
                  className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-base font-medium text-white transition-colors hover:border-white/60"
                >
                  Ver cómo funciona
                </a>
              </div>
            </div>
          </div>
        </Revelar>
      </Contenedor>
    </section>
  )
}
