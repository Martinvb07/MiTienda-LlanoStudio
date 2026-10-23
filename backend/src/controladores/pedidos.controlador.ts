import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { Prisma } from '../generado/prisma/client.js'
import { ErrorHttp, noEncontrado, solicitudInvalida } from '../utilidades/errores.js'
import { evaluarCupon } from './cupones.controlador.js'
import { armarCheckout, leerSecretos, nuevaReferenciaPago } from '../servicios/pasarelas.servicio.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

export const METODOS_PAGO = ['contra-entrega', 'transferencia', 'acordar', 'wompi', 'epayco', 'bold'] as const
const EN_LINEA = { wompi: 'WOMPI', epayco: 'EPAYCO', bold: 'BOLD' } as const

export const esquemaPedidoPublico = z.object({
  cliente: z.object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre').max(80),
    email: z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160),
    telefono: z.string().trim().min(7, 'Escribe un teléfono de contacto').max(20),
    ciudad: z.string().trim().min(2, 'Escribe tu ciudad').max(80),
    direccion: z.string().trim().min(4, 'Escribe la dirección de entrega').max(200),
    detalle: z.string().trim().max(120).optional(),
    notas: z.string().trim().max(500).optional(),
  }),
  items: z
    .array(
      z.object({
        productoId: z.string().min(1).max(40),
        cantidad: z.coerce.number().int().min(1).max(99),
        variante: z.string().trim().max(80).optional(),
      }),
    )
    .min(1, 'El carrito está vacío')
    .max(50),
  metodoPago: z.enum(METODOS_PAGO),
  canal: z.enum(['web', 'whatsapp']).default('web'),
  cupon: z.string().trim().toUpperCase().max(30).optional(),
})

const ESTADOS = ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'REEMBOLSADO'] as const

