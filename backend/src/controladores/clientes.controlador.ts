import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import type { Prisma } from '../generado/prisma/client.js'
import { entorno } from '../config/entorno.js'
import { noEncontrado } from '../utilidades/errores.js'
import { agruparClientes, normalizarTelefono } from '../utilidades/clientes.js'
import { enviarCorreoDirecto, plantillaCorreo } from '../servicios/correos.servicio.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaCarrito = z.object({
  token: z.string().min(8).max(64),
  nombre: z.string().trim().max(80).optional(),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(160)]).optional(),
  telefono: z.string().trim().max(20).optional(),
  items: z
    .array(
      z.object({
        productoId: z.string().min(1).max(40),
        cantidad: z.coerce.number().int().min(1).max(99),
        variante: z.string().trim().max(80).optional(),
      }),
    )
    .max(50),
})

export const esquemaActualizarCarrito = z.object({
  estado: z.enum(['ABIERTO', 'RECUPERADO', 'DESCARTADO']).optional(),
  contactado: z.boolean().optional(),
})

interface ItemGuardado {
  productoId: string
  nombre: string
  variante: string | null
  cantidad: number
  precio: number
  foto: string | null
  slug: string
}

/** Un carrito cuenta como abandonado después de esto sin cambios. */
const ABANDONADO_TRAS = 60 * 60_000

// ─────────────────────────────────────────────────────────────────────────────
// Tienda pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guarda el carrito de quien ya escribió su correo o celular en el checkout.
 * Los precios salen de la base de datos, igual que en el pedido. Un carrito
 * vacío o sin forma de contacto no se guarda.
 */
export async function guardarCarrito(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const datos = req.body as z.infer<typeof esquemaCarrito>
  const email = datos.email || null
  const telefono = normalizarTelefono(datos.telefono) ? datos.telefono!.trim() : null

  if (!email && !telefono) {
    res.status(204).end()
    return
  }
  if (datos.items.length === 0) {
    await prisma.carritoAbandonado.deleteMany({ where: { tiendaId, token: datos.token, estado: 'ABIERTO' } })
    res.status(204).end()
    return
  }

  const productos = await prisma.producto.findMany({
    where: { tiendaId, id: { in: datos.items.map((item) => item.productoId) }, activo: true },
    select: { id: true, nombre: true, precio: true, fotos: true, slug: true, variantes: true },
  })
  const porId = new Map(productos.map((producto) => [producto.id, producto]))
  const items: ItemGuardado[] = datos.items.flatMap((item) => {
    const producto = porId.get(item.productoId)
    if (!producto) return []
    const variantes = Array.isArray(producto.variantes) ? (producto.variantes as { id: string; nombre: string; precio?: number | string | null }[]) : []
    const variante = item.variante ? variantes.find((otra) => otra.id === item.variante) : undefined
    return [
      {
        productoId: producto.id,
        nombre: producto.nombre,
        variante: variante?.nombre ?? null,
        cantidad: item.cantidad,
        precio: Number(variante?.precio ?? producto.precio),
        foto: producto.fotos[0] ?? null,
        slug: producto.slug,
      },
    ]
  })
  if (items.length === 0) {
    res.status(204).end()
    return
  }
  const subtotal = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
  const contenido = {
    nombre: datos.nombre || null,
    email,
    telefono,
    items: items as unknown as Prisma.InputJsonValue,
    subtotal,
  }

  await prisma.carritoAbandonado.upsert({
    where: { tiendaId_token: { tiendaId, token: datos.token } },
    create: { tiendaId, token: datos.token, ...contenido },
    // Si ya se había recuperado o descartado y vuelve con otro carrito, empieza de nuevo.
    update: { ...contenido, estado: 'ABIERTO', contactadoEn: null, recordatorioEnviado: false },
  })
  res.status(204).end()
}

