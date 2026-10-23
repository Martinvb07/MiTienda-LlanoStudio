import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { GaleriaPlantillas } from './GaleriaPlantillas'
import { Revelar } from './Revelar'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'

/** Adelanto en la portada: tres de las plantillas pro con su captura real. */
export function Plantillas() {
  return (
    <section id="plantillas" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="antetitulo mb-[22px]">Plantillas</span>
            <h2 className="titulo-2 max-w-[13ch]">Empieza con una tienda que ya vende</h2>
          </div>
          <div className="md:max-w-[34ch]">
            <p className="bajada">
              {PLANTILLAS_TIENDA.length} tiendas de ejemplo, cuatro de ellas pro. Abre una para verla completa.
            </p>
            <Boton href="/plantillas" variante="secundario" tamano="normal" flecha className="mt-6">
              Ver todas
            </Boton>
          </div>
        </Revelar>
        <GaleriaPlantillas limite={3} pro />
      </Contenedor>
    </section>
  )
}
