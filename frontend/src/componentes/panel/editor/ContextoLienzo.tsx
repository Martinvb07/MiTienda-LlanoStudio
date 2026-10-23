'use client'

import { createContext, useContext } from 'react'

/** Pieza del lienzo libre elegida y si se está acomodando el celular. */
export interface ContextoLienzo {
  elegido: { bloque: string; elemento: string } | null
  elegir: (bloque: string, elemento: string | null) => void
  movil: boolean
}

export const ContextoEditorLienzo = createContext<ContextoLienzo>({ elegido: null, elegir: () => {}, movil: false })

export const useLienzo = () => useContext(ContextoEditorLienzo)
