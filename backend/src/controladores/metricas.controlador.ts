import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { Prisma } from '../generado/prisma/client.js'
import { planDeLaSesion, tiendaDeLaSesion } from '../servicios/sesion.servicio.js'

/** Los días se cuentan en hora de Colombia: una venta a las 11 p. m. es de ese día. */
const HOY_COLOMBIA = Prisma.sql`(now() AT TIME ZONE 'America/Bogota')::date`

export const esquemaVisita = z.object({
  tipo: z.enum(['pagina', 'producto', 'whatsapp']),
  /** Primera página del visitante en el día. */
  nueva: z.boolean().default(false),
  producto: z
    .string()
    .regex(/^[a-z0-9-]{1,80}$/)
    .optional(),
})

/**
 * Suma una visita (o una vista de producto, o un clic a WhatsApp) al renglón
 * del día. Un solo INSERT … ON CONFLICT: atómico aunque lleguen muchas a la vez.
 */
export async function registrarVisita(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const { tipo, nueva, producto } = req.body as z.infer<typeof esquemaVisita>

  const visitas = tipo === 'whatsapp' ? 0 : 1
  const visitantes = nueva ? 1 : 0
  const whatsapp = tipo === 'whatsapp' ? 1 : 0
  const vistaInicial = tipo === 'producto' && producto ? { [producto]: 1 } : {}

  await prisma.$executeRaw`
    INSERT INTO visitas_diarias (id, "tiendaId", fecha, visitas, visitantes, "clicsWhatsapp", "vistasProducto")
    VALUES (${`v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`}, ${tiendaId}, ${HOY_COLOMBIA},
            ${visitas}, ${visitantes}, ${whatsapp}, ${JSON.stringify(vistaInicial)}::jsonb)
    ON CONFLICT ("tiendaId", fecha) DO UPDATE SET
      visitas = visitas_diarias.visitas + ${visitas},
      visitantes = visitas_diarias.visitantes + ${visitantes},
      "clicsWhatsapp" = visitas_diarias."clicsWhatsapp" + ${whatsapp},
      "vistasProducto" = CASE WHEN ${tipo === 'producto' && Boolean(producto)}
        THEN jsonb_set(
          visitas_diarias."vistasProducto",
          ARRAY[${producto ?? ''}]::text[],
          to_jsonb(COALESCE((visitas_diarias."vistasProducto" ->> ${producto ?? ''})::int, 0) + 1)
        )
        ELSE visitas_diarias."vistasProducto" END
  `
  res.status(204).end()
}

export const esquemaConsultaMetricas = z.object({ dias: z.coerce.number().int().min(1).max(365).default(30) })

