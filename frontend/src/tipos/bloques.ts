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
  | 'servicios'
  | 'equipo'
  | 'horario'
  | 'espaciador'
  | 'lienzo'
  | 'perfil'
  | 'enlaces'

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
  /** Quita "Hecho con Mi Sitio"; sólo surte efecto en planes pagos. */
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

/** Un servicio de la página de un negocio: una consulta, un plato, un arreglo. */
export interface ServicioNegocio {
  id: string
  nombre: string
  descripcion?: string
  /** Texto libre: "$80.000", "Desde $120.000", "Sin costo". */
  precio?: string
  /** "45 min", "1 hora". */
  duracion?: string
  imagenUrl?: string
}

export interface PropsServicios {
  titulo?: string
  subtitulo?: string
  /** 'tarjetas' en cuadrícula; 'lista' en filas con el precio a la derecha, como una carta. */
  disposicion?: 'tarjetas' | 'lista'
  /** Botón de cada servicio: abre WhatsApp con el nombre del servicio. Vacío = sin botón. */
  textoBoton?: string
  items: ServicioNegocio[]
}

export interface MiembroEquipo {
  id: string
  nombre: string
  /** "Odontóloga", "Socio fundador". */
  cargo?: string
  texto?: string
  fotoUrl?: string
}

export interface PropsEquipo {
  titulo?: string
  subtitulo?: string
  items: MiembroEquipo[]
}

export interface DiaHorario {
  id: string
  /** "Lunes a viernes". */
  dia: string
  /** "8:00 a. m. a 6:00 p. m." o "Cerrado". */
  horas: string
}

export interface PropsHorario {
  titulo?: string
  dias: DiaHorario[]
  /** Aviso corto bajo el horario: "Festivos cerrado". */
  nota?: string
  /** Vacía = la de Contacto y redes. */
  direccion?: string
  /** Para el botón Llamar; vacío = el WhatsApp. */
  telefono?: string
}

/** Cabeza de los enlaces para tu bio: foto, nombre, una línea sobre ti y tus redes. */
export interface PropsPerfil {
  /** Vacío = el nombre del sitio. */
  nombre?: string
  bio?: string
  /** Vacía = el logo del sitio; sin ninguno, las iniciales. */
  fotoUrl?: string
  forma?: 'circulo' | 'redondeada'
  /** Íconos de las redes de Contacto y redes debajo de la bio. */
  mostrarRedes?: boolean
}

/** Un botón de los enlaces para tu bio. */
export interface EnlaceBio {
  id: string
  texto: string
  /** Dirección web, @usuario, número de WhatsApp o correo: se arma el enlace solo. */
  url: string
  /** Clave de ICONOS_BLOQUE. */
  icono?: string
  /** Línea pequeña debajo del texto. */
  descripcion?: string
  /** Resalta el botón con un brillo que pasa: para lo más importante. */
  destacado?: boolean
}

export interface PropsEnlaces {
  titulo?: string
  /** 'relleno' con el color de marca, 'contorno' sólo con borde, 'suave' con un fondo tenue. */
  estilo?: 'relleno' | 'contorno' | 'suave'
  items: EnlaceBio[]
}

export interface PropsEspaciador {
  alto?: 'chico' | 'medio' | 'grande'
  linea?: boolean
}

/** Posición y tamaño en porcentaje del lienzo: así se adapta a cualquier ancho. */
export interface CajaLienzo {
  x: number
  y: number
  w: number
  h: number
}

export type TipoElementoLienzo =
  | 'titulo'
  | 'texto'
  | 'boton'
  | 'imagen'
  | 'forma'
  // Vivas: se llenan con los datos de la tienda al pintarse.
  | 'producto'
  | 'productos'
  | 'categorias'
  | 'redes'
  | 'whatsapp'
  | 'logo'
  | 'buscador'
  | 'menu'
  | 'carrito'
  // Fijas con algo más que texto.
  | 'icono'
  | 'enlace'
  | 'linea'
  | 'video'
  | 'mapa'
  | 'cuenta'

export type RedSocial = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp'

/** Qué muestra una tarjeta de producto (en el lienzo y en la grilla de productos). */
export interface OpcionesTarjeta {
  estilo?: 'simple' | 'tarjeta'
  nombre?: boolean
  precio?: boolean
  precioAntes?: boolean
  /** La insignia de descuento sobre la foto. */
  oferta?: boolean
  /** Texto de la insignia; por defecto "Oferta". */
  textoOferta?: string
  /** Botón Agregar (si el plan lo trae). */
  boton?: boolean
}

