/**
 * Contrato del constructor drag-and-drop.
 *
 * El diseño de cada tienda se guarda como este array de bloques en
 * Tienda.configuracionBloques (JSON), nunca como HTML generado. El editor del
 * panel los ordena y edita, y la tienda pública los renderiza como componentes
 * React. Cambiar la plantilla no pierde el contenido.
 */

export type TipoBloque =
  | 'anuncio'
  | 'hero'
  | 'carrusel'
  | 'categorias'
  | 'grilla-productos'
  | 'imagen-texto'
  | 'texto'
  | 'pie'
  | 'columnas'
  | 'galeria'
  | 'video'
  | 'testimonios'
  | 'preguntas'
  | 'cuenta-regresiva'
  | 'logos'
  | 'banner-doble'
  | 'llamado'
  | 'mapa'
  | 'espaciador'

/**
 * Apariencia de una sección, igual para todos los tipos. La tienda la aplica
 * envolviendo el bloque; cada plan desbloquea una parte (utilidades/planes.ts).
 */
export interface EstiloSeccion {
  /** Id de un esquema de color del tema: pone fondo, texto, marca y botones. */
  esquema?: string
  /** Color de fondo de la sección. */
  fondo?: string
  /** Color del texto: reemplaza el del tema sólo dentro de la sección. */
  texto?: string
  imagenFondo?: string
  /** 0 a 80: cuánto se oscurece la imagen de fondo para que el texto se lea. */
  oscurecer?: number
  espaciado?: 'ninguno' | 'compacto' | 'normal' | 'amplio'
  ancho?: 'estrecho' | 'normal' | 'amplio'
  animacion?: 'ninguna' | 'aparecer' | 'deslizar' | 'zoom' | 'desenfoque'
  dispositivos?: 'todos' | 'movil' | 'escritorio'
  /** 'tarjeta': la sección flota con márgenes y esquinas redondeadas. */
  forma?: 'normal' | 'tarjeta'
  /** Nombre para enlazar a la sección desde el menú: #nombre. */
  ancla?: string
}

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

export interface DiapositivaCarrusel {
  id: string
  imagenUrl?: string
  titulo?: string
  subtitulo?: string
  textoBoton?: string
  enlaceBoton?: string
}

export interface PropsCarrusel {
  diapositivas: DiapositivaCarrusel[]
  /** Segundos entre diapositiva y diapositiva. 0 = no avanza sola. */
  intervalo?: number
  alto?: 'bajo' | 'medio' | 'alto'
}

export interface ItemCategoria {
  id: string
  /** Nombre visible; también es la categoría de producto a la que lleva. */
  nombre: string
  imagenUrl?: string
}

export interface PropsCategorias {
  titulo?: string
  items: ItemCategoria[]
}

