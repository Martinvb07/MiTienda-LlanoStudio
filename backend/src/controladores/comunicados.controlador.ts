import type { Request, Response } from 'express'
import { prisma } from '../config/prisma.js'

/**
 * Lo que la plataforma le dice a cada tienda en su panel: anuncios (en la
 * campana o en una barra arriba) y el historial de novedades.
 */
export async function obtenerComunicados(req: Request, res: Response): Promise<void> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: req.sesion!.tenantId },
    select: { plan: true, novedadesVistasEn: true },
  })
  const ahora = new Date()
  const [anuncios, novedades] = await Promise.all([
    prisma.anuncio.findMany({
      where: {
        activo: true,
        desde: { lte: ahora },
        OR: [{ hasta: null }, { hasta: { gt: ahora } }],
        AND: [{ OR: [{ planes: { isEmpty: true } }, { planes: { has: tenant.plan } }] }],
      },
      orderBy: { desde: 'desc' },
      select: { id: true, titulo: true, cuerpo: true, tipo: true, desde: true },
    }),
    prisma.novedad.findMany({
      where: { publicadaEn: { lte: ahora } },
      orderBy: { publicadaEn: 'desc' },
      take: 30,
    }),
  ])
  const vistas = tenant.novedadesVistasEn
  res.json({
    barra: anuncios.filter((anuncio) => anuncio.tipo === 'BARRA'),
    campana: anuncios.filter((anuncio) => anuncio.tipo === 'CAMPANA'),
    novedades,
    novedadesSinVer: novedades.filter((novedad) => !vistas || novedad.publicadaEn > vistas).length,
  })
}

export async function marcarNovedadesVistas(req: Request, res: Response): Promise<void> {
  await prisma.tenant.update({ where: { id: req.sesion!.tenantId }, data: { novedadesVistasEn: new Date() } })
  res.status(204).end()
}
