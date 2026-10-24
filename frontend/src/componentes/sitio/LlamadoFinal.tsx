import Image from 'next/image'
import { Boton } from './Boton'
import { Revelar } from './Revelar'

interface Props {
  titulo?: string
  texto?: string
  /** A dónde lleva "Empezar gratis" y "Ver plantillas", si no son los de la tienda. */
  hrefEmpezar?: string
  hrefPlantillas?: string
  /** Texto del segundo botón, si no lleva a las plantillas. */
  textoPlantillas?: string
}

/** Cierre de página: titular enorme sobre una foto que se funde con el negro. */
export function LlamadoFinal({
  titulo = 'Tu sitio puede estar listo hoy',
  texto = 'Sin código y sin tarjeta de crédito.',
  hrefEmpezar = '/panel/crear-cuenta',
  hrefPlantillas = '/plantillas',
  textoPlantillas = 'Ver plantillas',
}: Props) {
  return (
    <section className="relative isolate overflow-hidden py-[140px] text-center md:py-[190px]">
      <Image
        src="/fotos/lana-hero.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-35"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,var(--color-black)_0%,color-mix(in_srgb,var(--color-black)_55%,transparent)_40%,color-mix(in_srgb,var(--color-black)_55%,transparent)_60%,var(--color-black)_100%)]" />
      <Revelar className="px-5">
        <span className="antetitulo mb-6">Empieza hoy</span>
        <h2 className="titulo-2 mx-auto max-w-[14ch]">{titulo}</h2>
        <p className="bajada mx-auto mt-5 !text-lg">{texto}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Boton href={hrefEmpezar} flecha>
            Empezar gratis
          </Boton>
          <Boton href={hrefPlantillas} variante="secundario">
            {textoPlantillas}
          </Boton>
        </div>
      </Revelar>
    </section>
  )
}
