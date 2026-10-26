import type { Bloque } from './bloques'
import type { ZonaEnvio } from '@/utilidades/envios'

/** Clave de utilidades/fuentes.ts: 'moderna', 'clasica', 'redondeada' o una de Google Fonts. */
export type FuenteTitulos = string

/** Paleta con nombre que cada sección puede usar, como los esquemas de color de Shopify. */
export interface EsquemaColor {
  id: string
  nombre: string
  fondo: string
  texto: string
  marca: string
  contraste: string
}

/** Sobrescrituras de tema por tienda; se inyectan como variables CSS. */
export interface TemaTienda {
  colorMarca?: string
  /** Color del texto sobre el color de marca (botones, barra de anuncio). */
  colorContraste?: string
  colorFondo?: string
  colorTexto?: string
  fuenteTitulos?: FuenteTitulos
  radio?: string

  // ── Configuración del tema (como la de Shopify) ──
  fuenteCuerpo?: string
  pesoTitulos?: 'normal' | 'medio' | 'negrita'
  titulosMayusculas?: boolean
  anchoPagina?: 'normal' | 'amplio' | 'completo'
  botonForma?: 'recto' | 'suave' | 'pildora'
  botonEstilo?: 'relleno' | 'contorno'
  botonMayusculas?: boolean
  tarjetaProporcion?: 'cuadrada' | 'vertical' | 'horizontal'
  tarjetaAlineacion?: 'izquierda' | 'centro'
  /** Al pasar el cursor, la tarjeta muestra la segunda foto del producto. */
  tarjetaSegundaFoto?: boolean
  /** Color del precio en las tarjetas de producto (el rojo de un supermercado); sin él, el de la marca. */
  colorPrecio?: string
  /** Todas las secciones aparecen con una animación suave al bajar. */
  animarSecciones?: boolean
  /**
   * Qué pasa al agregar al carrito: se abre el carrito, sale un aviso con la
   * foto, o la foto vuela hasta la bolsa del encabezado y luego el aviso.
   */
  alAgregar?: 'carrito' | 'aviso' | 'volar'
  /** Botón "Agregar" en las tarjetas, para comprar sin entrar al producto. */
  agregarRapido?: boolean
  esquemas?: EsquemaColor[]
}

/** Lo mínimo de un tema: colores, letra de títulos y esquinas. */
export type TemaBase = Required<
  Pick<TemaTienda, 'colorMarca' | 'colorContraste' | 'colorFondo' | 'colorTexto' | 'fuenteTitulos' | 'radio'>
>

export interface EnlaceMenu {
  texto: string
  enlace: string
}

/** Piezas de la página de producto, en el orden en que se muestran. */
export type BloqueFicha =
  | 'titulo'
  | 'precio'
  | 'presentacion'
  | 'stock'
  | 'descripcion'
  | 'comprar'
  | 'whatsapp'
  | 'envio'
  | 'acordeones'
  | 'compartir'
  | 'beneficios'

/** Íconos de los beneficios de la página de producto. */
export type IconoBeneficio = 'envio' | 'garantia' | 'pago' | 'cambios' | 'soporte' | 'calidad'

export interface BeneficioFicha {
  id: string
  icono: IconoBeneficio
  texto: string
}

export interface AcordeonFicha {
  id: string
  titulo: string
  texto: string
}

/** Plantilla de la página de producto, como la plantilla "product" de Shopify. */
export interface PlantillaProducto {
  orden?: { id: BloqueFicha; visible: boolean }[]
  galeria?: 'miniaturas' | 'cuadricula' | 'apiladas'
  /** La columna de información acompaña al bajar por las fotos. */
  fijarInfo?: boolean
  textoEnvio?: string
  acordeones?: AcordeonFicha[]
  relacionados?: boolean
  tituloRelacionados?: string
  /** Íconos con lo que da confianza: envío, garantía, pago… (desde Emprende). */
  beneficios?: BeneficioFicha[]
  /** Lupa que sigue al cursor sobre la foto (desde Emprende). */
  zoomFoto?: boolean
  /** La información entra con una animación suave (desde Emprende). */
  animarEntrada?: boolean
  /** Barra de compra pegada abajo al pasar el botón (Negocio y Pro). */
  barraFija?: boolean
  /** Opiniones de clientes al final de la página y estrellas en las tarjetas. */
  resenas?: boolean
}

/** Cabecera, contacto y redes. Todo opcional: sin nada, la cabecera es la simple. */
export interface AjustesTienda {
  cabecera?: 'simple' | 'completa'
  buscador?: boolean
  /** Color de la barra de menú en la cabecera completa. */
  colorBarra?: string
  menu?: EnlaceMenu[]
  botonDestacado?: EnlaceMenu
  whatsapp?: string
  whatsappFlotante?: boolean
  direccion?: string
  correo?: string
  horario?: string
  instagram?: string
  facebook?: string
  tiktok?: string

