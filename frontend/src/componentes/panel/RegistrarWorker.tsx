'use client'

import { useEffect } from 'react'
import { registrarWorker } from '@/utilidades/avisosPush'

/** Registra el service worker del panel: lo vuelve instalable y recibe los avisos push. */
export function RegistrarWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') void registrarWorker()
  }, [])
  return null
}
