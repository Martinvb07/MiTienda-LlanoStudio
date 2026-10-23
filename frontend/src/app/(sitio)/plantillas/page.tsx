import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { GaleriaPlantillas } from '@/componentes/sitio/GaleriaPlantillas'
import { PLANTILLAS_PAGINA } from '@/utilidades/plantillasPagina'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { Link2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Plantillas',
  description:
    'Plantillas para tu tienda en línea y para la página de tu negocio: abogados, clínicas, restaurantes y servicios. Editables sin código.',
  alternates: { canonical: '/plantillas' },
}

export default function PaginaPlantillas() {
  return (
    <>
      <CabeceraPagina
        rotulo="Plantillas"
        titulo="Listas para hacer tuyas"
        descripcion={`${PLANTILLAS_TIENDA.length} para tiendas y ${PLANTILLAS_PAGINA.length} para negocios. Cámbiala cuando quieras.`}
      >
        <Boton href="#tienda" flecha>
          Tienda en línea
        </Boton>
        <Boton href="#pagina" variante="secundario">
          Página para tu negocio
        </Boton>
      </CabeceraPagina>

      <section id="tienda" className="scroll-mt-24 pt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Tienda en línea · Pro</span>
            <h2 className="titulo-2 max-w-[14ch]">Estilo supermercado</h2>
          </Revelar>
          <GaleriaPlantillas pro />
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Tienda en línea · Por rubro</span>
            <h2 className="titulo-2 max-w-[14ch]">Más tiendas</h2>
          </Revelar>
          <GaleriaPlantillas pro={false} />
          <Revelar>
            <p className="mx-auto mt-20 max-w-[52ch] text-center text-[15px] leading-relaxed text-white/50">
              Cada una indica desde qué plan se usa. También puedes armar la tuya desde cero.
            </p>
          </Revelar>
        </Contenedor>
      </section>

      <section id="pagina" className="scroll-mt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <span className="antetitulo mb-[22px]">Página para tu negocio</span>
              <h2 className="titulo-2 max-w-[14ch]">Sin carrito, con tu WhatsApp</h2>
            </div>
            <p className="bajada md:justify-self-end">Servicios, equipo, horario y contacto.</p>
          </Revelar>
          <GaleriaPlantillas tipo="pagina" />
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar>
            <div className="baldosa flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center md:p-9">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/12 text-white/70">
                <Link2 aria-hidden="true" strokeWidth={1.5} className="h-[18px] w-[18px]" />
              </span>
              <div className="flex-1">
                <h3 className="text-[19px] tracking-[-0.02em]">Enlaces para tu bio</h3>
                <p className="mt-1 text-[14px] text-white/55">Sus plantillas llegan con el producto.</p>
              </div>
              <span className="estado estado-chico" data-tono="azul">
                <span className="estado-punto" />
                Próximamente
              </span>
            </div>
          </Revelar>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
