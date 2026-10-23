import {
  Award,
  BadgeCheck,
  Banknote,
  Box,
  Clock,
  CreditCard,
  Gift,
  Hand,
  Heart,
  Headphones,
  Leaf,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  ThumbsUp,
  Truck,
  Undo2,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Íconos que la tienda puede poner en sus secciones (columnas de beneficios).
 * Se guarda la clave ("camion"), no el componente, para que el JSON del
 * diseño siga siendo serializable.
 */
export const ICONOS_BLOQUE: Record<string, { Icono: LucideIcon; nombre: string }> = {
  camion: { Icono: Truck, nombre: 'Envío' },
  paquete: { Icono: Package, nombre: 'Paquete' },
  caja: { Icono: Box, nombre: 'Caja' },
  candado: { Icono: Lock, nombre: 'Seguro' },
  escudo: { Icono: ShieldCheck, nombre: 'Garantía' },
  tarjeta: { Icono: CreditCard, nombre: 'Tarjeta' },
  billete: { Icono: Banknote, nombre: 'Efectivo' },
  billetera: { Icono: Wallet, nombre: 'Billetera' },
  mensaje: { Icono: MessageCircle, nombre: 'Chat' },
  telefono: { Icono: Phone, nombre: 'Teléfono' },
  audifonos: { Icono: Headphones, nombre: 'Soporte' },
  devolucion: { Icono: Undo2, nombre: 'Devolución' },
  cambio: { Icono: RefreshCw, nombre: 'Cambio' },
  reloj: { Icono: Clock, nombre: 'Horario' },
  rayo: { Icono: Zap, nombre: 'Rápido' },
  ubicacion: { Icono: MapPin, nombre: 'Ubicación' },
  tienda: { Icono: Store, nombre: 'Tienda' },
  bolsa: { Icono: ShoppingBag, nombre: 'Compra' },
  etiqueta: { Icono: Tag, nombre: 'Precio' },
  regalo: { Icono: Gift, nombre: 'Regalo' },
  corazon: { Icono: Heart, nombre: 'Favorito' },
  estrella: { Icono: Star, nombre: 'Estrella' },
  premio: { Icono: Award, nombre: 'Premio' },
  verificado: { Icono: BadgeCheck, nombre: 'Verificado' },
  pulgar: { Icono: ThumbsUp, nombre: 'Me gusta' },
  hoja: { Icono: Leaf, nombre: 'Natural' },
  mano: { Icono: Hand, nombre: 'Hecho a mano' },
  regla: { Icono: Ruler, nombre: 'Medidas' },
  personas: { Icono: Users, nombre: 'Comunidad' },
  brillo: { Icono: Sparkles, nombre: 'Novedad' },
}

/** Diseños guardados antes, con emojis: se muestran con su ícono equivalente. */
const DE_EMOJI: Record<string, string> = {
  '🚚': 'camion',
  '📦': 'paquete',
  '🔒': 'candado',
  '💳': 'tarjeta',
  '💬': 'mensaje',
  '📞': 'telefono',
  '✨': 'brillo',
  '⭐': 'estrella',
  '❤️': 'corazon',
  '🎁': 'regalo',
  '⚡': 'rayo',
  '🌿': 'hoja',
}

export const claveIcono = (valor: string | undefined) => (valor ? (ICONOS_BLOQUE[valor] ? valor : DE_EMOJI[valor]) : undefined)

/** Pinta el ícono guardado; un emoji viejo sin equivalente no se muestra. */
export function IconoBloque({ valor, className }: { valor: string | undefined; className?: string }) {
  const clave = claveIcono(valor)
  if (!clave) return null
  const { Icono } = ICONOS_BLOQUE[clave]!
  return <Icono aria-hidden="true" strokeWidth={1.6} className={className} />
}
