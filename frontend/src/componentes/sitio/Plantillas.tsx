import { Boton } from './Boton'
import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'
import { PLANTILLAS } from './datosPlantillas'
import { TarjetaPlantilla } from './TarjetaPlantilla'

/** Adelanto en la portada: las tres primeras del catálogo. */
export function Plantillas() {
  return (
    <section id="plantillas" className="bg-white py-20 lg:py-28">
      <Contenedor>
        <Revelar className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Rotulo indice="—">Plantillas</Rotulo>
            <h2 className="mt-5 font-display text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-balance text-sitio-tinta sm:text-5xl">
              Empezá con un diseño que ya funciona
            </h2>
            <p className="mt-4 text-pretty text-sitio-suave">
              Cada plantilla es un punto de partida, no una jaula: podés mover, quitar y agregar
              bloques sin perder nada de lo que ya cargaste.
            </p>
          </div>
          <Boton href="/plantillas" variante="secundario" flecha className="shrink-0">
            Ver todas
          </Boton>
        </Revelar>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANTILLAS.slice(0, 3).map((plantilla, indice) => (
            <Revelar key={plantilla.nombre} retardo={indice * 0.08}>
              <TarjetaPlantilla plantilla={plantilla} />
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
