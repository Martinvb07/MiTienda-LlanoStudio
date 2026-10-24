'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { Boton } from './Boton'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'
import type { PlanPublico } from '@/servicios/planes.servicio'

type Periodo = 'mensual' | 'anual'

const CURVA = [0.16, 1, 0.3, 1] as const
const pesos = (valor: number) => new Intl.NumberFormat('es-CO').format(valor)

/** Cuánto se ahorra pagando el año de una vez, en %. 0 si no hay pago anual. */
const ahorro = (plan: PlanPublico) =>
  plan.precio > 0 && plan.precioAnual > 0 && plan.precioAnual < plan.precio * 12
    ? Math.round((1 - plan.precioAnual / (plan.precio * 12)) * 100)
    : 0

/**
 * Las tarjetas de los planes con el cambio entre pago mensual y anual: una
 * píldora que se desliza entre las dos opciones y precios que suben al cambiar.
 */
export function TarjetasPrecios({ planes, registro }: { planes: PlanPublico[]; registro: string }) {
  const [periodo, setPeriodo] = useState<Periodo>('mensual')
  const mayorAhorro = Math.max(0, ...planes.map(ahorro))
  const conAnual = planes.some((plan) => plan.precioAnual > 0)

  return (
    <>
      {conAnual && (
        <Revelar className="mb-12 flex justify-center">
          <div role="radiogroup" aria-label="Forma de pago" className="relative inline-flex rounded-full border border-white/12 bg-white/[0.03] p-1">
            {(['mensual', 'anual'] as const).map((opcion) => {
              const elegida = periodo === opcion
              return (
                <button
                  key={opcion}
                  type="button"
                  role="radio"
                  aria-checked={elegida}
                  onClick={() => setPeriodo(opcion)}
                  className={cn(
                    'relative inline-flex h-10 items-center gap-2 rounded-full px-5 text-[13px] transition-colors duration-500',
                    elegida ? 'text-black' : 'text-white/60 hover:text-white',
                  )}
                >
                  {elegida && (
                    <motion.span
                      layoutId="pildora-periodo"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      className="absolute inset-0 -z-0 rounded-full bg-white"
                    />
                  )}
                  <span className="relative">{opcion === 'mensual' ? 'Mensual' : 'Anual'}</span>
                  {opcion === 'anual' && mayorAhorro > 0 && (
                    <span
                      className={cn(
                        'relative rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-[0.02em] transition-colors duration-500',
                        elegida ? 'bg-black/10 text-black' : 'bg-white/[0.08] text-white/70',
                      )}
                    >
                      −{mayorAhorro}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Revelar>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {planes.map((plan, indice) => {
          const anual = periodo === 'anual' && plan.precioAnual > 0
          const monto = plan.precio === 0 ? 0 : anual ? plan.precioAnual : plan.precio
          return (
            <Revelar key={plan.plan} retardo={indice * 0.08}>
              <article className={cn('baldosa flex h-full flex-col p-7', plan.destacado && '!border-white/35 bg-sitio-modal')}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[19px] tracking-[-0.02em]">{plan.nombre}</h2>
                  {plan.destacado && <span className="text-[10.5px] tracking-[0.14em] text-white/60 uppercase">El más elegido</span>}
                </div>
                <p className="mt-2 min-h-[2.75rem] text-[13.5px] leading-relaxed text-white/55">{plan.resumen}</p>

                <div className="mt-7 h-[46px] overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={monto}
                      initial={{ y: 28, opacity: 0, filter: 'blur(6px)' }}
                      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                      exit={{ y: -28, opacity: 0, filter: 'blur(6px)' }}
                      transition={{ duration: 0.55, ease: CURVA }}
                      className="flex items-baseline gap-1.5"
                    >
                      <span className="text-[15px] text-white/50">$</span>
                      <span className="text-[46px] leading-none tracking-[-0.05em]">{pesos(monto)}</span>
                    </motion.p>
                  </AnimatePresence>
                </div>
                <p className="mt-2 min-h-[18px] text-[12px] text-white/40">
                  {plan.precio === 0 ? (
                    'para siempre'
                  ) : anual ? (
                    <>
                      al año · <span className="text-white/70">$ {pesos(Math.round(plan.precioAnual / 12))} al mes</span>
                      {ahorro(plan) > 0 && <> (ahorras {ahorro(plan)}%)</>}
                    </>
                  ) : (
                    'al mes'
                  )}
                </p>

                <ul className="mt-7 flex-1 border-b border-white/10">
                  {plan.incluye.map((punto) => (
                    <li key={punto} className="flex gap-3 border-t border-white/10 py-3 text-[13.5px] text-white/75">
                      <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                      {punto}
                    </li>
                  ))}
                </ul>

                <Boton
                  href={plan.plan === 'PRO' ? '/contacto' : plan.precio === 0 ? registro : `${registro}${registro.includes('?') ? '&' : '?'}plan=1`}
                  variante={plan.destacado ? 'primario' : 'secundario'}
                  tamano="normal"
                  className="mt-7 w-full"
                >
                  {plan.precio === 0 ? 'Empezar gratis' : plan.plan === 'PRO' ? 'Hablar con nosotros' : `Elegir ${plan.nombre}`}
                </Boton>
              </article>
            </Revelar>
          )
        })}
      </div>
    </>
  )
}
