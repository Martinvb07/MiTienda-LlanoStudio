import type { Request, Response } from 'express'
import { prisma } from '../../config/prisma.js'

const DIA = 86_400_000
const ORDEN_PLAN = { GRATIS: 0, EMPRENDE: 1, NEGOCIO: 2, PRO: 3 } as const

/**
 * Cómo crece la plataforma: el embudo de registro a pago, registros por día,
 * qué plantillas y secciones se usan, quién baja de plan y de dónde llegan.
 */
export async function tableroCrecimiento(_req: Request, res: Response): Promise<void> {
  const hace90 = new Date(Date.now() - 90 * DIA)

  const [registradas, conProductos, publicadas, conPedidos, pagaron, registros, tiendas, cambios, origenes] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tienda.count({ where: { productos: { some: {} } } }),
      prisma.tienda.count({ where: { publicada: true } }),
      prisma.tienda.count({ where: { pedidos: { some: {} } } }),
      prisma.tenant.count({ where: { pagosSuscripcion: { some: { estado: 'APROBADO' } } } }),
      prisma.tenant.findMany({ where: { creadoEn: { gte: hace90 } }, select: { creadoEn: true } }),
      prisma.tienda.findMany({ select: { plantilla: true, configuracionBloques: true } }),
      prisma.historialPlan.findMany({
        where: { creadoEn: { gte: hace90 } },
        orderBy: { creadoEn: 'desc' },
        select: {
          planAnterior: true,
          planNuevo: true,
          motivo: true,
          creadoEn: true,
          tenant: { select: { id: true, nombre: true } },
        },
      }),
      prisma.tenant.groupBy({ by: ['origen'], _count: { _all: true } }),
    ])

  const dias = Array.from({ length: 90 }, (_, indice) => {
    const fecha = new Date(Date.now() - (89 - indice) * DIA)
    return { dia: fecha.toISOString().slice(0, 10), registros: 0 }
  })
  for (const { creadoEn } of registros) {
    const fila = dias.find((dia) => dia.dia === creadoEn.toISOString().slice(0, 10))
    if (fila) fila.registros += 1
  }

  const contar = (valores: string[]) =>
    Object.entries(
      valores.reduce<Record<string, number>>((cuenta, valor) => ({ ...cuenta, [valor]: (cuenta[valor] ?? 0) + 1 }), {}),
    )
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)

  const bloques = tiendas.flatMap((tienda) =>
    Array.isArray(tienda.configuracionBloques)
      ? (tienda.configuracionBloques as { tipo?: string }[]).map((bloque) => bloque.tipo ?? 'desconocido')
      : [],
  )

  res.json({
    embudo: [
      { paso: 'Se registraron', cantidad: registradas },
      { paso: 'Subieron productos', cantidad: conProductos },
      { paso: 'Publicaron', cantidad: publicadas },
      { paso: 'Recibieron pedidos', cantidad: conPedidos },
      { paso: 'Pagaron un plan', cantidad: pagaron },
    ],
    registrosPorDia: dias,
    plantillas: contar(tiendas.map((tienda) => tienda.plantilla)),
    bloques: contar(bloques).slice(0, 15),
    bajas: cambios.filter((cambio) => ORDEN_PLAN[cambio.planNuevo] < ORDEN_PLAN[cambio.planAnterior]),
    subidas: cambios.filter((cambio) => ORDEN_PLAN[cambio.planNuevo] > ORDEN_PLAN[cambio.planAnterior]).length,
    origenes: origenes
      .map((fila) => ({ nombre: fila.origen ?? 'directo', cantidad: fila._count._all }))
      .sort((a, b) => b.cantidad - a.cantidad),
  })
}
