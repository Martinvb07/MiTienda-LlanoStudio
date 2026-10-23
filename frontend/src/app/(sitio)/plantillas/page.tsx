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
    'Diseños listos para moda, tecnología, hogar, alimentos, artesanía y belleza. Todos editables bloque a bloque, sin escribir código.',
}

export default function PaginaPlantillas() {
  return (
    <>
      <CabeceraPagina
        rotulo="Plantillas"
        titulo="Nueve tiendas listas para hacer tuyas"
        descripcion="Elige el diseño que más se parezca a lo que vendes y cambia lo que quieras. Puedes saltar de una plantilla a otra sin perder productos ni textos."
      >
        <Boton href="/panel/crear-cuenta" flecha>
          Crear mi tienda
        </Boton>
      </CabeceraPagina>

      <section className="pt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          <GaleriaPlantillas />
          <Revelar>
            <p className="mx-auto mt-20 max-w-[52ch] text-center text-[15px] leading-relaxed text-white/50">
              Las plantillas Gratis están para todos; las demás se desbloquean con el plan indicado. Todas
              parten de los mismos bloques, así que también puedes armar la tuya desde cero.
            </p>
          </Revelar>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
