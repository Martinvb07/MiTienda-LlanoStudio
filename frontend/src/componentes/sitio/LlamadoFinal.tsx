import { Boton } from './Boton'
import { Revelar } from './Revelar'

/** Cierre de página al estilo de llanostudio.co: titular enorme, centrado, sobre el halo. */
export function LlamadoFinal() {
  return (
    <section className="relative isolate overflow-hidden border-t border-sitio-borde py-[120px] text-center">
      <div aria-hidden="true" className="halo !top-[10%]" />
      <div
        aria-hidden="true"
        className="cuadricula pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]"
      />
      <Revelar className="px-5">
        <span className="antetitulo mb-6">Empieza hoy</span>
        <h2 className="titulo-2 mx-auto max-w-[14ch]">Tu tienda puede estar vendiendo mañana</h2>
        <p className="bajada mx-auto mt-5 !text-lg">
          Ármala hoy, publícala en tu dominio y empieza a vender. Sin código y sin tarjeta de crédito.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Boton href="/panel/crear-cuenta" flecha>
            Crear mi tienda gratis
          </Boton>
          <Boton href="/caracteristicas" variante="secundario">
            Ver cómo funciona
          </Boton>
        </div>
      </Revelar>
    </section>
  )
}
