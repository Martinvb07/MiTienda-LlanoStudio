import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { GaleriaPlantillas } from '@/componentes/sitio/GaleriaPlantillas'

export const metadata: Metadata = {
  title: 'Plantillas',
  description:
    'Diez plantillas para tu tienda en línea, cuatro de ellas pro estilo supermercado: mercado, ropa, vivero y deporte. Editables sin código.',
  alternates: { canonical: '/plantillas' },
}

export default function PaginaPlantillas() {
  return (
    <>
      <CabeceraPagina
        rotulo="Plantillas"
        titulo="Diez tiendas listas para hacer tuyas"
        descripcion="Cámbiala cuando quieras, sin perder productos ni textos."
      >
        <Boton href="/panel/crear-cuenta?producto=tienda" flecha>
          Crear mi tienda
        </Boton>
      </CabeceraPagina>

      <section className="pt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Pro</span>
            <h2 className="titulo-2 max-w-[14ch]">Estilo supermercado</h2>
          </Revelar>
          <GaleriaPlantillas pro />
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Por rubro</span>
            <h2 className="titulo-2 max-w-[14ch]">Más plantillas</h2>
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
