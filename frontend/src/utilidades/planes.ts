import { normalizarBloques, type Bloque, type EstiloSeccion, type TipoBloque } from '@/tipos/bloques'
import type { AjustesTienda, TemaTienda } from '@/tipos/tienda'

/**
 * Qué puede personalizar cada plan. Es la misma tabla que hace cumplir el
 * backend (backend/src/utilidades/planes.ts): si cambias una, cambia la otra.
 * Aquí sólo sirve para mostrar candados y avisos antes de que la API rechace.
 */

export type Plan = 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'

export interface LimitesPlan {
  nombre: string
  /** null = sin límite. */
  productos: number | null
  fotosPorProducto: number
  secciones: number
  bloques: readonly TipoBloque[]
  /** Colores, letra y esquinas a mano; si no, sólo los estilos predefinidos. */
  temaLibre: boolean
  /** Puede quitar "Hecho con Mi Sitio" del pie. */
  quitarMarca: boolean
  /** Cabecera con barra de color, botón destacado y WhatsApp a la vista. */
  cabeceraCompleta: boolean
  buscador: boolean
  enlacesMenu: number
  whatsappFlotante: boolean
  /** Pie oscuro en columnas con dirección, correo y horario. */
  pieColumnas: boolean
  bannersCarrusel: number
  itemsCategorias: number
  /** Grilla con tarjetas, 5 columnas y filtro por categoría. */
  grillaAvanzada: boolean
  /** Hasta qué nivel se puede cambiar la apariencia de cada sección. */
  estiloSeccion: NivelEstilo
  /** Elementos por lista en las secciones nuevas (columnas, testimonios, fotos…). */
  itemsLista: number
  /** Botones de los enlaces para tu bio, contando todas sus secciones. */
  enlacesBio: number
  /** Páginas aparte de la de inicio (/servicios…) en la página para tu negocio. */
  paginasExtra: number
  /** Cupones activos a la vez; null = sin límite. */
  cupones: number | null
  /** Opciones de variante por producto (Talla, Color…); 0 = sin variantes. */
  opcionesVariantes: number
  /** Ocultar, destacar, mover o borrar varios productos de una vez. */
  accionesLote: boolean
  importarProductos: boolean
  exportarPedidos: boolean
  /** Días hacia atrás que muestran las estadísticas. */
  diasMetricas: number
  /** Productos más vistos y vendidos, conversión y clics a WhatsApp. */
  metricasAvanzadas: boolean
  /** Personas que pueden entrar al panel, contando a la dueña. */
  usuarios: number
  /** Conectar www.tutienda.com. */
  dominioPropio: boolean
  /**
   * Cómo se siente comprar: 'basica' abre el carrito; 'avanzada' suma el aviso
   * con foto y el botón Agregar en las tarjetas; 'completa' la foto que vuela
   * hasta la bolsa.
   */
  experienciaCompra: ExperienciaCompra
  /** Citas que se pueden agendar en línea al mes; null = sin límite. */
  citasMes: number | null
}

export type ExperienciaCompra = 'basica' | 'avanzada' | 'completa'
const EXPERIENCIAS: readonly ExperienciaCompra[] = ['basica', 'avanzada', 'completa']

export function experienciaIncluye(actual: ExperienciaCompra, requerida: ExperienciaCompra) {
  return EXPERIENCIAS.indexOf(actual) >= EXPERIENCIAS.indexOf(requerida)
}

/**
 * Qué del estilo de sección incluye cada nivel:
 * - basico: fondo, color de texto, espaciado y ancla para el menú.
 * - avanzado: además ancho, animación de entrada, forma de tarjeta y en qué
 *   dispositivos se ve.
 * - completo: además imagen de fondo con oscurecido.
 */
export type NivelEstilo = 'ninguno' | 'basico' | 'avanzado' | 'completo'

const NIVELES: readonly NivelEstilo[] = ['ninguno', 'basico', 'avanzado', 'completo']

export function nivelIncluye(actual: NivelEstilo, requerido: NivelEstilo) {
  return NIVELES.indexOf(actual) >= NIVELES.indexOf(requerido)
}

/**
 * Lo básico de una página de negocio: qué ofrece, cuándo atiende y cómo
 * contactarlo. Va desde Gratis, en tienda y en página.
 */
const BLOQUES_NEGOCIO_BASICO: readonly TipoBloque[] = ['servicios', 'horario', 'reservas', 'formulario']

/** Lo de los enlaces para tu bio: el perfil y los botones. Va desde Gratis. */
const BLOQUES_BIO: readonly TipoBloque[] = ['perfil', 'enlaces']

const BLOQUES_EMPRENDE: readonly TipoBloque[] = [
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
]

const BLOQUES_NEGOCIO: readonly TipoBloque[] = [...BLOQUES_EMPRENDE, 'testimonios', 'video', 'logos', 'mapa', 'lienzo']

const TODOS_LOS_BLOQUES: readonly TipoBloque[] = [...BLOQUES_NEGOCIO, 'cuenta-regresiva']

