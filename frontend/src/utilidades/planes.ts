import type { Bloque, TipoBloque } from '@/tipos/bloques'
import type { AjustesTienda } from '@/tipos/tienda'

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
  /** Cabecera con barra de color, botón destacado y WhatsApp a la vista. */
  cabeceraCompleta: boolean
  buscador: boolean
  enlacesMenu: number
  whatsappFlotante: boolean
  /** Pie oscuro en columnas con dirección, correo y horario. */
  pieColumnas: boolean
  bannersCarrusel: number
  itemsCategorias: number
  /** Grilla con tarjetas, 5 columnas y filtro por categoría. */
  grillaAvanzada: boolean
}

const TODOS_LOS_BLOQUES: readonly TipoBloque[] = [
  'anuncio',
  'hero',
  'carrusel',
  'categorias',
  'grilla-productos',
  'imagen-texto',
  'texto',
  'pie',
]

export const PLANES: Record<Plan, LimitesPlan> = {
  GRATIS: {
    nombre: 'Gratis',
    productos: 10,
    fotosPorProducto: 4,
    secciones: 6,
    bloques: ['hero', 'grilla-productos', 'texto', 'pie'],
    temaLibre: false,
    quitarMarca: false,
    cabeceraCompleta: false,
    buscador: false,
    enlacesMenu: 3,
    whatsappFlotante: false,
    pieColumnas: false,
    bannersCarrusel: 0,
    itemsCategorias: 0,
    grillaAvanzada: false,
  },
  EMPRENDE: {
    nombre: 'Emprende',
    productos: 100,
    fotosPorProducto: 8,
    secciones: 12,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
    cabeceraCompleta: true,
    buscador: true,
    enlacesMenu: 5,
    whatsappFlotante: true,
    pieColumnas: true,
    bannersCarrusel: 3,
    itemsCategorias: 6,
    grillaAvanzada: true,
  },
  NEGOCIO: {
    nombre: 'Negocio',
    productos: null,
    fotosPorProducto: 10,
    secciones: 30,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
    cabeceraCompleta: true,
    buscador: true,
    enlacesMenu: 8,
    whatsappFlotante: true,
    pieColumnas: true,
    bannersCarrusel: 8,
    itemsCategorias: 12,
    grillaAvanzada: true,
  },
  PRO: {
    nombre: 'Pro',
    productos: null,
    fotosPorProducto: 10,
    secciones: 30,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
    cabeceraCompleta: true,
    buscador: true,
    enlacesMenu: 8,
    whatsappFlotante: true,
    pieColumnas: true,
    bannersCarrusel: 8,
    itemsCategorias: 12,
    grillaAvanzada: true,
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

/**
 * Lo guardado, recortado a lo que el plan permite. Se aplica al pintar (tienda
 * pública y vista previa), así una tienda que baja de plan no pierde nada de lo
 * que configuró: sólo deja de mostrarse hasta que vuelva a subir.
 */
export function ajustarAlPlan(
  plan: string | undefined,
  ajustes: AjustesTienda,
  bloques: Bloque[],
): { ajustes: AjustesTienda; bloques: Bloque[] } {
  const limites = limitesDe(plan)
  const completa = limites.cabeceraCompleta && ajustes.cabecera === 'completa'

  const ajustados: AjustesTienda = {
    ...ajustes,
    cabecera: completa ? 'completa' : 'simple',
    buscador: limites.buscador ? ajustes.buscador : false,
    menu: ajustes.menu?.slice(0, limites.enlacesMenu),
    botonDestacado: completa ? ajustes.botonDestacado : undefined,
    whatsappFlotante: limites.whatsappFlotante ? ajustes.whatsappFlotante : false,
    ...(limites.pieColumnas ? {} : { direccion: undefined, correo: undefined, horario: undefined }),
  }

  const permitidos = bloques
    .filter((bloque) => limites.bloques.includes(bloque.tipo))
    .map((bloque): Bloque => {
      switch (bloque.tipo) {
        case 'carrusel':
          return {
            ...bloque,
            props: {
              ...bloque.props,
              diapositivas: bloque.props.diapositivas.slice(0, limites.bannersCarrusel),
            },
          }
        case 'categorias':
          return {
            ...bloque,
            props: {
              ...bloque.props,
              items: bloque.props.items.slice(0, limites.itemsCategorias),
            },
          }
        case 'grilla-productos':
          return limites.grillaAvanzada
            ? bloque
            : {
                ...bloque,
                props: {
                  ...bloque.props,
                  estilo: 'simple',
                  categoria: undefined,
                  columnas: bloque.props.columnas === 5 ? 4 : bloque.props.columnas,
                },
              }
        default:
          return bloque
      }
    })

  return { ajustes: ajustados, bloques: permitidos }
}