export const esquemaActualizarPedido = z.object({
  estado: z.enum(ESTADOS).optional(),
  notaInterna: z.string().trim().max(1000).nullable().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

interface AjustesVenta {
  costoEnvio?: number
  envioGratisDesde?: number
  pedidoMinimo?: number
  pagoContraEntrega?: boolean
  pagoTransferencia?: boolean
}

/** Costo de envío según los ajustes de la tienda y el subtotal ya descontado. */
export function calcularEnvio(ajustes: AjustesVenta, subtotal: number): number {
  const costo = ajustes.costoEnvio ?? 0
  if (costo <= 0) return 0
  if (ajustes.envioGratisDesde && subtotal >= ajustes.envioGratisDesde) return 0
  return costo
}

const camposPedido = {
  id: true,
  numero: true,
  clienteNombre: true,
  clienteEmail: true,
  clienteTelefono: true,
  direccionEnvio: true,
  notas: true,
  canal: true,
  metodoPago: true,
  cupon: true,
  notaInterna: true,
  estado: true,
  subtotal: true,
  descuento: true,
  envio: true,
  total: true,
  creadoEn: true,
  actualizadoEn: true,
  items: {
    select: {
      id: true,
      productoId: true,
      nombreProducto: true,
      variante: true,
      foto: true,
      precioUnitario: true,
      cantidad: true,
      subtotal: true,
      producto: { select: { slug: true } },
    },
  },
} as const

type PedidoBd = Prisma.PedidoGetPayload<{ select: typeof camposPedido }>

/** Importes como texto, igual que en productos: sin redondeos de float. */
function serializarPedido(pedido: PedidoBd) {
  return {
    ...pedido,
    subtotal: pedido.subtotal.toString(),
    descuento: pedido.descuento.toString(),
    envio: pedido.envio.toString(),
    total: pedido.total.toString(),
    items: pedido.items.map(({ producto, ...item }) => ({
      ...item,
      slug: producto?.slug ?? null,
      precioUnitario: item.precioUnitario.toString(),
      subtotal: item.subtotal.toString(),
    })),
  }
}

interface Variante {
  id: string
  nombre: string
  precio?: number | string | null
  stock: number
}

const variantesDe = (valor: unknown): Variante[] => (Array.isArray(valor) ? (valor as Variante[]) : [])

/**
 * Mueve unidades de una variante dentro del JSON del producto. Bloquea la fila
 * (FOR UPDATE) para que dos pedidos simultáneos no lean el mismo stock.
 * `delta` negativo descuenta; devuelve false si no alcanza.
 */
async function moverStockVariante(
  tx: Prisma.TransactionClient,
  productoId: string,
  varianteNombreOId: string,
  delta: number,
): Promise<boolean> {
  const [fila] = await tx.$queryRaw<{ variantes: unknown }[]>`SELECT variantes FROM productos WHERE id = ${productoId} FOR UPDATE`
  const variantes = variantesDe(fila?.variantes)
  const variante = variantes.find((v) => v.id === varianteNombreOId || v.nombre === varianteNombreOId)
  if (!variante) return delta > 0
  if (variante.stock + delta < 0) return false
  variante.stock += delta
  await tx.producto.update({
    where: { id: productoId },
    data: { variantes: variantes as unknown as Prisma.InputJsonValue, stock: { increment: delta } },
  })
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// Tienda pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un pedido desde el carrito de la tienda del Host actual.
 *
 * Los precios, el envío y el total se calculan aquí con lo que hay en la base
 * de datos: del navegador sólo se aceptan ids y cantidades. El stock se
 * descuenta en la misma transacción, con una condición que impide venderlo
 * por debajo de cero aunque dos clientes compren a la vez.
 */
export async function crearPedidoPublico(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const datos = req.body as z.infer<typeof esquemaPedidoPublico>

  const tienda = await prisma.tienda.findUnique({
    where: { id: tiendaId },
    select: { publicada: true, ajustes: true },
  })
  if (!tienda?.publicada) throw noEncontrado('Esta tienda no está recibiendo pedidos')
  const ajustes = (tienda.ajustes ?? {}) as AjustesVenta

  if (datos.metodoPago === 'contra-entrega' && !ajustes.pagoContraEntrega) {
    throw solicitudInvalida('Esta tienda no recibe pago contra entrega')
  }
  if (datos.metodoPago === 'transferencia' && !ajustes.pagoTransferencia) {
    throw solicitudInvalida('Esta tienda no recibe transferencias')
  }
  const proveedor = datos.metodoPago in EN_LINEA ? EN_LINEA[datos.metodoPago as keyof typeof EN_LINEA] : null
  const pasarela = proveedor
    ? await prisma.pasarelaTienda.findUnique({ where: { tiendaId_proveedor: { tiendaId, proveedor } } })
    : null
  if (proveedor && !pasarela?.activa) throw solicitudInvalida('Esta tienda no recibe ese medio de pago')

  // Si el mismo producto viene en dos líneas con la misma variante, se suman.
  const lineas = new Map<string, { productoId: string; cantidad: number; variante?: string }>()
  for (const item of datos.items) {
    const clave = `${item.productoId}|${item.variante ?? ''}`
    const previa = lineas.get(clave)
    lineas.set(clave, { ...item, cantidad: (previa?.cantidad ?? 0) + item.cantidad })
  }

  const ids = [...new Set([...lineas.values()].map((linea) => linea.productoId))]
  const productos = await prisma.producto.findMany({
    where: { tiendaId, id: { in: ids }, activo: true },
    select: { id: true, nombre: true, precio: true, stock: true, fotos: true, variantes: true },
  })
  const porId = new Map(productos.map((producto) => [producto.id, producto]))

  const sinStock = (nombre: string, quedan: number) =>
    new ErrorHttp(409, quedan === 0 ? `"${nombre}" se agotó` : `Sólo quedan ${quedan} unidades de "${nombre}"`, 'SIN_STOCK')

  const items = [...lineas.values()].map((linea) => {
    const producto = porId.get(linea.productoId)
    if (!producto) throw solicitudInvalida('Uno de los productos del carrito ya no está disponible')
    const variantes = variantesDe(producto.variantes)
    // Un producto con variantes exige elegir una que exista.
    const variante = variantes.length ? variantes.find((v) => v.id === linea.variante) : undefined
    if (variantes.length && !variante) throw solicitudInvalida(`Elige una opción de "${producto.nombre}"`)
    if (variante && variante.stock < linea.cantidad) throw sinStock(`${producto.nombre} (${variante.nombre})`, variante.stock)
    const precio = Number(variante?.precio ?? producto.precio)
    return {
      productoId: producto.id,
      varianteId: variante?.id ?? null,
      nombreProducto: producto.nombre,
      variante: variante?.nombre ?? null,
      foto: producto.fotos[0] ?? null,
      cantidad: linea.cantidad,
      precioUnitario: precio,
      subtotal: precio * linea.cantidad,
    }
  })

  // Productos sin variantes: stock del producto, sumando sus líneas.
  const pedidoPorProducto = new Map<string, number>()
  for (const item of items) {
    if (item.varianteId) continue
    pedidoPorProducto.set(item.productoId, (pedidoPorProducto.get(item.productoId) ?? 0) + item.cantidad)
  }
  for (const [productoId, cantidad] of pedidoPorProducto) {
    const producto = porId.get(productoId)!
    if (producto.stock < cantidad) throw sinStock(producto.nombre, producto.stock)
  }

  const subtotal = items.reduce((suma, item) => suma + item.subtotal, 0)
  if (ajustes.pedidoMinimo && subtotal < ajustes.pedidoMinimo) {
    throw solicitudInvalida(`El pedido mínimo es de $${ajustes.pedidoMinimo.toLocaleString('es-CO')}`)
  }

  // El número consecutivo puede chocar si entran dos pedidos a la vez: se
  // reintenta con el siguiente.
  for (let intento = 0; intento < 4; intento++) {
    try {
      const pedido = await prisma.$transaction(async (tx) => {
        for (const [productoId, cantidad] of pedidoPorProducto) {
          const { count } = await tx.producto.updateMany({
            where: { id: productoId, tiendaId, stock: { gte: cantidad } },
            data: { stock: { decrement: cantidad } },
          })
          if (count === 0) {
            throw new ErrorHttp(409, `"${porId.get(productoId)!.nombre}" se agotó mientras comprabas`, 'SIN_STOCK')
          }
        }
        for (const item of items) {
          if (!item.varianteId) continue
          if (!(await moverStockVariante(tx, item.productoId, item.varianteId, -item.cantidad))) {
            throw new ErrorHttp(409, `"${item.nombreProducto} (${item.variante})" se agotó mientras comprabas`, 'SIN_STOCK')
          }
        }

        // El cupón se valida otra vez aquí y su uso se cuenta en la misma
        // transacción: si se agota justo ahora, el pedido no sale con descuento.
        let descuento = 0
        let codigo: string | null = null
        let envioGratis = false
        if (datos.cupon) {
          const cupon = await evaluarCupon(tx, tiendaId, datos.cupon, subtotal)
          const { count } = await tx.cupon.updateMany({
            where: { id: cupon.id, OR: [{ usosMaximos: null }, { usos: { lt: tx.cupon.fields.usosMaximos } }] },
            data: { usos: { increment: 1 } },
          })
          if (count === 0) throw solicitudInvalida('Ese código ya se usó todas las veces')
          descuento = cupon.descuento
          codigo = cupon.codigo
          envioGratis = cupon.envioGratis
        }
        const envio = envioGratis ? 0 : calcularEnvio(ajustes, subtotal - descuento)
        const ultimo = await tx.pedido.findFirst({
          where: { tiendaId },
          orderBy: { numero: 'desc' },
          select: { numero: true },
        })

        return tx.pedido.create({
          data: {
            tiendaId,
            numero: (ultimo?.numero ?? 1000) + 1,
            clienteNombre: datos.cliente.nombre,
            clienteEmail: datos.cliente.email,
            clienteTelefono: datos.cliente.telefono,
            direccionEnvio: {
              ciudad: datos.cliente.ciudad,
              direccion: datos.cliente.direccion,
              ...(datos.cliente.detalle ? { detalle: datos.cliente.detalle } : {}),
            },
            notas: datos.cliente.notas || null,
            canal: datos.canal,
            metodoPago: datos.metodoPago,
            cupon: codigo,
            subtotal,
            descuento,
            envio,
            total: subtotal - descuento + envio,
            items: { create: items.map(({ varianteId: _varianteId, ...item }) => item) },
          },
          select: camposPedido,
        })
      })

      // Pago en línea: se registra el intento y se arma el checkout de la pasarela.
      let checkout = null
      if (proveedor && pasarela) {
        const referencia = nuevaReferenciaPago(pedido.numero)
        await prisma.pago.create({ data: { pedidoId: pedido.id, proveedor, referencia, monto: pedido.total } })
        const host = String(req.headers['x-mitienda-host'] ?? req.headers.host ?? '')
        checkout = armarCheckout(
          proveedor,
          { llavePublica: pasarela.llavePublica, modoPrueba: pasarela.modoPrueba, secretos: leerSecretos(pasarela.secretos) },
          {
            referencia,
            monto: Number(pedido.total),
            descripcion: `Pedido #${pedido.numero}`,
            correo: pedido.clienteEmail,
            nombre: pedido.clienteNombre,
            retorno: `https://${host}/pago?ref=${referencia}`,
          },
        )
      }

      res.status(201).json({ pedido: serializarPedido(pedido), checkout })
      return
    } catch (error) {
      const choque = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      if (!choque || intento === 3) throw error
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────

async function tiendaDeLaSesion(req: Request) {
  const tienda = await prisma.tienda.findUnique({
    where: { tenantId: req.sesion!.tenantId },
    select: { id: true },
  })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene tienda')
  return tienda.id
}

export async function listarPedidosPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const pedidos = await prisma.pedido.findMany({
    where: { tiendaId },
    orderBy: { creadoEn: 'desc' },
    take: 500,
    select: camposPedido,
  })
  res.json({ pedidos: pedidos.map(serializarPedido) })
}

/** Estados en los que el pedido no tiene la mercancía apartada. */
const SIN_STOCK_APARTADO = new Set(['CANCELADO', 'REEMBOLSADO'])

/**
 * Cambia el estado o la nota interna. Cancelar o reembolsar devuelve las
 * unidades al inventario; reactivar un pedido cancelado las vuelve a apartar,
 * si todavía hay.
 */
export async function actualizarPedidoPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const id = req.params.id as string
  const datos = req.body as z.infer<typeof esquemaActualizarPedido>

  const pedido = await prisma.$transaction(async (tx) => {
    const actual = await tx.pedido.findFirst({
      where: { id, tiendaId },
      select: {
        estado: true,
        items: { select: { productoId: true, cantidad: true, nombreProducto: true, variante: true } },
      },
    })
    if (!actual) throw noEncontrado('Ese pedido no existe')

    if (datos.estado && datos.estado !== actual.estado) {
      const liberaba = SIN_STOCK_APARTADO.has(actual.estado)
      const libera = SIN_STOCK_APARTADO.has(datos.estado)
      for (const item of actual.items) {
        // Sólo cruzar entre "apartado" y "liberado" mueve inventario.
        if (!item.productoId || liberaba === libera) continue
        if (item.variante) {
          const ok = await moverStockVariante(tx, item.productoId, item.variante, libera ? item.cantidad : -item.cantidad)
          if (!ok && !libera) {
            throw new ErrorHttp(409, `No hay stock de "${item.nombreProducto} (${item.variante})" para reactivar el pedido`, 'SIN_STOCK')
          }
          continue
        }
        if (!liberaba && libera) {
          await tx.producto.updateMany({
            where: { id: item.productoId, tiendaId },
            data: { stock: { increment: item.cantidad } },
          })
        } else if (liberaba && !libera) {
          const { count } = await tx.producto.updateMany({
            where: { id: item.productoId, tiendaId, stock: { gte: item.cantidad } },
            data: { stock: { decrement: item.cantidad } },
          })
          if (count === 0) {
            throw new ErrorHttp(409, `No hay stock de "${item.nombreProducto}" para reactivar el pedido`, 'SIN_STOCK')
          }
        }
      }
    }

    return tx.pedido.update({
      where: { id },
      data: {
        ...(datos.estado ? { estado: datos.estado } : {}),
        ...(datos.notaInterna !== undefined ? { notaInterna: datos.notaInterna || null } : {}),
      },
      select: camposPedido,
    })
  })

  res.json({ pedido: serializarPedido(pedido) })
}