export const PLANES: Record<Plan, LimitesPlan> = {
  GRATIS: {
    nombre: 'Gratis',
    productos: 10,
    fotosPorProducto: 4,
    secciones: 6,
    bloques: ['hero', 'grilla-productos', 'texto', 'pie', 'espaciador', ...BLOQUES_NEGOCIO_BASICO, ...BLOQUES_BIO],
    temaLibre: false,
    quitarMarca: false,
    cabeceraCompleta: false,
    buscador: false,
    enlacesMenu: 3,
    whatsappFlotante: false,
    pieColumnas: false,
    bannersCarrusel: 0,
    itemsCategorias: 0,
    grillaAvanzada: false,
    estiloSeccion: 'ninguno',
    itemsLista: 0,
    enlacesBio: 6,
    paginasExtra: 0,
    cupones: 0,
    opcionesVariantes: 0,
    accionesLote: false,
    importarProductos: false,
    diasMetricas: 7,
    metricasAvanzadas: false,
    usuarios: 1,
    dominioPropio: false,
    experienciaCompra: 'basica',
    exportarPedidos: false,
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
    cabeceraCompleta: true,
    buscador: true,
    enlacesMenu: 5,
    whatsappFlotante: true,
    pieColumnas: true,
    bannersCarrusel: 3,
    itemsCategorias: 6,
    grillaAvanzada: true,
    estiloSeccion: 'basico',
    itemsLista: 6,
    enlacesBio: 15,
    paginasExtra: 0,
    cupones: 3,
    opcionesVariantes: 1,
    accionesLote: true,
    importarProductos: false,
    diasMetricas: 30,
    metricasAvanzadas: false,
    usuarios: 2,
    dominioPropio: false,
    experienciaCompra: 'avanzada',
    exportarPedidos: true,
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
    cabeceraCompleta: true,
    buscador: true,
    enlacesMenu: 8,
    whatsappFlotante: true,
    pieColumnas: true,
    bannersCarrusel: 8,
    itemsCategorias: 12,
    grillaAvanzada: true,
    estiloSeccion: 'avanzado',
    itemsLista: 12,
    enlacesBio: 40,
    paginasExtra: 5,
    cupones: 20,
    opcionesVariantes: 2,
    accionesLote: true,
    importarProductos: true,
    diasMetricas: 90,
    metricasAvanzadas: true,
    usuarios: 5,
    dominioPropio: true,
    experienciaCompra: 'completa',
    exportarPedidos: true,
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
    cabeceraCompleta: true,
    buscador: true,
    enlacesMenu: 12,
    whatsappFlotante: true,
    pieColumnas: true,
    bannersCarrusel: 15,
    itemsCategorias: 24,
    grillaAvanzada: true,
    estiloSeccion: 'completo',
    itemsLista: 30,
    enlacesBio: 100,
    paginasExtra: 15,
    cupones: null,
    opcionesVariantes: 3,
    accionesLote: true,
    importarProductos: true,
    diasMetricas: 365,
    metricasAvanzadas: true,
    usuarios: 15,
    dominioPropio: true,
    experienciaCompra: 'completa',
    exportarPedidos: true,
    citasMes: null,
  },
}

export const ORDEN_PLANES: readonly Plan[] = ['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO']

export function limitesDe(plan: string | undefined): LimitesPlan {
  return PLANES[(plan ?? 'GRATIS') as Plan] ?? PLANES.GRATIS
}

/** El plan más barato que desbloquea algo, para el aviso "Desde el plan X". */
export function planMinimo(cumple: (limites: LimitesPlan) => boolean): string {
  const plan = ORDEN_PLANES.find((clave) => cumple(PLANES[clave]))
  return plan ? PLANES[plan].nombre : 'Pro'
}

/** Si `actual` incluye lo de `requerido` (los planes van de menor a mayor). */
export function planIncluye(actual: string | undefined, requerido: Plan): boolean {
  return ORDEN_PLANES.indexOf((actual ?? 'GRATIS') as Plan) >= ORDEN_PLANES.indexOf(requerido)
}

/**
 * Lo guardado, recortado a lo que el plan permite. Se aplica al pintar (tienda
 * pública y vista previa), así una tienda que baja de plan no pierde nada de lo
 * que configuró: sólo deja de mostrarse hasta que vuelva a subir.
 */
