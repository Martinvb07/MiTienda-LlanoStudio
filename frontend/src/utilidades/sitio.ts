import { GRUPOS_BLOQUE, type Bloque, type TipoBloque } from '@/tipos/bloques'
import type { TipoSitio } from '@/tipos/tienda'

/**
 * Lo que cambia según el tipo de sitio. Una tienda y una página guardan lo
 * mismo; la página sólo esconde lo de vender (carrito, catálogo, pedidos) y el
 * panel le habla de "tu página".
 */

/** Lo que llega de la API, o nada en respuestas viejas: sin tipo es una tienda. */
export function tipoSitio(valor: unknown): TipoSitio {
  return valor === 'pagina' || valor === 'enlaces' ? valor : 'tienda'
}

export const vendeEnLinea = (tipo: TipoSitio | undefined) => tipoSitio(tipo) === 'tienda'

/** Secciones que sólo tienen sentido con catálogo. */
const SOLO_CATALOGO: ReadonlySet<TipoBloque> = new Set(['grilla-productos', 'categorias'])

/** Grupos de la paleta de secciones que ofrece el editor para este tipo. */
export function gruposBloquePara(tipo: TipoSitio | undefined) {
  if (vendeEnLinea(tipo)) return GRUPOS_BLOQUE
  return GRUPOS_BLOQUE.map((grupo) => ({ ...grupo, tipos: grupo.tipos.filter((otro) => !SOLO_CATALOGO.has(otro)) }))
    .filter((grupo) => grupo.tipos.length > 0)
    .sort((a, b) => Number(b.titulo === 'Tu negocio') - Number(a.titulo === 'Tu negocio'))
}

/** Lo que se pinta: una página no muestra catálogo aunque lo tenga guardado. */
export function bloquesVisiblesPara<T extends Bloque>(tipo: TipoSitio | undefined, bloques: T[]): T[] {
  return vendeEnLinea(tipo) ? bloques : bloques.filter((bloque) => !SOLO_CATALOGO.has(bloque.tipo))
}

/** Rutas del panel que son de vender: una página no las muestra. */
export const RUTAS_SOLO_TIENDA: ReadonlySet<string> = new Set(['/panel/productos', '/panel/pedidos', '/panel/descuentos'])

interface Textos {
  /** "tienda" o "página", en minúscula. */
  nombre: string
  /** "Tu tienda", "Tu página". */
  tu: string
  ver: string
  editar: string
  publicada: string
  borrador: string
  /** Etiqueta del campo del nombre. */
  campoNombre: string
}

const TEXTOS: Record<'tienda' | 'pagina', Textos> = {
  tienda: {
    nombre: 'tienda',
    tu: 'Tu tienda',
    ver: 'Ver tienda',
    editar: 'Editar tienda',
    publicada: 'Tienda publicada',
    borrador: 'Tienda en borrador',
    campoNombre: 'Nombre de la tienda',
  },
  pagina: {
    nombre: 'página',
    tu: 'Tu página',
    ver: 'Ver página',
    editar: 'Editar página',
    publicada: 'Página publicada',
    borrador: 'Página en borrador',
    campoNombre: 'Nombre del negocio',
  },
}

export function textosSitio(tipo: TipoSitio | undefined): Textos {
  return TEXTOS[tipoSitio(tipo) === 'pagina' ? 'pagina' : 'tienda']
}
