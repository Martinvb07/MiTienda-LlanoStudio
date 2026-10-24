import type { ReactNode } from 'react'
import { origenLienzo, type Bloque } from '@/tipos/bloques'
import type { AjustesTienda, Producto, TemaTienda, TipoSitio } from '@/tipos/tienda'
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
import { Servicios } from './bloques/Servicios'
import { Equipo } from './bloques/Equipo'
import { Horario } from './bloques/Horario'
import { Perfil } from './bloques/Perfil'
import { Enlaces } from './bloques/Enlaces'
import { EnvolturaSeccion } from './EnvolturaSeccion'
import { esquemasIniciales } from '@/utilidades/tema'
import { categoriasDe } from './ListadoProductos'
import { bloquesVisiblesPara, esBio } from '@/utilidades/sitio'
import { configuracionDominios } from '@/utilidades/dominios'

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
  /** Una página informativa no pinta las secciones de catálogo. */
  tipo?: TipoSitio
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
    case 'servicios':
      return <Servicios {...bloque.props} whatsapp={ajustes.whatsapp} negocio={nombreTienda} />
    case 'equipo':
      return <Equipo {...bloque.props} />
    case 'horario':
      return (
        <Horario
          {...bloque.props}
          direccion={bloque.props.direccion || ajustes.direccion}
          whatsapp={ajustes.whatsapp}
          correo={ajustes.correo}
          negocio={nombreTienda}
        />
      )
    case 'espaciador':
      return <Espaciador {...bloque.props} />
    case 'perfil':
      return <Perfil {...bloque.props} nombreSitio={nombreTienda} logoUrl={logoUrl} ajustes={ajustes} />
    case 'enlaces':
      return <Enlaces {...bloque.props} ajustes={ajustes} />
    case 'lienzo':
      return <Lienzo {...bloque.props} contexto={{ productos, moneda, ajustes, nombreTienda, logoUrl, editando }} />
    default:
      return null
  }
}

/** Ancla con la que la primera sección de cada tipo se deja enlazar desde el menú o un botón. */
const ANCLAS: Partial<Record<Bloque['tipo'], string>> = { servicios: 'servicios', equipo: 'equipo', horario: 'contacto' }

function conAnclas(bloques: Bloque[]): Bloque[] {
  const usadas = new Set(bloques.map((bloque) => bloque.estilo?.ancla).filter(Boolean))
  return bloques.map((bloque) => {
    const ancla = ANCLAS[bloque.tipo]
    if (!ancla || bloque.estilo?.ancla || usadas.has(ancla)) return bloque
    usadas.add(ancla)
    return { ...bloque, estilo: { ...bloque.estilo, ancla } } as Bloque
  })
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
  tipo,
}: Props) {
  const categorias = categoriasDe(productos)
  const esquemas = tema ? (tema.esquemas ?? esquemasIniciales(tema)) : undefined
  const contexto: Contexto = { productos, moneda, quitarMarca, ajustes, categorias, nombreTienda, logoUrl, editando }
  const visibles = conAnclas(bloquesVisiblesPara(tipo, bloques).filter((bloque) => bloque.visible !== false))
  // Las barras de anuncio van arriba del encabezado, también si se pasaron a libre.
  const anunciosIniciales = visibles.findIndex((bloque) => bloque.tipo !== 'anuncio' && origenLienzo(bloque) !== 'anuncio')
  const corte = anunciosIniciales === -1 ? visibles.length : anunciosIniciales

  // Los enlaces para tu bio: una columna angosta al centro, sin cabecera, con
  // el fondo elegido y la marca al pie.
  if (esBio(tipo)) {
    return (
      <div data-fondo-bio={ajustes.fondoBio ?? 'liso'} className="min-h-screen">
        <div className="bio-columna mx-auto max-w-[580px] pb-6">
          {visibles.map((bloque) => (
            <EnvolturaSeccion key={bloque.id} id={bloque.id} estilo={bloque.estilo} esquemas={esquemas} animarPorDefecto={tema?.animarSecciones}>
              {pintar(bloque, contexto)}
            </EnvolturaSeccion>
          ))}
        </div>
        {!(quitarMarca && ajustes.ocultarMarca) && (
          <p className="pb-8 text-center text-xs text-tinta/45">
            <a href={`https://${configuracionDominios.subdominioPanel}.${configuracionDominios.dominioBase}/enlaces`} target="_blank" rel="noopener noreferrer" className="transition hover:text-tinta/70">
              Hecho con Mi Sitio de Llano Studio
            </a>
          </p>
        )}
      </div>
    )
  }

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
