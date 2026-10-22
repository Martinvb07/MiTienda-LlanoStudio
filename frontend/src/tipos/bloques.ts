/**
 * Contrato del constructor drag-and-drop.
 *
 * El diseño de cada tienda se guarda como este array de bloques en
 * Tienda.configuracionBloques (JSON), nunca como HTML generado. El editor del
 * panel los ordena y edita, y la tienda pública los renderiza como componentes
 * React. Cambiar la plantilla no pierde el contenido.
 */

export type TipoBloque = 'anuncio' | 'hero' | 'grilla-productos' | 'imagen-texto' | 'texto' | 'pie'

export interface PropsAnuncio {
  texto: string
  enlace?: string
}

export interface PropsHero {
  titulo: string
  subtitulo?: string
  textoBoton?: string
  enlaceBoton?: string
  imagenUrl?: string
  alineacion?: 'izquierda' | 'centro'
}

export interface PropsGrillaProductos {
  titulo?: string
  /** Cuántos productos mostrar. */
  limite?: number
  columnas?: 2 | 3 | 4
}

export interface PropsImagenTexto {
  titulo: string
  contenido?: string
  imagenUrl?: string
  textoBoton?: string
  enlaceBoton?: string
  /** De qué lado va la imagen en pantallas anchas. */
  lado?: 'izquierda' | 'derecha'
}

export interface PropsTexto {
  titulo?: string
  contenido: string
  alineacion?: 'izquierda' | 'centro'
}

export interface PropsPie {
  texto?: string
  mostrarRedes?: boolean
  instagram?: string
  whatsapp?: string
  /** Quita "Hecho con Mi Tienda"; sólo surte efecto en planes pagos. */
  ocultarMarca?: boolean
}

interface BloqueBase<T extends TipoBloque, P> {
  /** Identificador estable: es la clave que usa dnd-kit al reordenar. */
  id: string
  tipo: T
  props: P
  visible?: boolean
}

export type BloqueAnuncio = BloqueBase<'anuncio', PropsAnuncio>
export type BloqueHero = BloqueBase<'hero', PropsHero>
export type BloqueGrillaProductos = BloqueBase<'grilla-productos', PropsGrillaProductos>
export type BloqueImagenTexto = BloqueBase<'imagen-texto', PropsImagenTexto>
export type BloqueTexto = BloqueBase<'texto', PropsTexto>
export type BloquePie = BloqueBase<'pie', PropsPie>

export type Bloque =
  | BloqueAnuncio
  | BloqueHero
  | BloqueGrillaProductos
  | BloqueImagenTexto
  | BloqueTexto
  | BloquePie

/** Nombres y descripciones para el editor del panel. */
export const ETIQUETAS_BLOQUE: Record<TipoBloque, string> = {
  anuncio: 'Barra de anuncio',
  hero: 'Portada',
  'grilla-productos': 'Productos',
  'imagen-texto': 'Imagen con texto',
  texto: 'Texto',
  pie: 'Pie de página',
}

export const DESCRIPCIONES_BLOQUE: Record<TipoBloque, string> = {
  anuncio: 'Una franja arriba para envíos, promociones o avisos.',
  hero: 'Titular grande con botón, sobre color o una foto.',
  'grilla-productos': 'Tu catálogo en columnas.',
  'imagen-texto': 'Una foto al lado de un texto: tu historia, un producto estrella.',
  texto: 'Un párrafo para contar algo.',
  pie: 'Cierre de la página con tus redes.',
}

/** Props con las que nace cada tipo de bloque al añadirlo desde el editor. */
export const PROPS_INICIALES: { [T in TipoBloque]: Extract<Bloque, { tipo: T }>['props'] } = {
  anuncio: { texto: 'Envíos a toda Colombia' },
  hero: {
    titulo: 'Título de la portada',
    subtitulo: 'Un subtítulo corto',
    textoBoton: 'Ver productos',
    enlaceBoton: '#productos',
    alineacion: 'centro',
  },
  'grilla-productos': { titulo: 'Productos', limite: 8, columnas: 3 },
  'imagen-texto': {
    titulo: 'Nuestra historia',
    contenido: 'Cuenta quién está detrás de la tienda y por qué hace lo que hace.',
    lado: 'izquierda',
  },
  texto: { contenido: 'Escribe aquí el texto de la sección.' },
  pie: { texto: '© Mi tienda', mostrarRedes: true },
}

export function crearBloque(tipo: TipoBloque): Bloque {
  return {
    id: `${tipo}-${crypto.randomUUID().slice(0, 8)}`,
    tipo,
    props: structuredClone(PROPS_INICIALES[tipo]),
  } as Bloque
}

/** Bloques que trae una tienda recién creada. */
export function bloquesPorDefecto(nombreTienda: string): Bloque[] {
  return [
    {
      id: 'hero-inicial',
      tipo: 'hero',
      props: {
        titulo: nombreTienda,
        subtitulo: 'Bienvenido a nuestra tienda',
        textoBoton: 'Ver productos',
        enlaceBoton: '#productos',
      },
    },
    {
      id: 'productos-inicial',
      tipo: 'grilla-productos',
      props: { titulo: 'Nuestros productos', limite: 8, columnas: 3 },
    },
    {
      id: 'pie-inicial',
      tipo: 'pie',
      props: { texto: `© ${new Date().getFullYear()} ${nombreTienda}`, mostrarRedes: true },
    },
  ]
}

/**
 * Valida lo que llega de la base de datos. `configuracionBloques` es JSON
 * libre, así que se filtra antes de renderizar en vez de confiar en el tipo.
 */
export function normalizarBloques(valor: unknown): Bloque[] {
  if (!Array.isArray(valor)) return []

  return valor.filter((elemento): elemento is Bloque => {
    if (typeof elemento !== 'object' || elemento === null) return false
    const posible = elemento as Partial<Bloque>
    return (
      typeof posible.id === 'string' &&
      typeof posible.tipo === 'string' &&
      posible.tipo in ETIQUETAS_BLOQUE &&
      typeof posible.props === 'object' &&
      posible.props !== null
    )
  })
}
