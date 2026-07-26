'use client'

import { useCallback, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Bloque, TipoBloque } from '@/tipos/bloques'

/** Props iniciales de cada tipo de bloque al añadirlo desde el panel. */
const PROPS_INICIALES: { [T in TipoBloque]: Extract<Bloque, { tipo: T }>['props'] } = {
  hero: { titulo: 'Título de la portada', subtitulo: 'Un subtítulo corto' },
  'grilla-productos': { titulo: 'Productos', limite: 8, columnas: 3 },
  texto: { contenido: 'Escribe aquí el texto de la sección.' },
  pie: { texto: '© Mi tienda', mostrarRedes: true },
}

/**
 * Estado del constructor de bloques: reordenar, añadir, quitar y editar props.
 *
 * Mantiene el diseño como datos, que es lo que después se guarda en
 * Tienda.configuracionBloques y lee la tienda pública.
 *
 * El prefijo `use` es obligatorio aunque el resto del código esté en español:
 * React identifica los hooks por ese nombre y la regla rules-of-hooks del lint
 * lo exige. Sólo el prefijo; lo demás va en español.
 */
export function useEditorBloques(inicial: Bloque[]) {
  const [bloques, setBloques] = useState<Bloque[]>(inicial)
  const [sucio, setSucio] = useState(false)

  const alSoltar = useCallback((evento: DragEndEvent) => {
    const { active, over } = evento
    if (!over || active.id === over.id) return

    setBloques((actuales) => {
      const desde = actuales.findIndex((bloque) => bloque.id === active.id)
      const hasta = actuales.findIndex((bloque) => bloque.id === over.id)
      if (desde === -1 || hasta === -1) return actuales
      return arrayMove(actuales, desde, hasta)
    })
    setSucio(true)
  }, [])

  const anadirBloque = useCallback((tipo: TipoBloque) => {
    setBloques((actuales) => [
      ...actuales,
      {
        id: `${tipo}-${crypto.randomUUID().slice(0, 8)}`,
        tipo,
        props: PROPS_INICIALES[tipo],
      } as Bloque,
    ])
    setSucio(true)
  }, [])

  const quitarBloque = useCallback((id: string) => {
    setBloques((actuales) => actuales.filter((bloque) => bloque.id !== id))
    setSucio(true)
  }, [])

  const alternarVisibilidad = useCallback((id: string) => {
    setBloques((actuales) =>
      actuales.map((bloque) =>
        bloque.id === id ? { ...bloque, visible: bloque.visible === false } : bloque,
      ),
    )
    setSucio(true)
  }, [])

  const marcarGuardado = useCallback(() => setSucio(false), [])

  return {
    bloques,
    sucio,
    alSoltar,
    anadirBloque,
    quitarBloque,
    alternarVisibilidad,
    marcarGuardado,
  }
}
