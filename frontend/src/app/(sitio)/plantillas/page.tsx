import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { GaleriaPlantillas } from '@/componentes/sitio/GaleriaPlantillas'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { SelectorProducto } from '@/componentes/sitio/SelectorProducto'
import { MENU_PLANTILLAS } from '@/componentes/sitio/productos'

export const metadata: Metadata = {
  title: 'Plantillas',
  description: 'Plantillas para tu tienda en línea: supermercado, moda, plantas, deporte y más. Editables sin código.',
  alternates: { canonical: '/plantillas' },
}

export default function PaginaPlantillas() {
  return (
    <>
      <CabeceraPagina
        rotulo="Plantillas"
        titulo="Listas para hacer tuyas"
        descripcion={`${PLANTILLAS_TIENDA.length} diseños para vender en línea. Cámbiala cuando quieras.`}
      >
        <SelectorProducto opciones={MENU_PLANTILLAS} actual="tienda" />
      </CabeceraPagina>

      <section className="pt-24 pb-[110px] md:pb-[150px]">
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

      <LlamadoFinal />
    </>
  )
}