  // Cabecera
  /** La cabecera se queda pegada arriba al bajar. */
  cabeceraFija?: boolean
  logoCentrado?: boolean
  tamanoLogo?: 'chico' | 'medio' | 'grande'

  // Ventas y envíos
  costoEnvio?: number
  envioGratisDesde?: number
  pedidoMinimo?: number
  pagoContraEntrega?: boolean
  pagoTransferencia?: boolean
  /** Pasarelas conectadas en el panel (la API las agrega a los ajustes públicos). */
  pagosEnLinea?: ('WOMPI' | 'EPAYCO' | 'BOLD')[]
  datosTransferencia?: string
  /** El cliente termina la compra mandando el pedido por WhatsApp. */
  pedidosWhatsapp?: boolean
  /** Zonas con sus ciudades y su precio; lo que no cae en ninguna paga costoEnvio. */
  zonasEnvio?: ZonaEnvio[]
  /** Sólo se envía a las ciudades de las zonas. */
  soloZonas?: boolean
  /** El cliente puede pasar a recoger el pedido sin pagar envío. */
  recogerEnTienda?: boolean
  /** Dónde se recoge; sin ella, la dirección de Contacto. */
  direccionRecogida?: string

  paginaProducto?: PlantillaProducto

  // Enlaces para tu bio
  /** Fondo de la página: liso, degradado desde el color de marca o malla de color. */
  fondoBio?: 'liso' | 'degradado' | 'malla'
  /** Quita "Hecho con Mi Sitio" al pie de la bio; sólo surte efecto en planes pagos. */
  ocultarMarca?: boolean

  /**
   * Páginas aparte de la de inicio (/servicios, /nosotros…), cada una con sus
   * secciones. Sólo en la página para tu negocio, desde el plan Negocio.
   */
  paginas?: PaginaExtra[]
}

/** Una página más del sitio, con su dirección propia y sus secciones. */
export interface PaginaExtra {
  id: string
  titulo: string
  /** Lo que va después de la barra: "servicios" → tunegocio.llanostudio.co/servicios. */
  ruta: string
  bloques: Bloque[]
}

/**
 * Qué es el sitio: tienda en línea con carrito, página informativa de un
 * negocio o enlaces para la bio. Todos guardan lo mismo (diseño, tema,
 * ajustes), así que pasar de uno a otro no pierde nada.
 */
export type TipoSitio = 'tienda' | 'pagina' | 'enlaces'

export interface Tienda {
  id: string
  /** Sin él (respuestas viejas en caché), es una tienda. */
  tipo?: TipoSitio
  nombre: string
  descripcion: string | null
  logoUrl: string | null
  faviconUrl: string | null
  plantilla: string
  tema: TemaTienda
  configuracionBloques: Bloque[]
  ajustes: AjustesTienda
  moneda: string
  publicada: boolean
  /** Plan del tenant; la API pública lo manda para decidir la marca del pie. */
  plan?: string
}

export interface Producto {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  /** Texto, no número: los importes no pasan por float. */
  precio: string
  precioComparacion: string | null
  stock: number
  fotos: string[]
  categoria?: string | null
  /** "500 gr", "Paquete x 10"… */
  presentacion?: string | null
  /** Sale primero en el catálogo y en las secciones de destacados. */
  destacado?: boolean
  opciones?: OpcionProducto[]
  variantes?: VarianteProducto[]
  /** Promedio y cantidad de opiniones aprobadas; null = todavía ninguna. */
  resenas?: ResumenResenas | null
}

export interface ResumenResenas {
  /** 1 a 5, con un decimal. */
  promedio: number
  total: number
}

/** Una opinión aprobada, como se ve en la tienda. */
export interface ResenaPublica {
  id: string
  nombre: string
  ciudad: string | null
  estrellas: number
  texto: string
  /** El correo tiene un pedido con el producto. */
  verificada: boolean
  respuesta: string | null
  creadoEn: string
}

/** Una característica que el cliente elige: Talla (S, M, L), Color (Rojo, Azul)… */
export interface OpcionProducto {
  nombre: string
  valores: string[]
}

/** Una combinación concreta de valores, con su stock y, si cambia, su precio. */
export interface VarianteProducto {
  id: string
  /** "M / Rojo". */
  nombre: string
  valores: Record<string, string>
  /** null o ausente = el precio del producto. */
  precio?: string | number | null
  stock: number
}

/** Producto tal como lo ve el panel: incluye los que están ocultos. */
export interface ProductoPanel extends Producto {
  activo: boolean
  actualizadoEn: string
}