export function ajustarAlPlan(
  plan: string | undefined,
  ajustes: AjustesTienda,
  bloques: Bloque[],
): { ajustes: AjustesTienda; bloques: Bloque[] } {
  const limites = limitesDe(plan)
  const completa = limites.cabeceraCompleta && ajustes.cabecera === 'completa'

  const ajustados: AjustesTienda = {
    ...ajustes,
    cabecera: completa ? 'completa' : 'simple',
    buscador: limites.buscador ? ajustes.buscador : false,
    menu: ajustes.menu?.slice(0, limites.enlacesMenu),
    botonDestacado: completa ? ajustes.botonDestacado : undefined,
    whatsappFlotante: limites.whatsappFlotante ? ajustes.whatsappFlotante : false,
    ...(limites.pieColumnas ? {} : { direccion: undefined, correo: undefined, horario: undefined }),
    // Quien recoge necesita saber dónde, aunque el plan no muestre la dirección en el pie.
    direccionRecogida: ajustes.recogerEnTienda ? ajustes.direccionRecogida || ajustes.direccion : undefined,
    // Lo premium de la página de producto, según el plan.
    paginaProducto: ajustes.paginaProducto && {
      ...ajustes.paginaProducto,
      ...(experienciaIncluye(limites.experienciaCompra, 'avanzada')
        ? {}
        : {
            beneficios: [],
            zoomFoto: false,
            animarEntrada: false,
            orden: ajustes.paginaProducto.orden?.filter((pieza) => pieza.id !== 'beneficios'),
          }),
      ...(experienciaIncluye(limites.experienciaCompra, 'completa') ? {} : { barraFija: false }),
    },
  }

  // Las páginas extra: las que el plan incluye, con sus secciones recortadas igual.
  if (ajustes.paginas) {
    ajustados.paginas = ajustes.paginas.slice(0, limites.paginasExtra).map((pagina) => ({
      ...pagina,
      bloques: bloquesAlPlan(limites, normalizarBloques(pagina.bloques)),
    }))
  }

  return { ajustes: ajustados, bloques: bloquesAlPlan(limites, bloques) }
}

/** Las secciones de una página, recortadas a lo que el plan permite. */
function bloquesAlPlan(limites: LimitesPlan, bloques: Bloque[]): Bloque[] {
  const items = limites.itemsLista
  // El tope de botones de la bio cuenta los de todas sus secciones, en orden.
  let enlacesLibres = limites.enlacesBio

  return bloques
    .filter((bloque) => limites.bloques.includes(bloque.tipo))
    .map((bloque): Bloque => ({ ...bloque, estilo: estiloDelPlan(bloque.estilo, limites.estiloSeccion) }) as Bloque)
    .map((bloque): Bloque => {
      switch (bloque.tipo) {
        case 'columnas':
          return { ...bloque, props: { ...bloque.props, items: bloque.props.items.slice(0, items) } }
        case 'galeria':
          return { ...bloque, props: { ...bloque.props, imagenes: bloque.props.imagenes.slice(0, items) } }
        case 'testimonios':
        case 'preguntas':
        case 'logos':
        case 'equipo':
          return { ...bloque, props: { ...bloque.props, items: bloque.props.items.slice(0, items) } } as Bloque
        case 'banner-doble':
          return { ...bloque, props: { ...bloque.props, items: bloque.props.items.slice(0, 3) } }
        case 'enlaces': {
          const visibles = bloque.props.items.slice(0, Math.max(0, enlacesLibres))
          enlacesLibres -= visibles.length
          return { ...bloque, props: { ...bloque.props, items: visibles } }
        }
        case 'carrusel':
          return {
            ...bloque,
            props: {
              ...bloque.props,
              diapositivas: bloque.props.diapositivas.slice(0, limites.bannersCarrusel),
            },
          }
        case 'categorias':
          return {
            ...bloque,
            props: {
              ...bloque.props,
              items: bloque.props.items.slice(0, limites.itemsCategorias),
            },
          }
        case 'grilla-productos':
          return limites.grillaAvanzada
            ? bloque
            : {
                ...bloque,
                props: {
                  ...bloque.props,
                  estilo: 'simple',
                  categoria: undefined,
                  columnas: bloque.props.columnas === 5 ? 4 : bloque.props.columnas,
                },
              }
        default:
          return bloque
      }
    })
}

/** Deja del estilo de una sección sólo lo que el nivel del plan incluye. */
export function estiloDelPlan(estilo: EstiloSeccion | undefined, nivel: NivelEstilo): EstiloSeccion | undefined {
  if (!estilo || nivel === 'ninguno') return undefined
  const { esquema, fondo, texto, espaciado, ancla, ancho, animacion, dispositivos, forma, imagenFondo, oscurecer } = estilo
  return {
    esquema,
    fondo,
    texto,
    espaciado,
    ancla,
    ...(nivelIncluye(nivel, 'avanzado') ? { ancho, animacion, dispositivos, forma } : {}),
    ...(nivelIncluye(nivel, 'completo') ? { imagenFondo, oscurecer } : {}),
  }
}

/**
 * El tema tal como se pinta: lo de la experiencia de compra que el plan no
 * incluye baja al nivel que sí tiene. Igual que ajustarAlPlan, no borra nada.
 */
export function temaAlPlan<T extends Pick<TemaTienda, 'alAgregar' | 'agregarRapido'>>(plan: string | undefined, tema: T): T {
  const nivel = limitesDe(plan).experienciaCompra
  const alAgregar =
    tema.alAgregar === 'volar' && !experienciaIncluye(nivel, 'completa')
      ? experienciaIncluye(nivel, 'avanzada')
        ? 'aviso'
        : 'carrito'
      : tema.alAgregar === 'aviso' && !experienciaIncluye(nivel, 'avanzada')
        ? 'carrito'
        : tema.alAgregar
  return { ...tema, alAgregar, agregarRapido: experienciaIncluye(nivel, 'avanzada') ? tema.agregarRapido : false }
}
