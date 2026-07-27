import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { PLANTILLAS } from '@/componentes/sitio/datosPlantillas'
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
        descripcion="Elegí el diseño que más se parezca a lo que vendés y cambiá lo que quieras. Podés saltar de una plantilla a otra sin perder productos ni textos."
      >
        <Boton href="/panel/crear-cuenta" tamano="grande" flecha>
          Crear mi tienda
        </Boton>
      </CabeceraPagina>

      <section className="bg-white py-16 lg:py-20">
        <Contenedor>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLANTILLAS.map((plantilla, indice) => (
              <Revelar key={plantilla.nombre} retardo={(indice % 3) * 0.08}>
                <TarjetaPlantilla plantilla={plantilla} />
              </Revelar>
            ))}
          </div>

          <Revelar>
            <p className="mt-14 rounded-2xl border border-dashed border-sitio-borde-fuerte bg-sitio-crema px-6 py-8 text-center text-sitio-suave">
              ¿No ves la tuya? Todas las plantillas parten de los mismos bloques, así que podés
              armar la tuya desde cero en el editor.
            </p>
          </Revelar>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
