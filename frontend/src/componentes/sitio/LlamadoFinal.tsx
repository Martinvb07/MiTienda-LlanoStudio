import Image from 'next/image'
import { Boton } from './Boton'
import { Revelar } from './Revelar'

/** Cierre de página: titular enorme sobre una foto que se funde con el negro. */
export function LlamadoFinal() {
  return (
    <section className="relative isolate overflow-hidden py-[140px] text-center md:py-[190px]">
      <Image
        src="/fotos/lana-hero.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-35"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.55)_40%,rgba(0,0,0,0.55)_60%,#000_100%)]" />
      <Revelar className="px-5">
        <span className="antetitulo mb-6">Empieza hoy</span>
        <h2 className="titulo-2 mx-auto max-w-[14ch]">Tu tienda puede estar vendiendo mañana</h2>
        <p className="bajada mx-auto mt-5 !text-lg">
          Ármala hoy, publícala en tu dirección y empieza a vender. Sin código y sin tarjeta de crédito.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Boton href="/panel/crear-cuenta" flecha>
            Crear mi tienda gratis
          </Boton>
          <Boton href="/plantillas" variante="secundario">
            Ver plantillas
          </Boton>
        </div>
      </Revelar>
    </section>
  )
}
