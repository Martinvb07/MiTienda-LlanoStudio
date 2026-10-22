'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { OpcionProducto, VarianteProducto } from '@/tipos/tienda'
import { CLASES_ENTRADA } from '../ui/basicos'
import { cn } from '@/utilidades/clases'

/** Todas las combinaciones de valores: S/Rojo, S/Azul, M/Rojo… */
function combinaciones(opciones: OpcionProducto[]): Record<string, string>[] {
  return opciones
    .filter((opcion) => opcion.nombre.trim() && opcion.valores.length > 0)
    .reduce<Record<string, string>[]>(
      (acumulado, opcion) => acumulado.flatMap((parcial) => opcion.valores.map((valor) => ({ ...parcial, [opcion.nombre]: valor }))),
      [{}],
    )
    .filter((combinacion) => Object.keys(combinacion).length > 0)
}

/**
 * Rehace la lista de variantes cuando cambian las opciones, conservando el
 * stock y el precio de las combinaciones que ya existían.
 */
export function regenerarVariantes(opciones: OpcionProducto[], actuales: VarianteProducto[]): VarianteProducto[] {
  return combinaciones(opciones).map((valores) => {
    const nombre = Object.values(valores).join(' / ')
    const previa = actuales.find((variante) => variante.nombre === nombre)
    return previa ?? { id: `v${Math.random().toString(36).slice(2, 9)}`, nombre, valores, precio: null, stock: 0 }
  })
}

function EntradaValores({ valores, alCambiar }: { valores: string[]; alCambiar: (valores: string[]) => void }) {
  const [texto, setTexto] = useState('')

  function agregar() {
    const nuevos = texto
      .split(',')
      .map((valor) => valor.trim())
      .filter((valor) => valor && !valores.includes(valor))
    if (nuevos.length) alCambiar([...valores, ...nuevos].slice(0, 20))
    setTexto('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-sitio-borde bg-[#121214] p-1.5 focus-within:border-white/40">
      {valores.map((valor) => (
        <span key={valor} className="flex items-center gap-1 rounded-md bg-white/[0.08] py-1 pr-1 pl-2 text-[12.5px]">
          {valor}
          <button
            type="button"
            aria-label={`Quitar ${valor}`}
            onClick={() => alCambiar(valores.filter((otro) => otro !== valor))}
            className="grid h-4 w-4 place-items-center rounded text-sitio-tenue hover:text-white"
          >
            <X aria-hidden="true" className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter' || evento.key === ',') {
            evento.preventDefault()
            agregar()
          } else if (evento.key === 'Backspace' && !texto && valores.length) {
            alCambiar(valores.slice(0, -1))
          }
        }}
        onBlur={agregar}
        placeholder={valores.length ? 'Otro valor' : 'S, M, L… y Enter'}
        className="min-w-[90px] flex-1 bg-transparent px-1 py-1 text-[13px] outline-none placeholder:text-sitio-tenue"
      />
    </div>
  )
}

/** Opciones (Talla, Color…) y la tabla de variantes con precio y stock de cada una. */
export function CamposVariantes({
  opciones,
  variantes,
  precioBase,
  maximo,
  alCambiar,
}: {
  opciones: OpcionProducto[]
  variantes: VarianteProducto[]
  precioBase: string
  /** Opciones que admite el plan. */
  maximo: number
  alCambiar: (opciones: OpcionProducto[], variantes: VarianteProducto[]) => void
}) {
  const cambiarOpciones = (nuevas: OpcionProducto[]) => alCambiar(nuevas, regenerarVariantes(nuevas, variantes))
  const cambiarVariante = (id: string, cambios: Partial<VarianteProducto>) =>
    alCambiar(
      opciones,
      variantes.map((variante) => (variante.id === id ? { ...variante, ...cambios } : variante)),
    )

  return (
    <div className="flex flex-col gap-3">
      {opciones.map((opcion, indice) => (
        <div key={indice} className="flex flex-col gap-2 rounded-[10px] border border-sitio-borde bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1.5">
            <input
              value={opcion.nombre}
              onChange={(evento) =>
                cambiarOpciones(opciones.map((otra, i) => (i === indice ? { ...otra, nombre: evento.target.value.slice(0, 30) } : otra)))
              }
              placeholder="Talla, Color, Material…"
              aria-label="Nombre de la opción"
              className={cn(CLASES_ENTRADA, 'flex-1')}
            />
            <button
              type="button"
              aria-label="Quitar opción"
              onClick={() => cambiarOpciones(opciones.filter((_, i) => i !== indice))}
              className="grid h-[38px] w-8 place-items-center text-sitio-tenue hover:text-red-300"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          <EntradaValores
            valores={opcion.valores}
            alCambiar={(valores) => cambiarOpciones(opciones.map((otra, i) => (i === indice ? { ...otra, valores } : otra)))}
          />
        </div>
      ))}

      {opciones.length < maximo && (
        <button
          type="button"
          onClick={() => cambiarOpciones([...opciones, { nombre: opciones.length === 0 ? 'Talla' : opciones.length === 1 ? 'Color' : '', valores: [] }])}
          className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-sitio-borde text-[12px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          {opciones.length === 0 ? 'Agregar tallas, colores u otras opciones' : 'Agregar otra opción'}
        </button>
      )}

      {variantes.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-sitio-borde">
          <div className="grid grid-cols-[1fr_96px_72px] gap-2 border-b border-sitio-borde bg-white/[0.03] px-3 py-2 text-[10.5px] tracking-[0.1em] text-sitio-tenue uppercase">
            <span>Variante</span>
            <span>Precio</span>
            <span>Stock</span>
          </div>
          <ul className="max-h-72 divide-y divide-sitio-borde overflow-y-auto">
            {variantes.map((variante) => (
              <li key={variante.id} className="grid grid-cols-[1fr_96px_72px] items-center gap-2 px-3 py-1.5">
                <span className="truncate text-[13px]">{variante.nombre}</span>
                <input
                  value={variante.precio ?? ''}
                  onChange={(evento) => {
                    const limpio = evento.target.value.replace(/\D/g, '').slice(0, 10)
                    cambiarVariante(variante.id, { precio: limpio || null })
                  }}
                  placeholder={precioBase || 'Igual'}
                  aria-label={`Precio de ${variante.nombre}`}
                  className={cn(CLASES_ENTRADA, '!px-2 !py-1.5 text-[12.5px]')}
                />
                <input
                  value={variante.stock}
                  onChange={(evento) => cambiarVariante(variante.id, { stock: Number(evento.target.value.replace(/\D/g, '').slice(0, 6)) || 0 })}
                  inputMode="numeric"
                  aria-label={`Stock de ${variante.nombre}`}
                  className={cn(CLASES_ENTRADA, '!px-2 !py-1.5 text-[12.5px]', variante.stock === 0 && 'text-sitio-ambar')}
                />
              </li>
            ))}
          </ul>
          <p className="border-t border-sitio-borde px-3 py-2 text-[11.5px] text-sitio-tenue">
            {variantes.reduce((suma, variante) => suma + variante.stock, 0)} unidades en total. Precio vacío = el del producto.
          </p>
        </div>
      )}
    </div>
  )
}
