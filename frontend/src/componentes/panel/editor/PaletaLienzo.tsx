'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { LayoutTemplate, Lock, Shapes } from 'lucide-react'
import { ARRASTRE_PIEZA, ARRASTRE_SECCION } from '@/app/panel/vista-previa/mensajes'
import { ETIQUETAS_BLOQUE, type TipoBloque, type TipoElementoLienzo } from '@/tipos/bloques'
import { cn } from '@/utilidades/clases'
import { DISENOS_LIENZO } from '@/utilidades/lienzo'
import { iconoBloque } from './iconosBloque'
import { CURVA } from '../ui/basicos'
import { GRUPOS_PIEZAS } from './piezasLienzo'
import { gruposBloquePara } from '@/utilidades/sitio'
import { useSesion } from '../SesionPanel'

interface Props {
  /** Clic en una pieza: va al lienzo abierto (o a uno nuevo). */
  alAgregarPieza: (tipo: TipoElementoLienzo) => void
  /** Clic en una sección: entra donde corresponde. */
  alAgregarSeccion: (tipo: TipoBloque) => void
  alUsarDiseno?: (clave: string) => void
  /** Hay un lienzo abierto: se muestran primero las piezas y sus diseños. */
  conLienzo: boolean
  /** Lo que el plan incluye; lo demás va con candado. */
  bloquesDelPlan: readonly TipoBloque[]
  puedeLibre: boolean
}

const boton =
  'group flex cursor-grab flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] leading-tight text-sitio-suave transition-colors hover:bg-white/[0.07] hover:text-white active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Columna de la derecha del editor: secciones y piezas para arrastrar a la
 * página (o tocar para agregar). Las secciones caen entre secciones; las
 * piezas, en el punto donde se suelten.
 */
export function PaletaLienzo({ alAgregarPieza, alAgregarSeccion, alUsarDiseno, conLienzo, bloquesDelPlan, puedeLibre }: Props) {
  const [pestana, setPestana] = useState<'piezas' | 'secciones'>(conLienzo ? 'piezas' : 'secciones')
  // Una página no ofrece las secciones de catálogo.
  const grupos = gruposBloquePara(useSesion().sesion.tienda?.tipo)

  return (
    <motion.aside
      aria-label="Agregar"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 92, opacity: 1 }}
      transition={{ duration: 0.45, ease: CURVA }}
      className="min-h-0 overflow-hidden border-l border-sitio-borde bg-sitio-lateral"
    >
      <div className="flex h-full w-[92px] flex-col">
        <div className="grid grid-cols-2 gap-0.5 border-b border-sitio-borde p-1.5">
          {([
            { valor: 'secciones', Icono: LayoutTemplate, titulo: 'Secciones' },
            { valor: 'piezas', Icono: Shapes, titulo: 'Piezas' },
          ] as const).map(({ valor, Icono, titulo }) => (
            <button
              key={valor}
              type="button"
              title={titulo}
              aria-pressed={pestana === valor}
              onClick={() => setPestana(valor)}
              className={cn(
                'grid h-8 place-items-center rounded-md transition-colors',
                pestana === valor ? 'bg-white/[0.09] text-white' : 'text-sitio-tenue hover:text-white',
              )}
            >
              <Icono aria-hidden="true" className="h-4 w-4" />
            </button>
          ))}
        </div>
        <p className="px-2 pt-2 text-center text-[9.5px] leading-snug text-sitio-tenue">Arrastra a la página o toca</p>
        <div className="flex-1 overflow-y-auto overscroll-contain px-1.5 pb-6">
          {pestana === 'secciones'
            ? grupos.map((grupo) => (
                <div key={grupo.titulo} className="flex flex-col gap-0.5 border-t border-sitio-borde py-2 first-of-type:border-t-0">
                  <span className="text-center text-[9.5px] tracking-[0.1em] text-sitio-tenue uppercase">{grupo.titulo}</span>
                  {grupo.tipos.map((tipo) => {
                    const Icono = iconoBloque(tipo)
                    const incluida = bloquesDelPlan.includes(tipo)
                    return (
                      <button
                        key={tipo}
                        type="button"
                        draggable={incluida}
                        disabled={!incluida}
                        title={incluida ? ETIQUETAS_BLOQUE[tipo] : `${ETIQUETAS_BLOQUE[tipo]}: no está en tu plan`}
                        onDragStart={(evento) => {
                          evento.dataTransfer.setData(ARRASTRE_SECCION, tipo)
                          evento.dataTransfer.effectAllowed = 'copy'
                        }}
                        onClick={() => alAgregarSeccion(tipo)}
                        className={boton}
                      >
                        {incluida ? <Icono aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.6} /> : <Lock aria-hidden="true" className="h-4 w-4" />}
                        {ETIQUETAS_BLOQUE[tipo]}
                      </button>
                    )
                  })}
                </div>
              ))
            : (
              <>
                {!puedeLibre && <p className="py-3 text-center text-[10px] leading-snug text-sitio-tenue">Las piezas sueltas son del plan Negocio.</p>}
                {GRUPOS_PIEZAS.map((grupo) => (
                  <div key={grupo.titulo} className="flex flex-col gap-0.5 border-t border-sitio-borde py-2 first-of-type:border-t-0">
                    <span className="text-center text-[9.5px] tracking-[0.1em] text-sitio-tenue uppercase">{grupo.titulo}</span>
                    {grupo.piezas.map(({ tipo, etiqueta, Icono, detalle }) => (
                      <button
                        key={tipo}
                        type="button"
                        draggable={puedeLibre}
                        disabled={!puedeLibre}
                        title={detalle}
                        onDragStart={(evento) => {
                          evento.dataTransfer.setData(ARRASTRE_PIEZA, tipo)
                          evento.dataTransfer.effectAllowed = 'copy'
                        }}
                        onClick={() => alAgregarPieza(tipo)}
                        className={boton}
                      >
                        <Icono aria-hidden="true" className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.6} />
                        {etiqueta}
                      </button>
                    ))}
                  </div>
                ))}
                {conLienzo && alUsarDiseno && (
                  <div className="flex flex-col gap-1 border-t border-sitio-borde py-2">
                    <span className="text-center text-[9.5px] tracking-[0.1em] text-sitio-tenue uppercase">Diseños</span>
                    {DISENOS_LIENZO.map((diseno) => (
                      <button
                        key={diseno.clave}
                        type="button"
                        onClick={() => alUsarDiseno(diseno.clave)}
                        className="rounded-md px-1.5 py-1.5 text-center text-[10px] leading-tight text-sitio-suave transition-colors hover:bg-white/[0.07] hover:text-white"
                      >
                        {diseno.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </motion.aside>
  )
}
