import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'
import { TarjetasPrecios } from './TarjetasPrecios'
import { obtenerPlanes } from '@/servicios/planes.servicio'
import type { TipoSitio } from '@/tipos/tienda'

/**
 * Planes con los precios y textos que el admin edita en /panel/admin. Se
 * renderiza en el servidor y se refresca solo cada minuto.
 */
export async function TablaPrecios({ tipo = 'tienda' }: { tipo?: TipoSitio }) {
  const planes = await obtenerPlanes(tipo)
  // Quien viene de los precios de la página o de los enlaces se registra ya con ese producto elegido.
  const registro = tipo === 'tienda' ? '/panel/crear-cuenta' : `/panel/crear-cuenta?producto=${tipo}`

  return (
    <section className="pt-20 pb-[110px] md:pb-[150px]">
      <Contenedor>
        <TarjetasPrecios planes={planes} registro={registro} />

        <Revelar>
          <p className="mt-12 text-center text-[13px] text-white/40">
            Precios en pesos colombianos. Cambias o cancelas tu plan cuando quieras.
          </p>
        </Revelar>
      </Contenedor>
    </section>
  )
}
