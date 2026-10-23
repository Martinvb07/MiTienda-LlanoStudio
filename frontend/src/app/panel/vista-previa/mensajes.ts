import type { CajaLienzo } from '@/tipos/bloques'
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
    /** Muestra la barra de cada sección para moverla, duplicarla u ocultarla. */
    editable?: boolean
    /** Pieza del lienzo libre elegida en el editor: se marca con sus asas. */
    lienzoElegido?: { bloque: string; elemento: string } | null
  }
}

/** 'libre' pasa la sección a Lienzo libre (Editar libre). */
export type AccionSeccion = 'elegir' | 'libre' | 'subir' | 'bajar' | 'duplicar' | 'ocultar' | 'eliminar'

/** Lo que el iframe le devuelve al editor cuando se toca una sección. */
export interface MensajeAccionVista {
  tipo: 'mt-vista-accion'
  id: string
  accion: AccionSeccion
}

export type AccionLienzo = 'elegir' | 'mover' | 'alto' | 'adelante' | 'atras' | 'duplicar' | 'eliminar'

/**
 * Lo que el iframe le pide al editor al tocar el lienzo libre: elegir una
 * pieza, moverla o estirarla (caja nueva en %), cambiar el alto del lienzo…
 * `movil` dice si se estaba acomodando la versión de celular.
 */
export interface MensajeLienzo {
  tipo: 'mt-lienzo'
  bloque: string
  elemento: string | null
  accion: AccionLienzo
  caja?: CajaLienzo
  /** Alto nuevo del lienzo, en px sobre 1200 (o 390 en el celular). */
  alto?: number
  movil: boolean
}
