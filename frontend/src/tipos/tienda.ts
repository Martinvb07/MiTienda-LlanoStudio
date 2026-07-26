import type { Bloque } from './bloques'

/** Sobrescrituras de tema por tienda; se inyectan como variables CSS. */
export interface TemaTienda {
  colorMarca?: string
  colorFondo?: string
  colorTexto?: string
  fuenteTitulos?: string
  radio?: string
}

export interface Tienda {
  id: string
  nombre: string
  descripcion: string | null
  logoUrl: string | null
  faviconUrl: string | null
  plantilla: string
  tema: TemaTienda
  configuracionBloques: Bloque[]
  moneda: string
  publicada: boolean
}

export interface Producto {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  /** Texto, no número: los importes no pasan por float. */
  precio: string
  precioComparacion: string | null
  stock: number
  fotos: string[]
}