/** Estadísticas del panel. Los días que se pueden pedir dependen del plan. */
export async function obtenerMetricas(req: Request, res: Response): Promise<void> {
  const [tiendaId, plan] = await Promise.all([tiendaDeLaSesion(req), planDeLaSesion(req)])
  const dias = Math.min(Number(req.query.dias) || 30, plan.diasMetricas)

  const desde = new Date()
  desde.setUTCHours(0, 0, 0, 0)
  desde.setUTCDate(desde.getUTCDate() - (dias - 1))
  // Mismo período inmediatamente anterior, para la comparación.
  const antes = new Date(desde)
  antes.setUTCDate(antes.getUTCDate() - dias)

  const [visitas, ventasPorDia, previas, pedidosPrevios, items] = await Promise.all([
    prisma.visitaDiaria.findMany({ where: { tiendaId, fecha: { gte: desde } }, orderBy: { fecha: 'asc' } }),
    prisma.$queryRaw<{ fecha: Date; pedidos: bigint; ventas: Prisma.Decimal | null }[]>`
      SELECT ("creadoEn" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota')::date AS fecha,
             count(*) AS pedidos, sum(total) AS ventas
      FROM pedidos
      WHERE "tiendaId" = ${tiendaId} AND "creadoEn" >= ${desde}
        AND estado NOT IN ('CANCELADO', 'REEMBOLSADO')
      GROUP BY 1 ORDER BY 1`,
    prisma.visitaDiaria.aggregate({ where: { tiendaId, fecha: { gte: antes, lt: desde } }, _sum: { visitas: true } }),
    prisma.pedido.aggregate({
      where: { tiendaId, creadoEn: { gte: antes, lt: desde }, estado: { notIn: ['CANCELADO', 'REEMBOLSADO'] } },
      _sum: { total: true },
      _count: true,
    }),
    plan.metricasAvanzadas
      ? prisma.itemPedido.groupBy({
          by: ['nombreProducto'],
          where: { pedido: { tiendaId, creadoEn: { gte: desde }, estado: { notIn: ['CANCELADO', 'REEMBOLSADO'] } } },
          _sum: { cantidad: true, subtotal: true },
          orderBy: { _sum: { subtotal: 'desc' } },
          take: 5,
        })
      : Promise.resolve(null),
  ])

  // Serie completa, con ceros en los días sin movimiento.
  const clave = (fecha: Date) => fecha.toISOString().slice(0, 10)
  const porVisita = new Map(visitas.map((fila) => [clave(fila.fecha), fila]))
  const porVenta = new Map(ventasPorDia.map((fila) => [clave(fila.fecha), fila]))
  const serie = Array.from({ length: dias }, (_, indice) => {
    const fecha = new Date(desde)
    fecha.setUTCDate(fecha.getUTCDate() + indice)
    const dia = clave(fecha)
    return {
      fecha: dia,
      visitas: porVisita.get(dia)?.visitas ?? 0,
      visitantes: porVisita.get(dia)?.visitantes ?? 0,
      pedidos: Number(porVenta.get(dia)?.pedidos ?? 0),
      ventas: Number(porVenta.get(dia)?.ventas ?? 0),
    }
  })

  const suma = (campo: 'visitas' | 'visitantes' | 'pedidos' | 'ventas') => serie.reduce((total, dia) => total + dia[campo], 0)
  const totales = {
    visitas: suma('visitas'),
    visitantes: suma('visitantes'),
    pedidos: suma('pedidos'),
    ventas: suma('ventas'),
    visitasAntes: previas._sum.visitas ?? 0,
    pedidosAntes: pedidosPrevios._count,
    ventasAntes: Number(pedidosPrevios._sum.total ?? 0),
  }

  let avanzadas = null
  if (plan.metricasAvanzadas) {
    const vistas = new Map<string, number>()
    for (const fila of visitas) {
      for (const [slug, cantidad] of Object.entries((fila.vistasProducto ?? {}) as Record<string, number>)) {
        vistas.set(slug, (vistas.get(slug) ?? 0) + cantidad)
      }
    }
    const topSlugs = [...vistas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const nombres = await prisma.producto.findMany({
      where: { tiendaId, slug: { in: topSlugs.map(([slug]) => slug) } },
      select: { slug: true, nombre: true, fotos: true },
    })
    avanzadas = {
      masVistos: topSlugs.map(([slug, cantidad]) => {
        const producto = nombres.find((otro) => otro.slug === slug)
        return { slug, nombre: producto?.nombre ?? slug, foto: producto?.fotos[0] ?? null, vistas: cantidad }
      }),
      masVendidos: (items ?? []).map((item) => ({
        nombre: item.nombreProducto,
        unidades: item._sum.cantidad ?? 0,
        ventas: Number(item._sum.subtotal ?? 0),
      })),
      clicsWhatsapp: visitas.reduce((total, fila) => total + fila.clicsWhatsapp, 0),
      conversion: totales.visitantes ? totales.pedidos / totales.visitantes : 0,
    }
  }

  res.json({ dias, maximoDias: plan.diasMetricas, serie, totales, avanzadas })
}

/**
 * Lo que el panel avisa con la campanita: pedidos por atender, productos
 * agotados o por agotarse y cupones a punto de vencer. Consultas baratas: el
 * panel lo pide cada minuto.
 */
export async function obtenerAvisos(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const enTresDias = new Date(Date.now() + 3 * 86_400_000)

  const [pedidosNuevos, ultimos, agotados, stockBajo, cuponesPorVencer, mensajesNuevos, citasPorConfirmar] = await Promise.all([
    prisma.pedido.count({ where: { tiendaId, estado: 'PENDIENTE' } }),
    prisma.pedido.findMany({
      where: { tiendaId, estado: 'PENDIENTE' },
      orderBy: { creadoEn: 'desc' },
      take: 5,
      select: { id: true, numero: true, clienteNombre: true, total: true, creadoEn: true },
    }),
    prisma.producto.count({ where: { tiendaId, activo: true, stock: 0 } }),
    prisma.producto.findMany({
      where: { tiendaId, activo: true, stock: { gt: 0, lte: 3 } },
      select: { id: true, nombre: true, stock: true },
      take: 5,
    }),
    prisma.cupon.findMany({
      where: { tiendaId, activo: true, venceEn: { gte: new Date(), lte: enTresDias } },
      select: { id: true, codigo: true, venceEn: true },
    }),
    prisma.mensajeContacto.count({ where: { tiendaId, leido: false, archivado: false } }),
    prisma.cita.count({ where: { tiendaId, estado: 'PENDIENTE', inicio: { gte: new Date() } } }),
  ])

  res.json({
    pedidosNuevos,
    ultimos: ultimos.map((pedido) => ({ ...pedido, total: pedido.total.toString() })),
    agotados,
    stockBajo,
    cuponesPorVencer,
    mensajesNuevos,
    citasPorConfirmar,
  })
}
