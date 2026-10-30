export type MetodoPago = 'contra-entrega' | 'transferencia' | 'acordar' | 'wompi' | 'epayco' | 'bold'

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
  entrega?: 'domicilio' | 'recoger'
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
  direccionEnvio: {
    /** Sin ella (pedidos viejos), es a domicilio. */
    entrega?: 'domicilio' | 'recoger'
    ciudad?: string
    direccion?: string
    detalle?: string
    /** Zona de envío que cubrió la ciudad, si alguna. */
    zona?: string
  } | null
  notas: string | null
  canal: 'web' | 'whatsapp'
  metodoPago: MetodoPago
  cupon: string | null
  notaInterna: string | null
  /** Seguimiento del envío; le llega al comprador en el correo de "va en camino". */
  transportadora?: string | null
  guia?: string | null
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
  wompi: 'En línea con Wompi',
  epayco: 'En línea con ePayco',
  bold: 'En línea con Bold',
}

/** Lo que devuelve la API para cobrar en la pasarela elegida. */
export type CheckoutPago =
  | { tipo: 'redireccion'; url: string }
  | { tipo: 'epayco'; llave: string; prueba: boolean; datos: Record<string, string> }
  | {
      tipo: 'bold'
      llave: string
      referencia: string
      monto: number
      moneda: string
      firma: string
      descripcion: string
      redireccion: string
      correo: string
    }

export interface EstadoPagoTienda {
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR'
  proveedor: string
  monto: string
  pedido: { numero: number; clienteNombre: string; clienteEmail: string; total: string }
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
