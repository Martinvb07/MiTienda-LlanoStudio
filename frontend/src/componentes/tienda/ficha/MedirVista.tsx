'use client'

import { useEffect } from 'react'
import { medir } from '@/utilidades/medicion'

/** Avisa al pixel / Analytics que se abrió la ficha de un producto. */
export function MedirVista({ id, nombre, precio, moneda }: { id: string; nombre: string; precio: string; moneda: string }) {
  useEffect(() => {
    // Los scripts cargan después de la hidratación: se espera un momento.
    const espera = setTimeout(() => medir({ tipo: 'ver-producto', moneda, articulo: { id, nombre, precio: Number(precio), cantidad: 1 } }), 1500)
    return () => clearTimeout(espera)
  }, [id, nombre, precio, moneda])
  return null
}
