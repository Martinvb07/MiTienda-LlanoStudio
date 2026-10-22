export type MetodoPago = 'contra-entrega' | 'transferencia' | 'acordar'

export type EstadoPedido = 'PENDIENTE' | 'PAGADO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO' | 'REEMBOLSADO'

/** Lo que la tienda manda al crear un pedido: sólo ids y cantidades, los precios los pone la API. */
export interface SolicitudPedido {
  cliente: {
    nombre: string
    email: string
    telefono: string
    ciudad: string
    direccion: string
    detalle?: string
    notas?: string
  }
  items: { productoId: string; cantidad: number; variante?: string }[]
  metodoPago: MetodoPago
  canal: 'web' | 'whatsapp'
  cupon?: string
}

export interface ItemPedido {
  id: string
  productoId: string | null
  /** Sólo en la respuesta a la tienda: para refrescar la ficha del producto. */
  slug?: string | null
  nombreProducto: string
  variante: string | null
  foto: string | null
  precioUnitario: string
  cantidad: number
  subtotal: string
}

export interface Pedido {
  id: string
  numero: number
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string | null
  direccionEnvio: { ciudad?: string; direccion?: string; detalle?: string } | null
  notas: string | null
  canal: 'web' | 'whatsapp'
  metodoPago: MetodoPago
  cupon: string | null
  notaInterna: string | null
  estado: EstadoPedido
  subtotal: string
  descuento: string
  envio: string
  total: string
  creadoEn: string
  actualizadoEn: string
  items: ItemPedido[]
}

export type PedidoCreado = Pedido

export const ETIQUETAS_PAGO: Record<MetodoPago, string> = {
  'contra-entrega': 'Contra entrega',
  transferencia: 'Transferencia',
  acordar: 'Acordar por WhatsApp',
}

export type TipoCupon = 'PORCENTAJE' | 'FIJO' | 'ENVIO_GRATIS'

export interface Cupon {
  id: string
  codigo: string
  tipo: TipoCupon
  valor: string
  minimo: string | null
  usosMaximos: number | null
  usos: number
  venceEn: string | null
  activo: boolean
  creadoEn: string
}

export interface DatosCupon {
  codigo: string
  tipo: TipoCupon
  valor: number
  minimo: number | null
  usosMaximos: number | null
  venceEn: string | null
  activo: boolean
}
