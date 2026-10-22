import type { TipoBloque } from '@/tipos/bloques'

/**
 * Qué puede personalizar cada plan. Es la misma tabla que hace cumplir el
 * backend (backend/src/utilidades/planes.ts): si cambias una, cambia la otra.
 * Aquí sólo sirve para mostrar candados y avisos antes de que la API rechace.
 */

export type Plan = 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'

export interface LimitesPlan {
  nombre: string
  /** null = sin límite. */
  productos: number | null
  fotosPorProducto: number
  secciones: number
  bloques: readonly TipoBloque[]
  /** Colores, letra y esquinas a mano; si no, sólo los estilos predefinidos. */
  temaLibre: boolean
  /** Puede quitar "Hecho con Mi Tienda" del pie. */
  quitarMarca: boolean
}

const TODOS_LOS_BLOQUES: readonly TipoBloque[] = ['anuncio', 'hero', 'grilla-productos', 'imagen-texto', 'texto', 'pie']

export const PLANES: Record<Plan, LimitesPlan> = {
  GRATIS: {
    nombre: 'Gratis',
    productos: 10,
    fotosPorProducto: 4,
    secciones: 6,
    bloques: ['hero', 'grilla-productos', 'texto', 'pie'],
    temaLibre: false,
    quitarMarca: false,
  },
  EMPRENDE: {
    nombre: 'Emprende',
    productos: 100,
    fotosPorProducto: 8,
    secciones: 12,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
  },
  NEGOCIO: {
    nombre: 'Negocio',
    productos: null,
    fotosPorProducto: 10,
    secciones: 30,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
  },
  PRO: {
    nombre: 'Pro',
    productos: null,
    fotosPorProducto: 10,
    secciones: 30,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
  },
}

export const ORDEN_PLANES: readonly Plan[] = ['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO']

export function limitesDe(plan: string | undefined): LimitesPlan {
  return PLANES[(plan ?? 'GRATIS') as Plan] ?? PLANES.GRATIS
}

/** El plan más barato que desbloquea algo, para el aviso "Desde el plan X". */
export function planMinimo(cumple: (limites: LimitesPlan) => boolean): string {
  const plan = ORDEN_PLANES.find((clave) => cumple(PLANES[clave]))
  return plan ? PLANES[plan].nombre : 'Pro'
}

/** Si `actual` incluye lo de `requerido` (los planes van de menor a mayor). */
export function planIncluye(actual: string | undefined, requerido: Plan): boolean {
  return ORDEN_PLANES.indexOf((actual ?? 'GRATIS') as Plan) >= ORDEN_PLANES.indexOf(requerido)
}