/** Una pieza suelta del lienzo libre: se mueve y se estira donde se quiera. */
export interface ElementoLienzo extends CajaLienzo {
  id: string
  tipo: TipoElementoLienzo
  /** Acomodo en el celular; sin él, el del computador. */
  movil?: Partial<CajaLienzo> & { oculto?: boolean; tamano?: number }
  texto?: string
  enlace?: string
  imagenUrl?: string
  /** Cómo llena la foto su caja. */
  ajuste?: 'cubrir' | 'contener'
  color?: string
  fondo?: string
  /** Botón sólo con borde. */
  contorno?: boolean
  /** Tamaño de letra en px sobre un lienzo de 1200 de ancho. */
  tamano?: number
  peso?: 'normal' | 'negrita'
  alineacion?: 'izquierda' | 'centro' | 'derecha'
  /** Esquinas en px. */
  radio?: number
  /** 0 a 100. */
  opacidad?: number

  // ── Piezas vivas y especiales ──
  /** producto: cuál (si ya no existe, se muestra el primero). */
  productoId?: string
  /** productos: de qué categoría, cuántos y en cuántas columnas (computador / celular). */
  categoria?: string
  limite?: number
  columnas?: number
  columnasMovil?: number
  soloDestacados?: boolean
  /** producto y productos: qué se ve en cada tarjeta. */
  tarjeta?: OpcionesTarjeta
  /** redes: cuáles; sin elegir, todas las que tenga la tienda. */
  redes?: RedSocial[]
  /** icono: clave de ICONOS_LIENZO. */
  icono?: string
  /** video: enlace de YouTube o Vimeo. */
  url?: string
  /** mapa: dirección; sin ella, la de la tienda. */
  direccion?: string
  /** cuenta: fecha de cierre (ISO). */
  fecha?: string
  /** whatsapp: mensaje con que se abre el chat. */
  mensaje?: string
  /** icono: relleno en vez de sólo el trazo (como las estrellas de una reseña). */
  relleno?: boolean
  /** enlace: sin subrayar. */
  sinSubrayado?: boolean
}

export interface PropsLienzo {
  /** Alto en px sobre un ancho de 1200 (computador). */
  alto: number
  /** Alto en px sobre un ancho de 390 (celular). */
  altoMovil: number
  fondo?: string
  elementos: ElementoLienzo[]
  /** La sección de la que salió al pasarla a libre: conserva su nombre ("Portada", "Productos"…). */
  origen?: TipoBloque
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
export type BloqueServicios = BloqueBase<'servicios', PropsServicios>
export type BloqueEquipo = BloqueBase<'equipo', PropsEquipo>
export type BloqueHorario = BloqueBase<'horario', PropsHorario>
export type BloqueEspaciador = BloqueBase<'espaciador', PropsEspaciador>
export type BloqueLienzo = BloqueBase<'lienzo', PropsLienzo>
export type BloquePerfil = BloqueBase<'perfil', PropsPerfil>
export type BloqueEnlaces = BloqueBase<'enlaces', PropsEnlaces>

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
  | BloqueServicios
  | BloqueEquipo
  | BloqueHorario
  | BloqueEspaciador
  | BloqueLienzo
  | BloquePerfil
  | BloqueEnlaces

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
  servicios: 'Servicios',
  equipo: 'Equipo',
  horario: 'Horario y contacto',
  espaciador: 'Espacio o línea',
  lienzo: 'Lienzo libre',
  perfil: 'Perfil',
  enlaces: 'Enlaces',
}

