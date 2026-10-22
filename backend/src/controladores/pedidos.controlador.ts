import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { Prisma } from '../generado/prisma/client.js'
import { ErrorHttp, noEncontrado, solicitudInvalida } from '../utilidades/errores.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

export const METODOS_PAGO = ['contra-entrega', 'transferencia', 'acordar'] as const

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
    items: pedido.items.map((item) => ({
      ...item,
      precioUnitario: item.precioUnitario.toString(),
      subtotal: item.subtotal.toString(),
    })),
  }
}

/** Descuento de un cupón sobre el subtotal. Lo completa la fase de cupones. */
async function aplicarCupon(
  _tx: Prisma.TransactionClient,
  _tiendaId: string,
  _codigo: string | undefined,
  _subtotal: number,
): Promise<{ descuento: number; codigo: string | null }> {
  return { descuento: 0, codigo: null }
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
    select: { id: true, nombre: true, precio: true, stock: true, fotos: true },
  })
  const porId = new Map(productos.map((producto) => [producto.id, producto]))

  const items = [...lineas.values()].map((linea) => {
    const producto = porId.get(linea.productoId)
    if (!producto) throw solicitudInvalida('Uno de los productos del carrito ya no está disponible')
    const precio = Number(producto.precio)
    return {
      productoId: producto.id,
      nombreProducto: producto.nombre,
      variante: linea.variante ?? null,
      foto: producto.fotos[0] ?? null,
      cantidad: linea.cantidad,
      precioUnitario: precio,
      subtotal: precio * linea.cantidad,
    }
  })

  // Stock por producto, sumando sus líneas.
  const pedidoPorProducto = new Map<string, number>()
  for (const item of items) {
    pedidoPorProducto.set(item.productoId, (pedidoPorProducto.get(item.productoId) ?? 0) + item.cantidad)
  }
  for (const [productoId, cantidad] of pedidoPorProducto) {
    const producto = porId.get(productoId)!
    if (producto.stock < cantidad) {
      throw new ErrorHttp(
        409,
        producto.stock === 0
          ? `"${producto.nombre}" se agotó`
          : `Sólo quedan ${producto.stock} unidades de "${producto.nombre}"`,
        'SIN_STOCK',
      )
    }
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

        const { descuento, codigo } = await aplicarCupon(tx, tiendaId, datos.cupon, subtotal)
        const envio = calcularEnvio(ajustes, subtotal - descuento)
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
            items: { create: items },
          },
          select: camposPedido,
        })
      })

      res.status(201).json({ pedido: serializarPedido(pedido) })
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
      select: { estado: true, items: { select: { productoId: true, cantidad: true, nombreProducto: true } } },
    })
    if (!actual) throw noEncontrado('Ese pedido no existe')

    if (datos.estado && datos.estado !== actual.estado) {
      const liberaba = SIN_STOCK_APARTADO.has(actual.estado)
      const libera = SIN_STOCK_APARTADO.has(datos.estado)
      for (const item of actual.items) {
        if (!item.productoId) continue
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
