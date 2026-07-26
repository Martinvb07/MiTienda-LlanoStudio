import type { Bloque } from '@/tipos/bloques'
import type { Producto } from '@/tipos/tienda'
import { Hero } from './bloques/Hero'
import { GrillaProductos } from './bloques/GrillaProductos'
import { Texto } from './bloques/Texto'
import { Pie } from './bloques/Pie'

interface Props {
  bloques: Bloque[]
  productos: Producto[]
  moneda: string
}

/**
 * Traduce el JSON del constructor a componentes React.
 *
 * Es el único punto que conoce la correspondencia tipo → componente: el panel
 * guarda datos y esto los pinta. Un bloque de tipo desconocido (por ejemplo,
 * guardado por una versión más nueva del panel) se ignora en vez de romper la
 * tienda entera.
 */
export function RenderizadorBloques({ bloques, productos, moneda }: Props) {
  return (
    <>
      {bloques
        .filter((bloque) => bloque.visible !== false)
        .map((bloque) => {
          switch (bloque.tipo) {
            case 'hero':
              return <Hero key={bloque.id} {...bloque.props} />

            case 'grilla-productos':
              return (
                <GrillaProductos
                  key={bloque.id}
                  {...bloque.props}
                  productos={productos}
                  moneda={moneda}
                />
              )

            case 'texto':
              return <Texto key={bloque.id} {...bloque.props} />

            case 'pie':
              return <Pie key={bloque.id} {...bloque.props} />

            default:
              return null
          }
        })}
    </>
  )
}