export interface PropsGrillaProductos {
  titulo?: string
  /** Cuántos productos mostrar. */
  limite?: number
  columnas?: 2 | 3 | 4 | 5
  /** Sólo los productos de esta categoría. */
  categoria?: string
  /** 'tarjeta': con borde, precio destacado y presentación, como un supermercado. */
  estilo?: 'simple' | 'tarjeta'
  /** Sólo los productos marcados como destacados. */
  soloDestacados?: boolean
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

export interface ItemColumna {
  id: string
  /** Un emoji o símbolo corto encima del título. */
  icono?: string
  imagenUrl?: string
  titulo: string
  texto?: string
}

export interface PropsColumnas {
  titulo?: string
  subtitulo?: string
  columnas?: 2 | 3 | 4
  alineacion?: 'izquierda' | 'centro'
  items: ItemColumna[]
}

export interface ImagenGaleria {
  id: string
  url?: string
  enlace?: string
}

export interface PropsGaleria {
  titulo?: string
  disposicion?: 'cuadricula' | 'mosaico' | 'tira'
  columnas?: 2 | 3 | 4
  imagenes: ImagenGaleria[]
}

export interface PropsVideo {
  titulo?: string
  /** Enlace de YouTube o Vimeo. */
  url: string
  texto?: string
}

export interface Testimonio {
  id: string
  nombre: string
  texto: string
  estrellas?: number
  fotoUrl?: string
  detalle?: string
}

export interface PropsTestimonios {
  titulo?: string
  items: Testimonio[]
}

export interface Pregunta {
  id: string
  pregunta: string
  respuesta: string
}

export interface PropsPreguntas {
  titulo?: string
  items: Pregunta[]
}

export interface PropsCuentaRegresiva {
  titulo: string
  subtitulo?: string
  /** Fecha y hora de cierre, 'AAAA-MM-DDTHH:MM' en hora local de la tienda. */
  fecha: string
  textoBoton?: string
  enlaceBoton?: string
  /** Lo que se lee cuando el tiempo se acaba. */
  textoFinal?: string
}

export interface LogoMarca {
  id: string
  imagenUrl?: string
  nombre?: string
}

export interface PropsLogos {
  titulo?: string
  /** Pasan en una cinta continua en vez de quedarse quietos. */
  animado?: boolean
  items: LogoMarca[]
}

export interface BannerPromo {
  id: string
  imagenUrl?: string
  titulo?: string
  subtitulo?: string
  textoBoton?: string
  enlace?: string
}

export interface PropsBannerDoble {
  alto?: 'bajo' | 'medio' | 'alto'
  items: BannerPromo[]
}

export interface PropsLlamado {
  titulo: string
  texto?: string
  textoBoton?: string
  enlaceBoton?: string
  /** El botón abre WhatsApp con el número de la tienda. */
  aWhatsapp?: boolean
}

export interface PropsMapa {
  titulo?: string
  direccion: string
  alto?: 'bajo' | 'medio' | 'alto'
}

export interface PropsEspaciador {
  alto?: 'chico' | 'medio' | 'grande'
  linea?: boolean
}

interface BloqueBase<T extends TipoBloque, P> {
  /** Identificador estable: es la clave que usa dnd-kit al reordenar. */
  id: string
  tipo: T
  props: P
  visible?: boolean
  estilo?: EstiloSeccion
}

export type BloqueAnuncio = BloqueBase<'anuncio', PropsAnuncio>
export type BloqueHero = BloqueBase<'hero', PropsHero>
export type BloqueCarrusel = BloqueBase<'carrusel', PropsCarrusel>
export type BloqueCategorias = BloqueBase<'categorias', PropsCategorias>
export type BloqueGrillaProductos = BloqueBase<'grilla-productos', PropsGrillaProductos>
export type BloqueImagenTexto = BloqueBase<'imagen-texto', PropsImagenTexto>
export type BloqueTexto = BloqueBase<'texto', PropsTexto>
export type BloquePie = BloqueBase<'pie', PropsPie>
export type BloqueColumnas = BloqueBase<'columnas', PropsColumnas>
export type BloqueGaleria = BloqueBase<'galeria', PropsGaleria>
export type BloqueVideo = BloqueBase<'video', PropsVideo>
export type BloqueTestimonios = BloqueBase<'testimonios', PropsTestimonios>
export type BloquePreguntas = BloqueBase<'preguntas', PropsPreguntas>
export type BloqueCuentaRegresiva = BloqueBase<'cuenta-regresiva', PropsCuentaRegresiva>
export type BloqueLogos = BloqueBase<'logos', PropsLogos>
export type BloqueBannerDoble = BloqueBase<'banner-doble', PropsBannerDoble>
export type BloqueLlamado = BloqueBase<'llamado', PropsLlamado>
export type BloqueMapa = BloqueBase<'mapa', PropsMapa>
export type BloqueEspaciador = BloqueBase<'espaciador', PropsEspaciador>

export type Bloque =
  | BloqueAnuncio
  | BloqueHero
  | BloqueCarrusel
  | BloqueCategorias
  | BloqueGrillaProductos
  | BloqueImagenTexto
  | BloqueTexto
  | BloquePie
  | BloqueColumnas
  | BloqueGaleria
  | BloqueVideo
  | BloqueTestimonios
  | BloquePreguntas
  | BloqueCuentaRegresiva
  | BloqueLogos
  | BloqueBannerDoble
  | BloqueLlamado
  | BloqueMapa
  | BloqueEspaciador

/** Nombres y descripciones para el editor del panel. */
export const ETIQUETAS_BLOQUE: Record<TipoBloque, string> = {
  anuncio: 'Barra de anuncio',
  hero: 'Portada',
  carrusel: 'Carrusel de banners',
  categorias: 'Categorías',
  'grilla-productos': 'Productos',
  'imagen-texto': 'Imagen con texto',
  texto: 'Texto',
  pie: 'Pie de página',
  columnas: 'Columnas con íconos',
  galeria: 'Galería de fotos',
  video: 'Video',
  testimonios: 'Testimonios',
  preguntas: 'Preguntas frecuentes',
  'cuenta-regresiva': 'Cuenta regresiva',
  logos: 'Logos de marcas',
  'banner-doble': 'Banners de promoción',
  llamado: 'Llamado a la acción',
  mapa: 'Mapa',
  espaciador: 'Espacio o línea',
}

/** Grupos de la paleta de secciones del editor. */
export const GRUPOS_BLOQUE: { titulo: string; tipos: TipoBloque[] }[] = [
  { titulo: 'Portada', tipos: ['hero', 'carrusel', 'anuncio', 'banner-doble'] },
  { titulo: 'Catálogo', tipos: ['grilla-productos', 'categorias'] },
  { titulo: 'Contenido', tipos: ['texto', 'imagen-texto', 'columnas', 'galeria', 'video'] },
  { titulo: 'Confianza', tipos: ['testimonios', 'preguntas', 'logos', 'mapa'] },
  { titulo: 'Ventas', tipos: ['llamado', 'cuenta-regresiva'] },
  { titulo: 'Estructura', tipos: ['espaciador', 'pie'] },
]

export const DESCRIPCIONES_BLOQUE: Record<TipoBloque, string> = {
  anuncio: 'Una franja arriba para envíos, promociones o avisos.',
  hero: 'Titular grande con botón, sobre color o una foto.',
  carrusel: 'Banners grandes que pasan solos, para promociones y lanzamientos.',
  categorias: 'Cuadros con foto que llevan a cada categoría de tu catálogo.',
  'grilla-productos': 'Tu catálogo en columnas.',
  'imagen-texto': 'Una foto al lado de un texto: tu historia, un producto estrella.',
  texto: 'Un párrafo para contar algo.',
  pie: 'Cierre de la página con tus redes.',
  columnas: 'Beneficios o servicios en columnas, con ícono o foto.',
  galeria: 'Tus fotos en cuadrícula, mosaico o una tira que se desliza.',
  video: 'Un video de YouTube o Vimeo dentro de la página.',
  testimonios: 'Lo que dicen tus clientes, con estrellas y foto.',
  preguntas: 'Dudas comunes en un acordeón que se despliega.',
  'cuenta-regresiva': 'Reloj hasta el fin de una oferta o un lanzamiento.',
  logos: 'Marcas que vendes o que confían en ti, quietas o en cinta.',
  'banner-doble': 'Dos o tres banners lado a lado para promociones.',
  llamado: 'Franja de color con un mensaje y un botón, también a WhatsApp.',
  mapa: 'Tu local en Google Maps.',
  espaciador: 'Aire entre secciones, con o sin línea.',
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
  carrusel: {
    diapositivas: [
      { id: 'd1', titulo: 'Nueva colección', subtitulo: 'Lo último ya está en la tienda', textoBoton: 'Ver productos', enlaceBoton: '#productos' },
      { id: 'd2', titulo: 'Envíos a toda Colombia', subtitulo: 'Recibe en 2 a 5 días hábiles' },
    ],
    intervalo: 5,
    alto: 'medio',
  },
  categorias: {
    titulo: 'Categorías',
    items: [
      { id: 'c1', nombre: 'Novedades' },
      { id: 'c2', nombre: 'Más vendidos' },
      { id: 'c3', nombre: 'Ofertas' },
    ],
  },
  'grilla-productos': { titulo: 'Productos', limite: 8, columnas: 3 },
  'imagen-texto': {
    titulo: 'Nuestra historia',
    contenido: 'Cuenta quién está detrás de la tienda y por qué hace lo que hace.',
    lado: 'izquierda',
  },
  texto: { contenido: 'Escribe aquí el texto de la sección.' },
  pie: { texto: '© Mi tienda', mostrarRedes: true },
  columnas: {
    titulo: 'Por qué comprarnos',
    columnas: 3,
    alineacion: 'centro',
    items: [
      { id: 'k1', icono: '🚚', titulo: 'Envíos a todo el país', texto: 'Recibe en 2 a 5 días hábiles.' },
      { id: 'k2', icono: '🔒', titulo: 'Pago seguro', texto: 'Paga con tarjeta, PSE o contra entrega.' },
      { id: 'k3', icono: '💬', titulo: 'Te asesoramos', texto: 'Escríbenos por WhatsApp cuando quieras.' },
    ],
  },
  galeria: {
    titulo: 'Galería',
    disposicion: 'cuadricula',
    columnas: 3,
    imagenes: [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }],
  },
  video: { titulo: 'Conoce nuestra tienda', url: '' },
  testimonios: {
    titulo: 'Lo que dicen nuestros clientes',
    items: [
      { id: 't1', nombre: 'Laura G.', texto: 'Llegó rapidísimo y la calidad es increíble. Volveré a comprar.', estrellas: 5, detalle: 'Bogotá' },
      { id: 't2', nombre: 'Andrés M.', texto: 'Muy buena atención por WhatsApp, me ayudaron a elegir la talla.', estrellas: 5, detalle: 'Medellín' },
      { id: 't3', nombre: 'Camila R.', texto: 'Los productos son tal cual las fotos. Recomendados.', estrellas: 4, detalle: 'Cali' },
    ],
  },
  preguntas: {
    titulo: 'Preguntas frecuentes',
    items: [
      { id: 'q1', pregunta: '¿Cuánto tarda el envío?', respuesta: 'Entre 2 y 5 días hábiles según tu ciudad.' },
      { id: 'q2', pregunta: '¿Puedo cambiar un producto?', respuesta: 'Sí, tienes 30 días para cambios si el producto está sin usar.' },
      { id: 'q3', pregunta: '¿Qué medios de pago aceptan?', respuesta: 'Tarjeta, PSE, Nequi y pago contra entrega.' },
    ],
  },
  'cuenta-regresiva': {
    titulo: 'La oferta termina en',
    subtitulo: 'Hasta 30% de descuento en toda la tienda',
    fecha: '',
    textoBoton: 'Ver ofertas',
    enlaceBoton: '#productos',
    textoFinal: 'La oferta terminó. ¡Espera la próxima!',
  },
  logos: {
    titulo: 'Marcas que trabajamos',
    animado: true,
    items: [
      { id: 'l1', nombre: 'Marca uno' },
      { id: 'l2', nombre: 'Marca dos' },
      { id: 'l3', nombre: 'Marca tres' },
      { id: 'l4', nombre: 'Marca cuatro' },
    ],
  },
  'banner-doble': {
    alto: 'medio',
    items: [
      { id: 'b1', titulo: 'Nueva colección', subtitulo: 'Lo último ya llegó', textoBoton: 'Ver más', enlace: '#productos' },
      { id: 'b2', titulo: 'Ofertas', subtitulo: 'Hasta 30% menos', textoBoton: 'Aprovechar', enlace: '#productos' },
    ],
  },
  llamado: {
    titulo: '¿Tienes dudas? Escríbenos',
    texto: 'Te respondemos en minutos y te ayudamos a elegir.',
    textoBoton: 'Hablar por WhatsApp',
    aWhatsapp: true,
  },
  mapa: { titulo: 'Visítanos', direccion: 'Plaza de Bolívar, Bogotá', alto: 'medio' },
  espaciador: { alto: 'medio', linea: false },
}

export function crearBloque(tipo: TipoBloque): Bloque {
  return {
    id: `${tipo}-${crypto.randomUUID().slice(0, 8)}`,
    tipo,
    props: structuredClone(PROPS_INICIALES[tipo]),
  } as Bloque
}

/** Copia de un bloque con id nuevo, también en sus listas internas. */
export function duplicarBloque(bloque: Bloque): Bloque {
  const copia = structuredClone(bloque)
  copia.id = `${bloque.tipo}-${crypto.randomUUID().slice(0, 8)}`
  if (copia.estilo?.ancla) copia.estilo.ancla = `${copia.estilo.ancla}-2`
  return copia
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
