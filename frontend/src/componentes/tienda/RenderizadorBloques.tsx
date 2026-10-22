import type { ReactNode } from 'react'
import type { Bloque } from '@/tipos/bloques'
import type { AjustesTienda, Producto } from '@/tipos/tienda'
import { Anuncio } from './bloques/Anuncio'
import { Hero } from './bloques/Hero'
import { Carrusel } from './bloques/Carrusel'
import { Categorias } from './bloques/Categorias'
import { GrillaProductos } from './bloques/GrillaProductos'
import { ImagenTexto } from './bloques/ImagenTexto'
import { Texto } from './bloques/Texto'
import { Pie } from './bloques/Pie'
import { categoriasDe } from './ListadoProductos'

interface Props {
  bloques: Bloque[]
  productos: Producto[]
  moneda: string
  /** Cabecera de la tienda: va después de las barras de anuncio iniciales. */
  cabecera?: ReactNode
  /** Si el plan permite quitar "Hecho con Mi Tienda" del pie. */
  quitarMarca?: boolean
  /** Contacto y redes: el pie los usa para armar sus columnas. */
  ajustes?: AjustesTienda
}

interface Contexto {
  productos: Producto[]
  moneda: string
  quitarMarca: boolean
  ajustes: AjustesTienda
  categorias: string[]
}

function pintar(bloque: Bloque, { productos, moneda, quitarMarca, ajustes, categorias }: Contexto) {
  switch (bloque.tipo) {
    case 'anuncio':
      return <Anuncio {...bloque.props} />
    case 'hero':
      return <Hero {...bloque.props} />
    case 'carrusel':
      return <Carrusel {...bloque.props} />
    case 'categorias':
      return <Categorias {...bloque.props} />
    case 'grilla-productos':
      return <GrillaProductos {...bloque.props} productos={productos} moneda={moneda} />
    case 'imagen-texto':
      return <ImagenTexto {...bloque.props} />
    case 'texto':
      return <Texto {...bloque.props} />
    case 'pie':
      return <Pie {...bloque.props} quitarMarcaPermitido={quitarMarca} ajustes={ajustes} categorias={categorias} />
    default:
      return null
  }
}

/**
 * Traduce el JSON del constructor a componentes React.
 *
 * Es el único punto que conoce la correspondencia tipo → componente: el panel
 * guarda datos y esto los pinta, tanto en la tienda pública como en la vista
 * previa del editor. Un bloque de tipo desconocido (por ejemplo, guardado por
 * una versión más nueva del panel) se ignora en vez de romper la tienda entera.
 *
 * Cada bloque va envuelto con `data-bloque`: el editor lo usa para resaltar y
 * desplazarse hasta la sección que se está editando.
 */
export function RenderizadorBloques({
  bloques,
  productos,
  moneda,
  cabecera,
  quitarMarca = false,
  ajustes = {},
}: Props) {
  const categorias = categoriasDe(productos)
  const contexto: Contexto = { productos, moneda, quitarMarca, ajustes, categorias }
  const visibles = bloques.filter((bloque) => bloque.visible !== false)
  const anunciosIniciales = visibles.findIndex((bloque) => bloque.tipo !== 'anuncio')
  const corte = anunciosIniciales === -1 ? visibles.length : anunciosIniciales

  return (
    <>
      {visibles.map((bloque, indice) => (
        <div key={bloque.id} data-bloque={bloque.id}>
          {indice === corte && cabecera}
          {pintar(bloque, contexto)}
        </div>
      ))}
      {corte === visibles.length && cabecera}
    </>
  )
}
