import type { CajaLienzo } from '@/tipos/bloques'
import type { Producto, Tienda } from '@/tipos/tienda'

/** Lo que el editor le manda al iframe de la vista previa. */
export interface MensajeVistaPrevia {
  tipo: 'mt-vista'
  datos: {
    tienda: Pick<Tienda, 'nombre' | 'logoUrl' | 'tema' | 'configuracionBloques' | 'moneda' | 'ajustes' | 'tipo'> & {
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
    /** Varias piezas elegidas con Shift + clic (del mismo lienzo que lienzoElegido). */
    lienzoGrupo?: string[]
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
 *
 * Con varias piezas elegidas (Shift + clic), `elementos` trae todas: elegir,
 * duplicar, eliminar y cambiar de capa se aplican al grupo, y mover trae la
 * caja nueva de cada una en `cajas`.
 */
export interface MensajeLienzo {
  tipo: 'mt-lienzo'
  bloque: string
  elemento: string | null
  accion: AccionLienzo
  elementos?: string[]
  caja?: CajaLienzo
  cajas?: Record<string, CajaLienzo>
  /** Alto nuevo del lienzo, en px sobre 1200 (o 390 en el celular). */
  alto?: number
  movil: boolean
}

/** Formatos del arrastre desde la paleta de la derecha (el tipo viaja en los datos). */
export const ARRASTRE_PIEZA = 'text/x-mi-sitio-pieza'
export const ARRASTRE_SECCION = 'text/x-mi-sitio-seccion'

/**
 * Lo que el iframe avisa al soltar algo de la paleta: una pieza en un punto
 * de una sección (x, y en % de ella) o una sección nueva antes de otra.
 */
export interface MensajeSoltar {
  tipo: 'mt-soltar'
  clase: 'pieza' | 'seccion'
  /** El tipo de pieza o de sección que se soltó. */
  que: string
  /** pieza: la sección donde cayó; seccion: la que queda debajo (null = al final). */
  bloque: string | null
  x?: number
  y?: number
  movil: boolean
}
