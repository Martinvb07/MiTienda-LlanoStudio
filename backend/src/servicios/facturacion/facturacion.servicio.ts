import type { Prisma } from '../../generado/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { cifrar, descifrar } from '../../utilidades/cifrado.js'
import { registro } from '../../utilidades/registro.js'
import { contactoDe, ErrorAlegra, facturaDe, pedirAlegra, type CredencialesAlegra, type PedidoAFacturar } from './alegra.js'
import { encolarFactura } from '../../colas/index.js'

/**
 * Factura electrónica de los pedidos, con la cuenta de Alegra de cada tienda.
 * La emisión corre en la cola `facturas` (proceso de trabajadores): Alegra
 * puede tardar varios segundos en validar con la DIAN y no debe frenar al panel.
 */

const CLAVE_ENVIO = '__envio'

export const guardarSecretoFacturacion = (token: string) => cifrar(token)

export async function credencialesDe(tiendaId: string): Promise<(CredencialesAlegra & { automatica: boolean; activa: boolean; items: Record<string, string> }) | null> {
  const fila = await prisma.facturacionTienda.findUnique({ where: { tiendaId } })
  if (!fila) return null
  return { usuario: fila.usuario, token: descifrar(fila.secreto), automatica: fila.automatica, activa: fila.activa, items: (fila.items ?? {}) as Record<string, string> }
}

/** Comprueba que el correo y el token entren a Alegra. Lanza ErrorAlegra si no. */
export async function probarCredenciales(credenciales: CredencialesAlegra): Promise<string> {
  const empresa = await pedirAlegra<{ name?: string }>(credenciales, '/company')
  return empresa.name ?? 'tu empresa'
}

const idDe = (valor: { id?: string | number }) => String(valor.id)

/** Busca al cliente por documento en Alegra o lo crea. */
async function idCliente(credenciales: CredencialesAlegra, pedido: PedidoAFacturar): Promise<string> {
  const contacto = contactoDe(pedido)
  const encontrados = await pedirAlegra<{ id: string | number }[]>(
    credenciales,
    `/contacts?identification=${encodeURIComponent(contacto.identificationObject.number)}&limit=1`,
  ).catch(() => [])
  if (Array.isArray(encontrados) && encontrados[0]) return idDe(encontrados[0])
  return idDe(await pedirAlegra<{ id: string | number }>(credenciales, '/contacts', { metodo: 'POST', cuerpo: contacto }))
}

/** Los productos del pedido como ítems de Alegra, creados una sola vez por tienda. */
async function idsItems(credenciales: CredencialesAlegra, tiendaId: string, conocidos: Record<string, string>, pedido: PedidoAFacturar) {
  const ids = new Map(Object.entries(conocidos))
  const nuevos: Record<string, string> = {}
  const crear = async (clave: string, nombre: string, precio: number) => {
    if (ids.has(clave)) return
    const item = await pedirAlegra<{ id: string | number }>(credenciales, '/items', {
      metodo: 'POST',
      cuerpo: { name: nombre.slice(0, 150), price: [{ price: precio }], type: clave === CLAVE_ENVIO ? 'service' : 'product' },
    })
    ids.set(clave, idDe(item))
    nuevos[clave] = idDe(item)
  }
  for (const item of pedido.items) await crear(item.productoId ?? item.nombre, item.nombre, item.precioUnitario)
  if (pedido.envio > 0) await crear(CLAVE_ENVIO, 'Envío', pedido.envio)

  if (Object.keys(nuevos).length) {
    await prisma.facturacionTienda.update({
      where: { tiendaId },
      data: { items: { ...conocidos, ...nuevos } as Prisma.InputJsonValue },
    })
  }
  return ids
}

/** Emite la factura de un pedido. Idempotente: si ya tiene una, no hace otra. */
export async function emitirFactura(pedidoId: string): Promise<void> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      tiendaId: true,
      numero: true,
      creadoEn: true,
      clienteNombre: true,
      clienteEmail: true,
      clienteTelefono: true,
      clienteTipoDocumento: true,
      clienteDocumento: true,
      direccionEnvio: true,
      metodoPago: true,
      subtotal: true,
      descuento: true,
      envio: true,
      estado: true,
      facturaId: true,
      items: { select: { productoId: true, nombreProducto: true, variante: true, precioUnitario: true, cantidad: true } },
    },
  })
  if (!pedido || pedido.facturaId) return
  if (pedido.estado === 'CANCELADO' || pedido.estado === 'REEMBOLSADO') throw new ErrorAlegra(400, 'Un pedido cancelado no se factura')

  const credenciales = await credencialesDe(pedido.tiendaId)
  if (!credenciales?.activa) throw new ErrorAlegra(400, 'La factura electrónica no está conectada')

  const datos: PedidoAFacturar = {
    numero: pedido.numero,
    creadoEn: pedido.creadoEn,
    clienteNombre: pedido.clienteNombre,
    clienteEmail: pedido.clienteEmail,
    clienteTelefono: pedido.clienteTelefono,
    clienteTipoDocumento: pedido.clienteTipoDocumento,
    clienteDocumento: pedido.clienteDocumento,
    direccionEnvio: pedido.direccionEnvio as PedidoAFacturar['direccionEnvio'],
    metodoPago: pedido.metodoPago,
    subtotal: Number(pedido.subtotal),
    descuento: Number(pedido.descuento),
    envio: Number(pedido.envio),
    items: pedido.items.map((item) => ({
      productoId: item.productoId,
      nombre: item.variante ? `${item.nombreProducto} (${item.variante})` : item.nombreProducto,
      precioUnitario: Number(item.precioUnitario),
      cantidad: item.cantidad,
    })),
  }

  const cliente = await idCliente(credenciales, datos)
  const items = await idsItems(credenciales, pedido.tiendaId, credenciales.items, datos)
  const factura = await pedirAlegra<{ id: string | number; numberTemplate?: { fullNumber?: string; number?: string | number } }>(credenciales, '/invoices', {
    metodo: 'POST',
    cuerpo: facturaDe(datos, cliente, items, items.get(CLAVE_ENVIO) ?? null),
  })

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: {
      facturaEstado: 'EMITIDA',
      facturaId: idDe(factura),
      facturaNumero: factura.numberTemplate?.fullNumber ?? String(factura.numberTemplate?.number ?? factura.id),
      facturaError: null,
      facturaEn: new Date(),
    },
  })
  registro.info({ pedidoId, factura: factura.id }, 'Factura electrónica emitida')
}

export async function marcarErrorFactura(pedidoId: string, mensaje: string): Promise<void> {
  await prisma.pedido.update({ where: { id: pedidoId }, data: { facturaEstado: 'ERROR', facturaError: mensaje.slice(0, 500) } })
}

/**
 * Factura automática: cuando un pedido queda pagado o entregado y la tienda la
 * tiene activada. Nunca lanza: si falla, el pedido sigue su curso.
 */
export function facturarSiCorresponde(pedidoId: string, tiendaId: string): void {
  void (async () => {
    const configuracion = await prisma.facturacionTienda.findUnique({ where: { tiendaId }, select: { activa: true, automatica: true } })
    if (!configuracion?.activa || !configuracion.automatica) return
    const { count } = await prisma.pedido.updateMany({
      where: { id: pedidoId, facturaId: null, facturaEstado: null },
      data: { facturaEstado: 'PENDIENTE' },
    })
    if (count > 0) await encolarFactura(pedidoId)
  })().catch((error: unknown) => registro.warn({ err: error, pedidoId }, 'No se pudo encolar la factura automática'))
}
