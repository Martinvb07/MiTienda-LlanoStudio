import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { TarjetaPlantilla } from '@/componentes/sitio/TarjetaPlantilla'

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
        titulo="Un punto de partida, no una jaula"
        descripcion="Elige el diseño que más se parezca a lo que vendes y cambia lo que quieras. Puedes saltar de una plantilla a otra sin perder productos ni textos."
      >
        <Boton href="/panel/crear-cuenta" tamano="grande" flecha>
          Crear mi tienda
        </Boton>
      </CabeceraPagina>

      <section className="py-16 lg:py-20">
        <Contenedor>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLANTILLAS_TIENDA.map((plantilla, indice) => (
              <Revelar key={plantilla.clave} retardo={(indice % 3) * 0.08}>
                <TarjetaPlantilla clave={plantilla.clave} />
              </Revelar>
            ))}
          </div>

          <Revelar>
            <p className="mt-14 rounded-lg border border-dashed border-sitio-borde-fuerte px-6 py-8 text-center text-sitio-suave">
              Las plantillas de Gratis están disponibles para todos; las demás se desbloquean con
              el plan indicado. Todas parten de los mismos bloques, así que también puedes armar la
              tuya desde cero en el editor.
            </p>
          </Revelar>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
