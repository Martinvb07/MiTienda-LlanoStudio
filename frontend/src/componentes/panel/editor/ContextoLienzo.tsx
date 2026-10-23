'use client'

import { createContext, useContext } from 'react'
import type { Producto } from '@/tipos/tienda'

/** Pieza del lienzo libre elegida y si se está acomodando el celular. */
export interface ContextoLienzo {
  elegido: { bloque: string; elemento: string } | null
  elegir: (bloque: string, elemento: string | null) => void
  movil: boolean
  /** Para elegir el producto o la categoría de las piezas vivas. */
  productos: Producto[]
  categorias: string[]
}

export const ContextoEditorLienzo = createContext<ContextoLienzo>({
  elegido: null,
  elegir: () => {},
  movil: false,
  productos: [],
  categorias: [],
})

export const useLienzo = () => useContext(ContextoEditorLienzo)
