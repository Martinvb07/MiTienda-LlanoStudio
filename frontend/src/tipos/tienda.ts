import type { Bloque } from './bloques'

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
  /** Todas las secciones aparecen con una animación suave al bajar. */
  animarSecciones?: boolean
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
  datosTransferencia?: string
  /** El cliente termina la compra mandando el pedido por WhatsApp. */
  pedidosWhatsapp?: boolean

  paginaProducto?: PlantillaProducto
}

export interface Tienda {
  id: string
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
}

/** Producto tal como lo ve el panel: incluye los que están ocultos. */
export interface ProductoPanel extends Producto {
  activo: boolean
  actualizadoEn: string
}
