'use client'

import { useEffect } from 'react'
import { capturarOrigen } from '@/utilidades/origen'

/** Guarda el utm_source o el código de referido con el que llegó la visita. */
export function CapturaOrigen() {
  useEffect(capturarOrigen, [])
  return null
}
