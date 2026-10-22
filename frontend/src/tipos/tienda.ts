import type { Bloque } from './bloques'

export type FuenteTitulos = 'moderna' | 'clasica' | 'redondeada'

/** Sobrescrituras de tema por tienda; se inyectan como variables CSS. */
export interface TemaTienda {
  colorMarca?: string
  /** Color del texto sobre el color de marca (botones, barra de anuncio). */
  colorContraste?: string
  colorFondo?: string
  colorTexto?: string
  fuenteTitulos?: FuenteTitulos
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
  /** Plan del tenant; la API pública lo manda para decidir la marca del pie. */
  plan?: string
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

/** Producto tal como lo ve el panel: incluye los que están ocultos. */
export interface ProductoPanel extends Producto {
  activo: boolean
  actualizadoEn: string
}
