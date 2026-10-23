'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Plus, X } from 'lucide-react'
import { guardarPlan, listarPlanes, type OfertaPlan } from '@/servicios/admin'
import { PLANES } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, CLASES_ENTRADA, Campo, CampoArea, Interruptor } from '../panel/ui/basicos'

const SALIDA = [0.16, 1, 0.3, 1] as const

/**
 * Precios y textos de cada plan, tal como salen en /precios. Los límites
 * técnicos (productos, fotos, secciones) los fija el código, no esta pantalla.
 */
export function EditorPlanes() {
  const [planes, setPlanes] = useState<OfertaPlan[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h1 className="text-[clamp(34px,4.4vw,60px)] leading-none tracking-[-0.045em]">Planes y precios</h1>
        <p className="max-w-[46ch] text-[13px] text-white/45">
          Lo que guardes aquí se ve en la página de precios en menos de un minuto. Los límites de cada plan se
          ajustan en el código.
        </p>
      </div>

      <AnimatePresence>{error && <div className="mt-6"><Aviso>{error}</Aviso></div>}</AnimatePresence>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {!planes
          ? [0, 1, 2, 3].map((indice) => <div key={indice} className="brillo h-[420px] rounded-[12px]" />)
          : planes.map((plan, indice) => (
              <motion.div
                key={plan.plan}
                initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: indice * 0.06, ease: SALIDA }}
              >
                <TarjetaPlan inicial={plan} alGuardar={setPlanes} />
              </motion.div>
            ))}
      </div>
    </>
  )
}

function TarjetaPlan({ inicial, alGuardar }: { inicial: OfertaPlan; alGuardar: (planes: OfertaPlan[]) => void }) {
  const [plan, setPlan] = useState(inicial)
  const [nuevo, setNuevo] = useState('')
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'guardado'>('quieto')
  const [error, setError] = useState('')
  const sucio = JSON.stringify(plan) !== JSON.stringify(inicial)

  // Si otro plan pasa a destacado, este se actualiza con lo que devolvió la API.
  useEffect(() => setPlan(inicial), [inicial])

  const cambiar = (cambios: Partial<OfertaPlan>) => setPlan((actual) => ({ ...actual, ...cambios }))

  async function guardar() {
    setEstado('guardando')
    setError('')
    try {
      alGuardar(await guardarPlan(plan))
      setEstado('guardado')
      setTimeout(() => setEstado('quieto'), 2000)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
      setEstado('quieto')
    }
  }

  function agregar() {
    const texto = nuevo.trim()
    if (!texto) return
    cambiar({ incluye: [...plan.incluye, texto] })
    setNuevo('')
  }

  return (
    <article className={cn('baldosa flex h-full flex-col p-6 md:p-7', plan.destacado && '!border-white/30')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[22px] tracking-[-0.03em]">{PLANES[plan.plan].nombre}</h2>
        <span className="font-mono text-[11px] text-white/35">{plan.plan}</span>
      </div>

      <div className="mt-6 grid gap-4">
        <Campo
          etiqueta="Precio mensual (COP)"
          prefijo="$"
          valor={plan.precio === 0 ? '0' : String(plan.precio)}
          alCambiar={(valor) => cambiar({ precio: Number(valor.replace(/\D/g, '').slice(0, 9)) || 0 })}
          ayuda={plan.precio === 0 ? 'Gratis' : `$ ${new Intl.NumberFormat('es-CO').format(plan.precio)} al mes`}
        />
        {plan.plan !== 'GRATIS' && (
          <Campo
            etiqueta="Precio anual (COP)"
            prefijo="$"
            valor={plan.precioAnual === 0 ? '0' : String(plan.precioAnual)}
            alCambiar={(valor) => cambiar({ precioAnual: Number(valor.replace(/\D/g, '').slice(0, 10)) || 0 })}
            ayuda={
              plan.precioAnual === 0
                ? 'En 0 no se ofrece el pago anual'
                : `$ ${new Intl.NumberFormat('es-CO').format(plan.precioAnual)} al año${
                    plan.precio > 0 ? ` · ${Math.round((1 - plan.precioAnual / (plan.precio * 12)) * 100)}% de ahorro` : ''
                  }`
            }
          />
        )}
        <CampoArea etiqueta="Resumen" valor={plan.resumen} alCambiar={(resumen) => cambiar({ resumen })} filas={2} maximo={200} />

        <div>
          <span className="text-[11.5px] text-sitio-suave">Lo que incluye</span>
          <ul className="mt-2 border-b border-white/10">
            <AnimatePresence initial={false}>
              {plan.incluye.map((punto, indice) => (
                <motion.li
                  key={`${indice}-${punto}`}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: SALIDA }}
                  className="overflow-hidden"
                >
                  <div className="group flex items-center gap-3 border-t border-white/10 py-2.5 text-[13.5px] text-white/80">
                    <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-white/35" />
                    <span className="flex-1">{punto}</span>
                    <button
                      type="button"
                      aria-label={`Quitar ${punto}`}
                      onClick={() => cambiar({ incluye: plan.incluye.filter((_, otro) => otro !== indice) })}
                      className="grid h-6 w-6 place-items-center rounded-md text-white/30 opacity-0 transition-[opacity,color] group-hover:opacity-100 hover:text-white"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-2 flex gap-2">
            <input
              value={nuevo}
              onChange={(evento) => setNuevo(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') {
                  evento.preventDefault()
                  agregar()
                }
              }}
              placeholder="Agregar un punto y presionar Enter"
              maxLength={120}
              className={CLASES_ENTRADA}
            />
            <button
              type="button"
              onClick={agregar}
              aria-label="Agregar punto"
              className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-lg border border-sitio-borde text-white/60 transition-colors hover:border-white/30 hover:text-white"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Interruptor activo={plan.destacado} alCambiar={(destacado) => cambiar({ destacado })}>
          Mostrar como “el más elegido”
        </Interruptor>
      </div>

      <AnimatePresence>{error && <div className="mt-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>

      <div className="mt-auto flex items-center justify-end gap-3 pt-6">
        <AnimatePresence>
          {estado === 'guardado' && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-[12px] text-sitio-verde"
            >
              <Check aria-hidden="true" className="h-3.5 w-3.5" /> Guardado
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!sucio || estado === 'guardando'}
          className="boton boton-primario boton-chico"
        >
          {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </article>
  )
}
