/**
 * Cliente mínimo de la API de Alegra (https://developer.alegra.com), el
 * proveedor tecnológico con el que cada tienda emite su factura electrónica
 * ante la DIAN. Autenticación básica con el correo de la cuenta y su token.
 */

const URL_ALEGRA = 'https://api.alegra.com/api/v1'

/** Error de Alegra con su mensaje, para mostrarlo tal cual en el pedido. */
export class ErrorAlegra extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje)
    this.name = 'ErrorAlegra'
  }

  /** 4xx: los datos están mal y reintentar no sirve. 5xx o red: sí. */
  get definitivo() {
    return this.estado >= 400 && this.estado < 500 && this.estado !== 429
  }
}

export interface CredencialesAlegra {
  usuario: string
  token: string
}

export async function pedirAlegra<T>(credenciales: CredencialesAlegra, ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_ALEGRA}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(`${credenciales.usuario}:${credenciales.token}`).toString('base64')}`,
      },
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new ErrorAlegra(503, 'No pudimos conectar con Alegra')
  }
  const datos = (await respuesta.json().catch(() => ({}))) as T & { message?: string; error?: { message?: string } }
  if (!respuesta.ok) {
    const mensaje = datos.message ?? datos.error?.message ?? `Alegra respondió ${respuesta.status}`
    throw new ErrorAlegra(respuesta.status, respuesta.status === 401 ? 'Alegra no aceptó el correo o el token' : mensaje)
  }
  return datos
}

// ─────────────────────────────────────────────────────────────────────────────
// Armado de la factura (puro, sin red: se prueba aparte)
// ─────────────────────────────────────────────────────────────────────────────

export type TipoDocumento = 'CC' | 'NIT' | 'CE' | 'PP'

export interface PedidoAFacturar {
  numero: number
  creadoEn: Date
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string | null
  clienteTipoDocumento: string | null
  clienteDocumento: string | null
  direccionEnvio: { direccion?: string; ciudad?: string } | null
  metodoPago: string
  subtotal: number
  descuento: number
  envio: number
  items: { productoId: string | null; nombre: string; precioUnitario: number; cantidad: number }[]
}

/** Quien compra sin dar documento factura como "consumidor final" (documento 222222222222, como pide la DIAN). */
export const CONSUMIDOR_FINAL = '222222222222'

export function contactoDe(pedido: PedidoAFacturar) {
  const documento = pedido.clienteDocumento?.replace(/[^\dA-Za-z-]/g, '') || CONSUMIDOR_FINAL
  const tipo = (pedido.clienteDocumento ? pedido.clienteTipoDocumento : 'CC') as TipoDocumento
  return {
    name: pedido.clienteNombre,
    identificationObject: { type: tipo, number: documento.replace(/-\d$/, '').replace(/-/g, '') },
    kindOfPerson: tipo === 'NIT' ? 'LEGAL_ENTITY' : 'PERSON_ENTITY',
    regime: 'SIMPLIFIED_REGIME',
    email: pedido.clienteEmail,
    ...(pedido.clienteTelefono ? { phonePrimary: pedido.clienteTelefono } : {}),
    ...(pedido.direccionEnvio?.direccion
      ? { address: { address: pedido.direccionEnvio.direccion, ...(pedido.direccionEnvio.ciudad ? { city: pedido.direccionEnvio.ciudad } : {}) } }
      : {}),
    type: ['client'],
  }
}

const MEDIO_DE_PAGO: Record<string, string> = {
  'contra-entrega': 'CASH',
  transferencia: 'TRANSFER',
  acordar: 'CASH',
  wompi: 'ELECTRONIC_TRANSFER',
  epayco: 'ELECTRONIC_TRANSFER',
  bold: 'CREDIT_CARD',
}

const fecha = (valor: Date) => valor.toISOString().slice(0, 10)

/**
 * La factura en el formato de Alegra. El descuento del cupón se reparte como
 * porcentaje sobre cada producto (no sobre el envío), que es como lo pide la DIAN.
 */
export function facturaDe(pedido: PedidoAFacturar, idCliente: string, idsItems: Map<string, string>, idItemEnvio: string | null) {
  const porcentaje = pedido.descuento > 0 && pedido.subtotal > 0 ? Math.round((pedido.descuento / pedido.subtotal) * 10_000) / 100 : 0
  const items = pedido.items.map((item) => ({
    id: idsItems.get(item.productoId ?? item.nombre)!,
    description: item.nombre,
    price: item.precioUnitario,
    quantity: item.cantidad,
    ...(porcentaje ? { discount: porcentaje } : {}),
  }))
  if (pedido.envio > 0 && idItemEnvio) items.push({ id: idItemEnvio, description: 'Envío', price: pedido.envio, quantity: 1 })

  return {
    date: fecha(pedido.creadoEn),
    dueDate: fecha(pedido.creadoEn),
    client: { id: idCliente },
    items,
    paymentForm: 'CASH',
    paymentMethod: MEDIO_DE_PAGO[pedido.metodoPago] ?? 'CASH',
    observations: `Pedido #${pedido.numero} de la tienda en línea`,
    stamp: { generateStamp: true },
  }
}