/** Grupos de la paleta de secciones del editor. */
export const GRUPOS_BLOQUE: { titulo: string; tipos: TipoBloque[] }[] = [
  { titulo: 'Diseño libre', tipos: ['lienzo'] },
  { titulo: 'Tu bio', tipos: ['perfil', 'enlaces'] },
  { titulo: 'Portada', tipos: ['hero', 'carrusel', 'anuncio', 'banner-doble'] },
  { titulo: 'Catálogo', tipos: ['grilla-productos', 'categorias'] },
  { titulo: 'Tu negocio', tipos: ['servicios', 'horario', 'equipo'] },
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
  servicios: 'Lo que ofreces, con precio y duración, y un botón para agendar por WhatsApp.',
  equipo: 'Quiénes atienden, con foto y cargo.',
  horario: 'Cuándo atiendes, dónde estás y botones para escribir, llamar o llegar.',
  espaciador: 'Aire entre secciones, con o sin línea.',
  lienzo: 'Un espacio en blanco: arrastra títulos, fotos y botones donde quieras y estíralos a tu gusto.',
  perfil: 'Tu foto, tu nombre, una línea sobre ti y tus redes.',
  enlaces: 'Botones grandes a tu WhatsApp, tus redes, tu tienda o lo que quieras.',
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
  pie: { texto: '© Mi negocio', mostrarRedes: true },
  columnas: {
    titulo: 'Por qué comprarnos',
    columnas: 3,
    alineacion: 'centro',
    items: [
      { id: 'k1', icono: 'camion', titulo: 'Envíos a todo el país', texto: 'Recibe en 2 a 5 días hábiles.' },
      { id: 'k2', icono: 'candado', titulo: 'Pago seguro', texto: 'Paga con tarjeta, PSE o contra entrega.' },
      { id: 'k3', icono: 'mensaje', titulo: 'Te asesoramos', texto: 'Escríbenos por WhatsApp cuando quieras.' },
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
  servicios: {
    titulo: 'Servicios',
    disposicion: 'tarjetas',
    textoBoton: 'Agendar',
    items: [
      { id: 's1', nombre: 'Consulta', descripcion: 'Qué incluye, en una frase.', precio: '$80.000', duracion: '45 min' },
      { id: 's2', nombre: 'Valoración', descripcion: 'Revisamos tu caso y te decimos cómo seguir.', precio: 'Sin costo', duracion: '20 min' },
      { id: 's3', nombre: 'Seguimiento', descripcion: 'Para quienes ya empezaron con nosotros.', precio: '$50.000', duracion: '30 min' },
    ],
  },
  equipo: {
    titulo: 'Nuestro equipo',
    items: [
      { id: 'e1', nombre: 'Laura Gómez', cargo: 'Directora' },
      { id: 'e2', nombre: 'Andrés Rojas', cargo: 'Especialista' },
      { id: 'e3', nombre: 'Camila Pérez', cargo: 'Atención al cliente' },
    ],
  },
  horario: {
    titulo: 'Horario y contacto',
    dias: [
      { id: 'h1', dia: 'Lunes a viernes', horas: '8:00 a. m. a 6:00 p. m.' },
      { id: 'h2', dia: 'Sábados', horas: '9:00 a. m. a 1:00 p. m.' },
    ],
    nota: 'Domingos y festivos cerrado.',
  },
  espaciador: { alto: 'medio', linea: false },
  perfil: { bio: 'Cuenta en una línea quién eres y qué haces.', forma: 'circulo', mostrarRedes: true },
  enlaces: {
    estilo: 'relleno',
    items: [
      { id: 'l1', texto: 'Escríbeme por WhatsApp', url: '', icono: 'whatsapp', destacado: true },
      { id: 'l2', texto: 'Mi Instagram', url: '', icono: 'instagram' },
      { id: 'l3', texto: 'Mi sitio web', url: '', icono: 'web' },
    ],
  },
  // Arranca como el banner de dos fotos con el título encima: se ve de una qué se puede hacer.
  lienzo: {
    alto: 560,
    altoMovil: 620,
    fondo: '#f4f1ec',
    elementos: [
      { id: 'f1', tipo: 'imagen', x: 0, y: 0, w: 50, h: 100, ajuste: 'cubrir', movil: { x: 0, y: 0, w: 100, h: 50 } },
      { id: 'f2', tipo: 'imagen', x: 50, y: 0, w: 50, h: 100, ajuste: 'cubrir', movil: { x: 0, y: 50, w: 100, h: 50 } },
      { id: 'o1', tipo: 'forma', x: 0, y: 0, w: 100, h: 100, fondo: '#000000', opacidad: 25 },
      {
        id: 't1',
        tipo: 'titulo',
        x: 15,
        y: 34,
        w: 70,
        h: 22,
        texto: 'Tus favoritos los encuentras aquí',
        color: '#ffffff',
        tamano: 64,
        peso: 'negrita',
        alineacion: 'centro',
        movil: { x: 6, y: 34, w: 88, h: 20, tamano: 34 },
      },
      {
        id: 'b1',
        tipo: 'boton',
        x: 42,
        y: 62,
        w: 16,
        h: 10,
        texto: 'Ver productos',
        enlace: '#productos',
        color: '#ffffff',
        contorno: true,
        tamano: 18,
        radio: 14,
        movil: { x: 25, y: 58, w: 50, h: 8, tamano: 16 },
      },
    ],
  },
}

/**
 * De qué sección viene un lienzo: lo guardado al pasarla a libre o, en las
 * que se pasaron antes de guardarlo, el tipo con que empieza su id ("hero-…").
 */
export function origenLienzo(bloque: Bloque): TipoBloque | null {
  if (bloque.tipo !== 'lienzo') return null
  if (bloque.props.origen) return bloque.props.origen
  if (bloque.id.startsWith('grilla-')) return 'grilla-productos'
  const tipos = (Object.keys(ETIQUETAS_BLOQUE) as TipoBloque[]).filter((tipo) => tipo !== 'lienzo' && bloque.id.startsWith(`${tipo}-`))
  return tipos.sort((a, b) => b.length - a.length)[0] ?? null
}

/** El nombre de una sección; una pasada a libre conserva el de la original. */
export function etiquetaBloque(bloque: Bloque): string {
  const origen = origenLienzo(bloque)
  return ETIQUETAS_BLOQUE[origen ?? bloque.tipo]
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
