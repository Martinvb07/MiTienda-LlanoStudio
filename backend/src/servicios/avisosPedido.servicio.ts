import { prisma } from '../config/prisma.js'
import { entorno } from '../config/entorno.js'
import { registro } from '../utilidades/registro.js'
import { enviarCorreoDirecto, plantillaCorreo } from './correos.servicio.js'
import { urlPanel } from './suscripciones.servicio.js'

/**
 * Correos alrededor de un pedido: al comprador (recibido, pagado, enviado,
 * entregado, cancelado) y a la dueña cuando un producto se está agotando.
 * Todo corre fuera del request: si el correo falla, la compra ya quedó hecha.
 */

/** Unidades desde las que un producto cuenta como "por agotarse", si la tienda no dice otra cosa. */
export const STOCK_MINIMO_POR_DEFECTO = 3

const pesos = (valor: { toString(): string } | number) =>
  `$${Number(valor.toString()).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`

/** Dirección pública de la tienda: su dominio propio principal si lo tiene verificado. */
export async function hostPublico(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subdominio: true, dominios: { where: { verificado: true }, orderBy: { esPrincipal: 'desc' }, take: 1, select: { dominio: true } } },
  })
  return tenant?.dominios[0]?.dominio ?? `${tenant?.subdominio ?? 'tienda'}.${entorno.DOMINIO_BASE}`
}

type EstadoAvisado = 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'

const TEXTOS: Record<EstadoAvisado, { asunto: (numero: number) => string; titulo: string; parrafo: string }> = {
  PENDIENTE: {
    asunto: (numero) => `Recibimos tu pedido #${numero}`,
    titulo: '¡Gracias por tu compra!',
    parrafo: 'Recibimos tu pedido y ya lo estamos revisando. Te escribimos de nuevo cuando salga.',
  },
  PAGADO: {
    asunto: (numero) => `Tu pago del pedido #${numero} quedó confirmado`,
    titulo: 'Pago confirmado',
    parrafo: 'Ya recibimos tu pago. Ahora preparamos tu pedido.',
  },
  ENVIADO: {
    asunto: (numero) => `Tu pedido #${numero} va en camino`,
    titulo: 'Tu pedido va en camino',
    parrafo: 'Tu pedido ya salió y pronto lo tienes contigo.',
  },
  ENTREGADO: {
    asunto: (numero) => `Tu pedido #${numero} fue entregado`,
    titulo: '¡Pedido entregado!',
    parrafo: 'Esperamos que lo disfrutes. Si algo no quedó bien, respóndenos y lo arreglamos.',
  },
  CANCELADO: {
    asunto: (numero) => `Tu pedido #${numero} fue cancelado`,
    titulo: 'Pedido cancelado',
    parrafo: 'Tu pedido fue cancelado. Si no esperabas esto o ya habías pagado, escríbenos y lo resolvemos.',
  },
}

export const esEstadoAvisado = (estado: string): estado is EstadoAvisado => estado in TEXTOS

/** Le cuenta al comprador cómo va su pedido. No hace nada si la tienda apagó estos correos. */
export async function avisarComprador(pedidoId: string, estado: EstadoAvisado): Promise<void> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      numero: true,
      clienteNombre: true,
      clienteEmail: true,
      total: true,
      transportadora: true,
      guia: true,
      items: { select: { nombreProducto: true, variante: true, cantidad: true } },
      tienda: { select: { nombre: true, tenantId: true, ajustes: true } },
    },
  })
  if (!pedido?.clienteEmail) return
  const ajustes = (pedido.tienda.ajustes ?? {}) as { correosPedido?: boolean; whatsapp?: string }
  if (ajustes.correosPedido === false) return

  const textos = TEXTOS[estado]
  const nombre = pedido.clienteNombre.split(' ')[0]
  const parrafos = [`Hola ${nombre}. ${textos.parrafo}`]
  if (estado === 'PENDIENTE') {
    parrafos.push(
      pedido.items.map((item) => `${item.cantidad} × ${item.nombreProducto}${item.variante ? ` (${item.variante})` : ''}`).join(' · '),
      `Total: ${pesos(pedido.total)}`,
    )
  }
  if (estado === 'ENVIADO' && pedido.guia) {
    parrafos.push(`${pedido.transportadora ? `Transportadora: ${pedido.transportadora}. ` : ''}Número de guía: ${pedido.guia}.`)
  }
  parrafos.push(`Número de pedido: #${pedido.numero}.`)

  const host = await hostPublico(pedido.tienda.tenantId)
  await enviarCorreoDirecto(
    pedido.clienteEmail,
    `${textos.asunto(pedido.numero)} · ${pedido.tienda.nombre}`,
    plantillaCorreo(
      textos.titulo,
      parrafos,
      estado === 'CANCELADO' ? { texto: 'Ir a la tienda', url: `https://${host}` } : { texto: 'Ver mi pedido', url: `https://${host}/pedido/${pedidoId}` },
      pedido.tienda.nombre,
    ),
  )
}

/**
 * Después de una venta: los productos que con ella bajaron del mínimo le
 * llegan a la dueña en un solo correo. Sólo avisa al cruzar la raya, así que
 * no repite el aviso con cada venta siguiente.
 */
export async function revisarStockTrasVenta(tiendaId: string, vendidos: { productoId: string | null; cantidad: number }[]): Promise<void> {
  const cantidades = new Map<string, number>()
  for (const item of vendidos) if (item.productoId) cantidades.set(item.productoId, (cantidades.get(item.productoId) ?? 0) + item.cantidad)
  if (cantidades.size === 0) return

  const tienda = await prisma.tienda.findUnique({ where: { id: tiendaId }, select: { tenantId: true, nombre: true, ajustes: true } })
  if (!tienda) return
  const ajustes = (tienda.ajustes ?? {}) as { stockMinimo?: number; alertasStock?: boolean }
  if (ajustes.alertasStock === false) return
  const minimo = ajustes.stockMinimo ?? STOCK_MINIMO_POR_DEFECTO

  const productos = await prisma.producto.findMany({
    where: { tiendaId, id: { in: [...cantidades.keys()] } },
    select: { id: true, nombre: true, stock: true },
  })
  const cruzaron = productos.filter((producto) => producto.stock <= minimo && producto.stock + cantidades.get(producto.id)! > minimo)
  if (cruzaron.length === 0) return

  const duenas = await prisma.usuario.findMany({
    where: { tenantId: tienda.tenantId, activo: true, rol: { in: ['PROPIETARIO', 'ADMINISTRADOR'] } },
    select: { email: true },
  })
  const agotados = cruzaron.filter((producto) => producto.stock === 0)
  const html = plantillaCorreo(
    agotados.length === cruzaron.length ? 'Se agotó un producto' : 'Se te están acabando unos productos',
    [
      ...cruzaron.map((producto) => (producto.stock === 0 ? `${producto.nombre}: agotado.` : `${producto.nombre}: quedan ${producto.stock}.`)),
      'Repón el inventario para no perder ventas. Los agotados dejan de poderse comprar en la tienda.',
    ],
    { texto: 'Ver mis productos', url: `${urlPanel()}/panel/productos` },
  )
  for (const { email } of duenas) {
    await enviarCorreoDirecto(email, `Inventario bajo en ${tienda.nombre}`, html).catch((error: unknown) =>
      registro.warn({ err: error, tiendaId }, 'No se pudo avisar el inventario bajo'),
    )
  }
}
