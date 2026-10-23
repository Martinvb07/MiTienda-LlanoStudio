import {
  AlignLeft,
  Columns3,
  Grid2x2,
  HelpCircle,
  Image as ImagenIcono,
  Images,
  LayoutGrid,
  type LucideIcon,
  Map,
  Megaphone,
  MessageSquareQuote,
  MousePointerClick,
  PanelBottom,
  PanelsTopLeft,
  Play,
  Shapes,
  SeparatorHorizontal,
  ShoppingBag,
  Sparkles,
  Timer,
  GalleryHorizontal,
  BadgePercent,
} from 'lucide-react'
import type { TipoBloque } from '@/tipos/bloques'

const ICONOS: Record<TipoBloque, LucideIcon> = {
  anuncio: Megaphone,
  hero: PanelsTopLeft,
  carrusel: GalleryHorizontal,
  categorias: Grid2x2,
  'grilla-productos': ShoppingBag,
  'imagen-texto': ImagenIcono,
  texto: AlignLeft,
  pie: PanelBottom,
  columnas: Columns3,
  galeria: Images,
  video: Play,
  testimonios: MessageSquareQuote,
  preguntas: HelpCircle,
  'cuenta-regresiva': Timer,
  logos: Sparkles,
  'banner-doble': BadgePercent,
  llamado: MousePointerClick,
  mapa: Map,
  espaciador: SeparatorHorizontal,
  lienzo: Shapes,
}

/** Ícono de cada tipo de sección, para la paleta. */
export function iconoBloque(tipo: TipoBloque): LucideIcon {
  return ICONOS[tipo] ?? LayoutGrid
}
