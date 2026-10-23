import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'Mi Sitio es un producto de Llano Studio, un estudio colombiano. Tienda, página y enlaces para tu negocio, sin depender de un programador.',
  alternates: { canonical: '/sobre-nosotros' },
}

const PRINCIPIOS = [
  { titulo: 'Lo tuyo es tuyo', texto: 'Cambiar de plantilla o de plan nunca te cuesta el trabajo que ya hiciste.' },
  { titulo: 'Sin letra chica', texto: 'Sin comisión por venta y sin permanencia.' },
  { titulo: 'Hecho desde acá', texto: 'Pesos, pagos colombianos y WhatsApp, de fábrica.' },
]

export default function PaginaSobreNosotros() {
  return (
    <>
      <CabeceraPagina
        rotulo="Sobre nosotros"
        titulo="Un estudio colombiano haciendo herramientas para negocios"
        descripcion="Mi Sitio es un producto de Llano Studio."
      />

      <section className="py-[110px] md:py-[150px]">
        <Contenedor className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <Revelar>
            <div className="space-y-6 text-[clamp(20px,2vw,26px)] leading-[1.35] tracking-[-0.02em] text-white/60 text-pretty">
              <p>Casi todos los negocios pequeños de Colombia viven en WhatsApp e Instagram.</p>
              <p>Tener algo propio en internet suele pedir un programador, semanas y plata.</p>
              <p className="text-white">
                Mi Sitio quita ese intermediario: tu tienda, tu página y tus enlaces, los armas tú.
              </p>
            </div>
          </Revelar>

          <Revelar retardo={0.1}>
            <a
              href="https://llanostudio.co"
              target="_blank"
              rel="noopener noreferrer"
              className="baldosa group flex h-full flex-col p-8"
            >
              <LogoMarca alt="Llano Studio" className="h-9 w-auto self-start" />
              <h2 className="mt-8 text-[22px] tracking-[-0.03em]">Llano Studio</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                Estudio de desarrollo y diseño web. También hacemos software a medida.
              </p>
              <span className="enlace-flecha mt-8 md:mt-auto md:pt-8">
                Conocer el estudio
                <ArrowUpRight aria-hidden="true" />
              </span>
            </a>
          </Revelar>
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Cómo trabajamos</span>
            <h2 className="titulo-2 max-w-[14ch]">Tres cosas que no negociamos</h2>
          </Revelar>
          <div className="grid gap-x-10 gap-y-2 md:grid-cols-3">
            {PRINCIPIOS.map((principio, indice) => (
              <Revelar key={principio.titulo} retardo={indice * 0.08}>
                <div className="border-t border-white/12 py-7">
                  <span className="font-mono text-[12px] text-white/35">{String(indice + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-[19px] tracking-[-0.02em]">{principio.titulo}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{principio.texto}</p>
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
