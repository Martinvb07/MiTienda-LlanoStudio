import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { GaleriaPlantillas } from './GaleriaPlantillas'
import { Revelar } from './Revelar'

/** Adelanto en la portada: tres plantillas con su captura real. */
export function Plantillas() {
  return (
    <section id="plantillas" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="antetitulo mb-[22px]">Plantillas</span>
            <h2 className="titulo-2 max-w-[13ch]">Empieza con un diseño que ya vende</h2>
          </div>
          <div className="md:max-w-[34ch]">
            <p className="bajada">
              Tiendas reales armadas con cada plantilla. Abre una para ver todo lo que trae.
            </p>
            <Boton href="/plantillas" variante="secundario" tamano="normal" flecha className="mt-6">
              Ver las seis
            </Boton>
          </div>
        </Revelar>
        <GaleriaPlantillas limite={3} />
      </Contenedor>
    </section>
  )
}
