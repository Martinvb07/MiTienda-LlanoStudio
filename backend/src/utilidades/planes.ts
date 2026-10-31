import { ErrorHttp } from './errores.js'

/**
 * Qué puede personalizar cada plan. El panel muestra los candados con una
 * copia de esta tabla (frontend/src/utilidades/planes.ts), pero quien manda es
 * esta: la API rechaza lo que el plan no incluye. Si cambias una, cambia la otra.
 */

export type Plan = 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'

export interface LimitesPlan {
  nombre: string
  /** null = sin límite. */
  productos: number | null
  fotosPorProducto: number
  secciones: number
  bloques: readonly string[]
  /** Colores, letra y esquinas a mano; si no, sólo los estilos predefinidos. */
  temaLibre: boolean
  quitarMarca: boolean
  /** Cupones activos a la vez; null = sin límite. */
  cupones: number | null
  /** Opciones de variante por producto; 0 = sin variantes. */
  opcionesVariantes: number
  accionesLote: boolean
  importarProductos: boolean
  diasMetricas: number
  metricasAvanzadas: boolean
  usuarios: number
  dominioPropio: boolean
  /** Páginas aparte de la de inicio (/servicios…) en la página para tu negocio. */
  paginasExtra: number
  /** Citas que se pueden agendar en línea al mes; null = sin límite. */
  citasMes: number | null
}

/**
 * Lo básico de una página de negocio: qué ofrece, cuándo atiende y cómo
 * contactarlo. Va desde Gratis, en tienda y en página.
 */
const BLOQUES_NEGOCIO_BASICO = ['servicios', 'horario', 'reservas', 'formulario'] as const

/** Lo de los enlaces para tu bio: el perfil y los botones. Va desde Gratis. */
const BLOQUES_BIO = ['perfil', 'enlaces'] as const

const BLOQUES_EMPRENDE = [
  ...BLOQUES_NEGOCIO_BASICO,
  ...BLOQUES_BIO,
  'equipo',
  'anuncio',
  'hero',
  'carrusel',
  'categorias',
  'grilla-productos',
  'imagen-texto',
  'texto',
  'pie',
  'espaciador',
  'columnas',
  'preguntas',
  'galeria',
  'banner-doble',
  'llamado',
] as const

const BLOQUES_NEGOCIO = [...BLOQUES_EMPRENDE, 'testimonios', 'video', 'logos', 'mapa', 'lienzo'] as const

const TODOS_LOS_BLOQUES = [...BLOQUES_NEGOCIO, 'cuenta-regresiva'] as const

export const PLANES: Record<Plan, LimitesPlan> = {
  GRATIS: {
    nombre: 'Gratis',
    productos: 10,
    fotosPorProducto: 4,
    secciones: 6,
    bloques: ['hero', 'grilla-productos', 'texto', 'pie', 'espaciador', ...BLOQUES_NEGOCIO_BASICO, ...BLOQUES_BIO],
    temaLibre: false,
    quitarMarca: false,
    cupones: 0,
    opcionesVariantes: 0,
    accionesLote: false,
    importarProductos: false,
    diasMetricas: 7,
    metricasAvanzadas: false,
    usuarios: 1,
    dominioPropio: false,
    paginasExtra: 0,
    citasMes: 30,
  },
  EMPRENDE: {
    nombre: 'Emprende',
    productos: 100,
    fotosPorProducto: 8,
    secciones: 12,
    bloques: BLOQUES_EMPRENDE,
    temaLibre: true,
    quitarMarca: true,
    cupones: 3,
    opcionesVariantes: 1,
    accionesLote: true,
    importarProductos: false,
    diasMetricas: 30,
    metricasAvanzadas: false,
    usuarios: 2,
    dominioPropio: false,
    paginasExtra: 0,
    citasMes: 150,
  },
  NEGOCIO: {
    nombre: 'Negocio',
    productos: null,
    fotosPorProducto: 10,
    secciones: 30,
    bloques: BLOQUES_NEGOCIO,
    temaLibre: true,
    quitarMarca: true,
    cupones: 20,
    opcionesVariantes: 2,
    accionesLote: true,
    importarProductos: true,
    diasMetricas: 90,
    metricasAvanzadas: true,
    usuarios: 5,
    dominioPropio: true,
    paginasExtra: 5,
    citasMes: null,
  },
  PRO: {
    nombre: 'Pro',
    productos: null,
    fotosPorProducto: 10,
    secciones: 60,
    bloques: TODOS_LOS_BLOQUES,
    temaLibre: true,
    quitarMarca: true,
    cupones: null,
    opcionesVariantes: 3,
    accionesLote: true,
    importarProductos: true,
    diasMetricas: 365,
    metricasAvanzadas: true,
    usuarios: 15,
    dominioPropio: true,
    paginasExtra: 15,
    citasMes: null,
  },
}

/** Nombres de las secciones, para los mensajes de error. */
export const ETIQUETAS_BLOQUE_PLAN: Record<string, string> = {
  anuncio: 'Barra de anuncio',
  hero: 'Portada',
  'grilla-productos': 'Productos',
  'imagen-texto': 'Imagen con texto',
  carrusel: 'Carrusel de banners',
  categorias: 'Categorías',
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
  lienzo: 'Lienzo libre',
  servicios: 'Servicios',
  equipo: 'Equipo',
  horario: 'Horario y contacto',
  reservas: 'Reservas',
  formulario: 'Formulario de contacto',
  perfil: 'Perfil',
  enlaces: 'Enlaces',
}

export function limitesDe(plan: string): LimitesPlan {
  return PLANES[plan as Plan] ?? PLANES.GRATIS
}

/**
 * Temas de los estilos predefinidos (copia de frontend/src/utilidades/tema.ts).
 * En los planes sin tema libre, el tema guardado es siempre uno de estos.
 */
export const TEMAS_PREDEFINIDOS: Record<string, Record<string, string>> = {
  clasica: { colorMarca: '#0f172a', colorContraste: '#ffffff', colorFondo: '#ffffff', colorTexto: '#0f172a', fuenteTitulos: 'moderna', radio: '0.5rem' },
  calida: { colorMarca: '#b45309', colorContraste: '#ffffff', colorFondo: '#faf6ef', colorTexto: '#292524', fuenteTitulos: 'clasica', radio: '0.5rem' },
  nocturna: { colorMarca: '#ffffff', colorContraste: '#000000', colorFondo: '#0b0b0c', colorTexto: '#f5f5f5', fuenteTitulos: 'moderna', radio: '0rem' },
  fresca: { colorMarca: '#0f766e', colorContraste: '#ffffff', colorFondo: '#f3faf8', colorTexto: '#123332', fuenteTitulos: 'redondeada', radio: '1.25rem' },
  llanera: { colorMarca: '#3b60ff', colorContraste: '#ffffff', colorFondo: '#f7f5f0', colorTexto: '#0a0f1c', fuenteTitulos: 'moderna', radio: '0.75rem' },
}

/** Direcciones que ya usa el sitio: una página extra no puede llamarse así. */
export const RUTAS_RESERVADAS: ReadonlySet<string> = new Set(['buscar', 'carrito', 'categoria', 'pago', 'productos', 'panel', 'api', 'cita', 'favoritos', 'tarjeta', 'pedido'])

/** Error 403 con el código que el panel reconoce para ofrecer subir de plan. */
export function fueraDelPlan(mensaje: string) {
  return new ErrorHttp(403, mensaje, 'FUERA_DEL_PLAN')
}
