import type { Producto, Tienda } from '@/tipos/tienda'

/** Lo que el editor le manda al iframe de la vista previa. */
export interface MensajeVistaPrevia {
  tipo: 'mt-vista'
  datos: {
    tienda: Pick<Tienda, 'nombre' | 'logoUrl' | 'tema' | 'configuracionBloques' | 'moneda' | 'ajustes'> & {
      plan?: string
    }
    productos: Producto[]
    /** 'producto' muestra la ficha de `producto` en vez de la portada. */
    vista: 'tienda' | 'producto'
    producto?: Producto
    /** Bloque que se está editando: se resalta y se lleva a la vista. */
    enfocar?: string | null
  }
}
