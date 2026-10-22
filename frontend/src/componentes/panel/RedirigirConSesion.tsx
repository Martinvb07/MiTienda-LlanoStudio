'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { leerToken } from '@/servicios/panel'

/**
 * En ingresar y crear cuenta: si ya hay sesión abierta, al panel. Si venía de
 * elegir un plan en /precios (?plan), directo a pagarlo.
 */
export function RedirigirConSesion() {
  const router = useRouter()
  useEffect(() => {
    if (!leerToken()) return
    const quierePlan = new URLSearchParams(window.location.search).has('plan')
    router.replace(quierePlan ? '/panel/plan' : '/panel')
  }, [router])
  return null
}
