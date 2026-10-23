import type { ReactNode } from 'react'
import { origenLienzo, type Bloque } from '@/tipos/bloques'
import type { AjustesTienda, Producto, TemaTienda } from '@/tipos/tienda'
import { Anuncio } from './bloques/Anuncio'
import { Hero } from './bloques/Hero'
import { Carrusel } from './bloques/Carrusel'
import { Categorias } from './bloques/Categorias'
import { GrillaProductos } from './bloques/GrillaProductos'
import { ImagenTexto } from './bloques/ImagenTexto'
import { Texto } from './bloques/Texto'
import { Pie } from './bloques/Pie'
import { Columnas } from './bloques/Columnas'
import { Galeria } from './bloques/Galeria'
import { Video } from './bloques/Video'
import { Testimonios } from './bloques/Testimonios'
import { Preguntas } from './bloques/Preguntas'
import { CuentaRegresiva } from './bloques/CuentaRegresiva'
import { Logos } from './bloques/Logos'
import { BannerDoble } from './bloques/BannerDoble'
import { Llamado } from './bloques/Llamado'
import { Mapa } from './bloques/Mapa'
import { Lienzo } from './bloques/Lienzo'
import { Espaciador } from './bloques/Espaciador'
import { EnvolturaSeccion } from './EnvolturaSeccion'
import { esquemasIniciales } from '@/utilidades/tema'
import { categoriasDe } from './ListadoProductos'

interface Props {
  bloques: Bloque[]
  productos: Producto[]
  moneda: string
  /** Cabecera de la tienda: va después de las barras de anuncio iniciales. */
  cabecera?: ReactNode
  /** Si el plan permite quitar "Hecho con Mi Sitio" del pie. */
  quitarMarca?: boolean
  /** Contacto y redes: el pie los usa para armar sus columnas. */
  ajustes?: AjustesTienda
  nombreTienda?: string
  tema?: TemaTienda
  logoUrl?: string | null
  /** En la vista previa del editor: las piezas vivas vacías dicen qué les falta. */
  editando?: boolean
}

interface Contexto {
  productos: Producto[]
  moneda: string
  quitarMarca: boolean
  ajustes: AjustesTienda
  categorias: string[]
  nombreTienda?: string
  logoUrl?: string | null
  editando?: boolean
}

function pintar(bloque: Bloque, { productos, moneda, quitarMarca, ajustes, categorias, nombreTienda, logoUrl, editando }: Contexto) {
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
    case 'columnas':
      return <Columnas {...bloque.props} />
    case 'galeria':
      return <Galeria {...bloque.props} />
    case 'video':
      return <Video {...bloque.props} />
    case 'testimonios':
      return <Testimonios {...bloque.props} />
    case 'preguntas':
      return <Preguntas {...bloque.props} />
    case 'cuenta-regresiva':
      return <CuentaRegresiva {...bloque.props} />
    case 'logos':
      return <Logos {...bloque.props} />
    case 'banner-doble':
      return <BannerDoble {...bloque.props} />
    case 'llamado':
      return <Llamado {...bloque.props} whatsapp={ajustes.whatsapp} tienda={nombreTienda} />
    case 'mapa':
      return <Mapa {...bloque.props} direccion={bloque.props.direccion || ajustes.direccion || ''} />
    case 'espaciador':
      return <Espaciador {...bloque.props} />
    case 'lienzo':
      return <Lienzo {...bloque.props} contexto={{ productos, moneda, ajustes, nombreTienda, logoUrl, editando }} />
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
  nombreTienda,
  tema,
  logoUrl,
  editando,
}: Props) {
  const categorias = categoriasDe(productos)
  const esquemas = tema ? (tema.esquemas ?? esquemasIniciales(tema)) : undefined
  const contexto: Contexto = { productos, moneda, quitarMarca, ajustes, categorias, nombreTienda, logoUrl, editando }
  const visibles = bloques.filter((bloque) => bloque.visible !== false)
  // Las barras de anuncio van arriba del encabezado, también si se pasaron a libre.
  const anunciosIniciales = visibles.findIndex((bloque) => bloque.tipo !== 'anuncio' && origenLienzo(bloque) !== 'anuncio')
  const corte = anunciosIniciales === -1 ? visibles.length : anunciosIniciales

  return (
    <>
      {visibles.map((bloque, indice) => (
        <div key={bloque.id}>
          {indice === corte && cabecera}
          <EnvolturaSeccion
            id={bloque.id}
            estilo={bloque.estilo}
            esquemas={esquemas}
            animarPorDefecto={tema?.animarSecciones}
          >
            {pintar(bloque, contexto)}
          </EnvolturaSeccion>
        </div>
      ))}
      {corte === visibles.length && cabecera}
    </>
  )
}
