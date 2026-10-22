import { Check } from 'lucide-react'
import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'
import { obtenerPlanes } from '@/servicios/planes.servicio'

/**
 * Planes con los precios y textos que el admin edita en /panel/admin. Se
 * renderiza en el servidor y se refresca solo cada minuto.
 */
export async function TablaPrecios() {
  const planes = await obtenerPlanes()

  return (
    <section className="pt-20 pb-[110px] md:pb-[150px]">
      <Contenedor>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {planes.map((plan, indice) => (
            <Revelar key={plan.plan} retardo={indice * 0.08}>
              <article
                className={cn(
                  'baldosa flex h-full flex-col p-7',
                  plan.destacado && '!border-white/35 bg-sitio-modal',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[19px] tracking-[-0.02em]">{plan.nombre}</h2>
                  {plan.destacado && (
                    <span className="text-[10.5px] tracking-[0.14em] text-white/60 uppercase">El más elegido</span>
                  )}
                </div>
                <p className="mt-2 min-h-[2.75rem] text-[13.5px] leading-relaxed text-white/55">{plan.resumen}</p>

                <p className="mt-7 flex items-baseline gap-1.5">
                  <span className="text-[15px] text-white/50">$</span>
                  <span className="text-[46px] leading-none tracking-[-0.05em]">
                    {plan.precio === 0 ? '0' : new Intl.NumberFormat('es-CO').format(plan.precio)}
                  </span>
                </p>
                <p className="mt-2 text-[12px] text-white/40">{plan.precio === 0 ? 'para siempre' : 'al mes'}</p>

                <ul className="mt-7 flex-1 border-b border-white/10">
                  {plan.incluye.map((punto) => (
                    <li key={punto} className="flex gap-3 border-t border-white/10 py-3 text-[13.5px] text-white/75">
                      <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                      {punto}
                    </li>
                  ))}
                </ul>

                <Boton
                  href={plan.plan === 'PRO' ? '/contacto' : '/panel/crear-cuenta'}
                  variante={plan.destacado ? 'primario' : 'secundario'}
                  tamano="normal"
                  className="mt-7 w-full"
                >
                  {plan.precio === 0 ? 'Empezar gratis' : plan.plan === 'PRO' ? 'Hablar con nosotros' : `Elegir ${plan.nombre}`}
                </Boton>
              </article>
            </Revelar>
          ))}
        </div>

        <Revelar>
          <p className="mt-12 text-center text-[13px] text-white/40">
            Precios en pesos colombianos. Cambias o cancelas tu plan cuando quieras.
          </p>
        </Revelar>
      </Contenedor>
    </section>
  )
}