/** Al crear un pedido: los carritos abiertos de ese correo o celular quedan recuperados. */
export async function marcarCarritosRecuperados(tiendaId: string, email: string, telefono: string | null) {
  await prisma.carritoAbandonado.updateMany({
    where: {
      tiendaId,
      estado: 'ABIERTO',
      OR: [{ email: email.toLowerCase() }, ...(telefono ? [{ telefono }] : [])],
    },
    data: { estado: 'RECUPERADO' },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────

async function tiendaDeLaSesion(req: Request) {
  const tienda = await prisma.tienda.findUnique({ where: { tenantId: req.sesion!.tenantId }, select: { id: true } })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene sitio')
  return tienda.id
}

/** Clientes armados con los pedidos y las citas, con lo que ha comprado cada uno. */
export async function listarClientes(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const [pedidos, citas] = await Promise.all([
    prisma.pedido.findMany({
      where: { tiendaId },
      orderBy: { creadoEn: 'desc' },
      take: 5000,
      select: {
        id: true,
        numero: true,
        clienteNombre: true,
        clienteEmail: true,
        clienteTelefono: true,
        direccionEnvio: true,
        estado: true,
        total: true,
        creadoEn: true,
      },
    }),
    prisma.cita.findMany({
      where: { tiendaId },
      orderBy: { inicio: 'desc' },
      take: 5000,
      select: { id: true, servicio: true, clienteNombre: true, clienteEmail: true, clienteTelefono: true, estado: true, inicio: true },
    }),
  ])

  const clientes = agruparClientes(
    pedidos.map((pedido) => ({
      ...pedido,
      total: Number(pedido.total),
      ciudad: (pedido.direccionEnvio as { ciudad?: string } | null)?.ciudad ?? null,
    })),
    citas,
  )

  const pedidoPorId = new Map(pedidos.map((pedido) => [pedido.id, pedido]))
  const citaPorId = new Map(citas.map((cita) => [cita.id, cita]))
  res.json({
    clientes: clientes.map(({ pedidoIds, citaIds, ...cliente }) => ({
      ...cliente,
      historial: [
        ...pedidoIds.map((id) => pedidoPorId.get(id)!).map((pedido) => ({
          tipo: 'pedido' as const,
          id: pedido.id,
          titulo: `Pedido #${pedido.numero}`,
          estado: pedido.estado,
          total: pedido.total.toString(),
          fecha: pedido.creadoEn,
        })),
        ...citaIds.map((id) => citaPorId.get(id)!).map((cita) => ({ tipo: 'cita' as const, id: cita.id, titulo: cita.servicio, estado: cita.estado, total: null, fecha: cita.inicio })),
      ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
    })),
  })
}

/** Carritos que se quedaron a medias hace más de una hora. */
export async function listarCarritos(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const carritos = await prisma.carritoAbandonado.findMany({
    where: { tiendaId, OR: [{ estado: { not: 'ABIERTO' } }, { actualizadoEn: { lt: new Date(Date.now() - ABANDONADO_TRAS) } }] },
    orderBy: { actualizadoEn: 'desc' },
    take: 300,
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      items: true,
      subtotal: true,
      estado: true,
      contactadoEn: true,
      recordatorioEnviado: true,
      actualizadoEn: true,
    },
  })
  res.json({ carritos: carritos.map((carrito) => ({ ...carrito, subtotal: carrito.subtotal.toString() })) })
}

export async function actualizarCarrito(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaActualizarCarrito>
  const { count } = await prisma.carritoAbandonado.updateMany({
    where: { id: String(req.params.id), tiendaId },
    data: {
      ...(datos.estado ? { estado: datos.estado } : {}),
      ...(datos.contactado !== undefined ? { contactadoEn: datos.contactado ? new Date() : null } : {}),
    },
  })
  if (count === 0) throw noEncontrado('Ese carrito no existe')
  res.status(204).end()
}

/** Para los avisos del panel: carritos de la última semana sin contactar. */
export function contarCarritosAbandonados(tiendaId: string) {
  const ahora = Date.now()
  return prisma.carritoAbandonado.count({
    where: {
      tiendaId,
      estado: 'ABIERTO',
      contactadoEn: null,
      actualizadoEn: { lt: new Date(ahora - ABANDONADO_TRAS), gt: new Date(ahora - 7 * 86_400_000) },
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Recordatorio automático
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cada hora: a quien dejó el carrito con correo hace entre 2 y 26 horas, un
 * correo con lo que eligió. Una sola vez, y sólo en las tiendas que lo activan.
 */
export async function recordarCarritos() {
  const ahora = Date.now()
  const carritos = await prisma.carritoAbandonado.findMany({
    where: {
      estado: 'ABIERTO',
      recordatorioEnviado: false,
      email: { not: null },
      actualizadoEn: { lt: new Date(ahora - 2 * 3_600_000), gt: new Date(ahora - 26 * 3_600_000) },
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      items: true,
      tienda: { select: { nombre: true, ajustes: true, publicada: true, tenant: { select: { subdominio: true } } } },
    },
    take: 300,
  })
  for (const carrito of carritos) {
    const ajustes = (carrito.tienda.ajustes ?? {}) as { recordarCarritos?: boolean }
    if (!ajustes.recordarCarritos || !carrito.tienda.publicada) continue
    const items = carrito.items as unknown as ItemGuardado[]
    const host = `${carrito.tienda.tenant.subdominio}.${entorno.DOMINIO_BASE}`
    const enviado = await enviarCorreoDirecto(
      carrito.email!,
      `Tu carrito en ${carrito.tienda.nombre} te espera`,
      plantillaCorreo(
        `${carrito.nombre ? `${carrito.nombre.split(' ')[0]}, ¿` : '¿'}seguimos con tu pedido?`,
        [
          `Dejaste esto en ${carrito.tienda.nombre}: ${items.map((item) => `${item.cantidad} × ${item.nombre}`).join(', ')}.`,
          'Te lo guardamos por si quieres terminar la compra.',
        ],
        { texto: 'Volver a la tienda', url: `https://${host}/productos/${items[0]?.slug ?? ''}` },
      ),
    )
    if (!enviado) return
    await prisma.carritoAbandonado.update({ where: { id: carrito.id }, data: { recordatorioEnviado: true, contactadoEn: new Date() } })
  }
}
