import {
  CalendarClock,
  Grid3x3,
  Heading,
  ImageIcon,
  Link2,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  MousePointerClick,
  Package,
  Search,
  Share2,
  ShoppingBag,
  Square,
  Star,
  Store,
  Tags,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { ElementoLienzo, TipoElementoLienzo } from '@/tipos/bloques'

export interface PiezaPaleta {
  tipo: TipoElementoLienzo
  etiqueta: string
  Icono: LucideIcon
  /** Una línea para la ayuda de la paleta. */
  detalle: string
}

/**
 * Todo lo que se puede poner en un lienzo libre, agrupado como se muestra en
 * la paleta de la vista previa y en el panel. Las de "Tienda" son vivas: se
 * llenan con el catálogo y los ajustes al pintarse.
 */
export const GRUPOS_PIEZAS: { titulo: string; piezas: PiezaPaleta[] }[] = [
  {
    titulo: 'Básico',
    piezas: [
      { tipo: 'titulo', etiqueta: 'Título', Icono: Heading, detalle: 'Un titular grande' },
      { tipo: 'texto', etiqueta: 'Texto', Icono: Type, detalle: 'Un párrafo' },
      { tipo: 'boton', etiqueta: 'Botón', Icono: MousePointerClick, detalle: 'Lleva a donde quieras' },
      { tipo: 'imagen', etiqueta: 'Foto', Icono: ImageIcon, detalle: 'Sube una foto' },
      { tipo: 'forma', etiqueta: 'Forma', Icono: Square, detalle: 'Un recuadro de color' },
      { tipo: 'icono', etiqueta: 'Ícono', Icono: Star, detalle: 'Envío, garantía, regalo…' },
      { tipo: 'enlace', etiqueta: 'Enlace', Icono: Link2, detalle: 'Texto subrayado que lleva a otra página' },
      { tipo: 'linea', etiqueta: 'Línea', Icono: Minus, detalle: 'Un separador' },
    ],
  },
  {
    titulo: 'Tienda',
    piezas: [
      { tipo: 'producto', etiqueta: 'Producto', Icono: Package, detalle: 'Una tarjeta de un producto, siempre al día' },
      { tipo: 'productos', etiqueta: 'Productos', Icono: Grid3x3, detalle: 'Una grilla de una categoría, siempre al día' },
      { tipo: 'categorias', etiqueta: 'Categorías', Icono: Tags, detalle: 'Botones a cada categoría' },
      { tipo: 'logo', etiqueta: 'Logo', Icono: Store, detalle: 'El logo o el nombre de la tienda' },
      { tipo: 'buscador', etiqueta: 'Buscador', Icono: Search, detalle: 'Busca en tus productos' },
      { tipo: 'menu', etiqueta: 'Menú', Icono: Menu, detalle: 'Los enlaces del menú' },
      { tipo: 'carrito', etiqueta: 'Carrito', Icono: ShoppingBag, detalle: 'La bolsa de compras' },
    ],
  },
  {
    titulo: 'Contacto',
    piezas: [
      { tipo: 'whatsapp', etiqueta: 'WhatsApp', Icono: MessageCircle, detalle: 'Botón que abre el chat' },
      { tipo: 'redes', etiqueta: 'Redes', Icono: Share2, detalle: 'Instagram, Facebook, TikTok' },
      { tipo: 'mapa', etiqueta: 'Mapa', Icono: MapPin, detalle: 'Dónde queda tu local' },
    ],
  },
  {
    titulo: 'Multimedia',
    piezas: [
      { tipo: 'video', etiqueta: 'Video', Icono: Video, detalle: 'De YouTube o Vimeo' },
      { tipo: 'cuenta', etiqueta: 'Cuenta regresiva', Icono: CalendarClock, detalle: 'Para una oferta con fecha' },
    ],
  },
]

export const PIEZAS_LIENZO: PiezaPaleta[] = GRUPOS_PIEZAS.flatMap((grupo) => grupo.piezas)

export const iconoPieza = (tipo: TipoElementoLienzo): LucideIcon =>
  PIEZAS_LIENZO.find((pieza) => pieza.tipo === tipo)?.Icono ?? Square

export const nombrePieza = (pieza: ElementoLienzo) =>
  (['titulo', 'texto', 'boton', 'enlace', 'whatsapp'].includes(pieza.tipo) && pieza.texto?.trim()) ||
  PIEZAS_LIENZO.find((opcion) => opcion.tipo === pieza.tipo)?.etiqueta ||
  'Pieza'
