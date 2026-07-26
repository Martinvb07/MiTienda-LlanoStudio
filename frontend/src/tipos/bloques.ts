/**
 * Contrato del constructor drag-and-drop.
 *
 * El diseño de cada tienda se guarda como este array de bloques en
 * Tienda.configuracionBloques (JSON), nunca como HTML generado. El panel los
 * reordena con dnd-kit y la tienda pública los renderiza como componentes
 * React. Cambiar la plantilla no pierde el contenido.
 */

export type TipoBloque = 'hero' | 'grilla-productos' | 'texto' | 'pie'

export interface PropsHero {
  titulo: string
  subtitulo?: string
  textoBoton?: string
  enlaceBoton?: string
  imagenUrl?: string
}

export interface PropsGrillaProductos {
  titulo?: string
  /** Cuántos productos mostrar. */
  limite?: number
  columnas?: 2 | 3 | 4
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
}

interface BloqueBase<T extends TipoBloque, P> {
  /** Identificador estable: es la clave que usa dnd-kit al reordenar. */
  id: string
  tipo: T
  props: P
  visible?: boolean
}

export type BloqueHero = BloqueBase<'hero', PropsHero>
export type BloqueGrillaProductos = BloqueBase<'grilla-productos', PropsGrillaProductos>
export type BloqueTexto = BloqueBase<'texto', PropsTexto>
export type BloquePie = BloqueBase<'pie', PropsPie>

export type Bloque = BloqueHero | BloqueGrillaProductos | BloqueTexto | BloquePie

/** Etiquetas para la barra de bloques del panel. */
export const ETIQUETAS_BLOQUE: Record<TipoBloque, string> = {
  hero: 'Portada',
  'grilla-productos': 'Grilla de productos',
  texto: 'Texto',
  pie: 'Pie de página',
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
