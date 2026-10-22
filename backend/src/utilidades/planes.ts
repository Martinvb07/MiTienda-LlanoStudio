import { ErrorHttp } from './errores.js'

/**
 * Qué puede personalizar cada plan. El panel muestra los candados con una
 * copia de esta tabla (frontend/src/utilidades/planes.ts), pero quien manda es
 * esta: la API rechaza lo que el plan no incluye. Si cambias una, cambia la otra.
 */

export type Plan = 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'

export interface LimitesPlan {
  nombre: string
  /** null = sin límite. */
  productos: number | null
  fotosPorProducto: number
  secciones: number
  bloques: readonly string[]
  /** Colores, letra y esquinas a mano; si no, sólo los estilos predefinidos. */
  temaLibre: boolean
  quitarMarca: boolean
}

const TODOS_LOS_BLOQUES = ['anuncio', 'hero', 'carrusel', 'categorias', 'grilla-productos', 'imagen-texto', 'texto', 'pie'] as const

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

/** Nombres de las secciones, para los mensajes de error. */
export const ETIQUETAS_BLOQUE_PLAN: Record<string, string> = {
  anuncio: 'Barra de anuncio',
  hero: 'Portada',
  'grilla-productos': 'Productos',
  'imagen-texto': 'Imagen con texto',
  carrusel: 'Carrusel de banners',
  categorias: 'Categorías',
  texto: 'Texto',
  pie: 'Pie de página',
}

export function limitesDe(plan: string): LimitesPlan {
  return PLANES[plan as Plan] ?? PLANES.GRATIS
}

/**
 * Temas de los estilos predefinidos (copia de frontend/src/utilidades/tema.ts).
 * En los planes sin tema libre, el tema guardado es siempre uno de estos.
 */
export const TEMAS_PREDEFINIDOS: Record<string, Record<string, string>> = {
  clasica: { colorMarca: '#0f172a', colorContraste: '#ffffff', colorFondo: '#ffffff', colorTexto: '#0f172a', fuenteTitulos: 'moderna', radio: '0.5rem' },
  calida: { colorMarca: '#b45309', colorContraste: '#ffffff', colorFondo: '#faf6ef', colorTexto: '#292524', fuenteTitulos: 'clasica', radio: '0.5rem' },
  nocturna: { colorMarca: '#ffffff', colorContraste: '#000000', colorFondo: '#0b0b0c', colorTexto: '#f5f5f5', fuenteTitulos: 'moderna', radio: '0rem' },
  fresca: { colorMarca: '#0f766e', colorContraste: '#ffffff', colorFondo: '#f3faf8', colorTexto: '#123332', fuenteTitulos: 'redondeada', radio: '1.25rem' },
  llanera: { colorMarca: '#3b60ff', colorContraste: '#ffffff', colorFondo: '#f7f5f0', colorTexto: '#0a0f1c', fuenteTitulos: 'moderna', radio: '0.75rem' },
}

/** Error 403 con el código que el panel reconoce para ofrecer subir de plan. */
export function fueraDelPlan(mensaje: string) {
  return new ErrorHttp(403, mensaje, 'FUERA_DEL_PLAN')
}
