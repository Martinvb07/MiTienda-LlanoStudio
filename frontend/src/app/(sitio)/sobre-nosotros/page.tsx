import type { Metadata } from 'next'
import Image from 'next/image'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor, Rotulo } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'Mi Tienda es un producto de Llano Studio, un estudio de desarrollo colombiano. Construimos herramientas para que vender en línea no dependa de saber programar.',
}

const PRINCIPIOS = [
  {
    titulo: 'El contenido es tuyo',
    texto:
      'El diseño de tu tienda se guarda como piezas, no como una página cerrada. Cambiar de plantilla nunca te cuesta el trabajo que ya hiciste.',
  },
  {
    titulo: 'Sin letra chica',
    texto:
      'No cobramos comisión sobre tus ventas ni atamos a nadie con permanencia. Si la plataforma deja de servirte, te vas con tus datos.',
  },
  {
    titulo: 'Pensado desde acá',
    texto:
      'Precios en pesos, medios de pago que tus clientes ya usan y facturación adaptada al país. No es una traducción de otra cosa.',
  },
]

export default function PaginaSobreNosotros() {
  return (
    <>
      <CabeceraPagina
        rotulo="Sobre nosotros"
        titulo="Un estudio colombiano haciendo herramientas para vender"
        descripcion="Mi Tienda es un producto de Llano Studio. Nos dedicamos a construir software que resuelve problemas concretos de negocios reales."
      />

      <section className="py-16 lg:py-20">
        <Contenedor>
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <Revelar>
              <div className="space-y-5 text-lg leading-relaxed text-pretty text-sitio-suave">
                <p>
                  Casi todos los negocios pequeños de Colombia venden por WhatsApp. Funciona
                  hasta que deja de funcionar: se pierden pedidos, nadie sabe qué hay en stock y
                  el catálogo son fotos sueltas en una conversación.
                </p>
                <p>
                  El salto a una tienda propia normalmente pide contratar a alguien que la
                  programe, esperar semanas y depender de esa persona cada vez que hay que
                  cambiar un precio. Ese costo deja fuera a la mayoría.
                </p>
                <p className="font-medium text-sitio-tinta">
                  Mi Tienda existe para quitar ese intermediario. Armas tu tienda tú, la
                  publicas el mismo día y la cambias cuando quieras sin pedirle permiso a nadie.
                </p>
              </div>
            </Revelar>

            <Revelar retardo={0.1}>
              <div className="rounded-2xl border border-sitio-borde bg-sitio-crema p-7">
                <Image
                  src="/llanostudio-marca-oscura.png"
                  alt="Llano Studio"
                  width={220}
                  height={194}
                  className="h-10 w-auto"
                />
                <h2 className="mt-5 text-lg font-medium tracking-[-0.02em] text-sitio-tinta">
                  Llano Studio
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-sitio-suave">
                  Estudio de desarrollo y diseño web. Además de Mi Tienda construimos software a
                  medida para negocios que necesitan algo propio.
                </p>
                <a
                  href="https://llanostudio.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sitio-azul transition-colors hover:text-sitio-azul-claro"
                >
                  Conocer el estudio
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </Revelar>
          </div>
        </Contenedor>
      </section>

      <section className="py-20 lg:py-24">
        <Contenedor>
          <Revelar className="max-w-2xl">
            <Rotulo>Cómo trabajamos</Rotulo>
            <h2 className="mt-5 titulo-2">
              Tres cosas que no negociamos
            </h2>
          </Revelar>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {PRINCIPIOS.map((principio, indice) => (
              <Revelar key={principio.titulo} retardo={indice * 0.08}>
                <div className="border-t border-sitio-borde-fuerte pt-5">
                  <span className="font-display text-sm font-medium text-sitio-azul">
                    0{indice + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-medium tracking-[-0.02em] text-sitio-tinta">
                    {principio.titulo}
                  </h3>
                  <p className="mt-2 leading-relaxed text-pretty text-sitio-suave">
                    {principio.texto}
                  </p>
                </div>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
