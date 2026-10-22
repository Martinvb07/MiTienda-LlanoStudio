import { Boton } from './Boton'
import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { TarjetaPlantilla } from './TarjetaPlantilla'

/** Adelanto en la portada: las tres primeras del catálogo. */
export function Plantillas() {
  return (
    <section id="plantillas" className="py-20 lg:py-28">
      <Contenedor>
        <Revelar className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Rotulo>Plantillas</Rotulo>
            <h2 className="mt-5 titulo-2">
              Empieza con un diseño que ya funciona
            </h2>
            <p className="mt-4 text-pretty text-sitio-suave">
              Cada plantilla es un punto de partida, no una jaula: puedes mover, quitar y agregar
              bloques sin perder nada de lo que ya cargaste.
            </p>
          </div>
          <Boton href="/plantillas" variante="secundario" flecha className="shrink-0">
            Ver todas
          </Boton>
        </Revelar>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANTILLAS_TIENDA.slice(0, 3).map((plantilla, indice) => (
            <Revelar key={plantilla.clave} retardo={indice * 0.08}>
              <TarjetaPlantilla clave={plantilla.clave} />
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
