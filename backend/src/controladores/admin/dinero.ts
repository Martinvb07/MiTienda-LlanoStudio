import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { ErrorHttp, noEncontrado } from '../../utilidades/errores.js'
import { registrarActividad } from '../../servicios/admins.servicio.js'
import { guardarAjuste, leerAjuste } from '../../servicios/plataforma.servicio.js'
import { DIAS_GRACIA } from '../../servicios/suscripciones.servicio.js'

const DIA = 86_400_000
const PLAN = z.enum(['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO'])
const PLAN_PAGO = z.enum(['EMPRENDE', 'NEGOCIO', 'PRO'])

const duenaDe = {
  usuarios: { where: { rol: 'PROPIETARIO' as const }, take: 1, select: { nombre: true, email: true } },
} as const

/**
 * Tablero de dinero: lo cobrado, lo que entra cada mes, quién vence, quién
 * está en gracia y quién empezó a pagar y no terminó.
 */
export async function tableroDinero(_req: Request, res: Response): Promise<void> {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  const haceUnAno = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1)

  const [aprobados, activos, vencenPronto, enGracia, bajaron, abandonos, ultimos] = await Promise.all([
    prisma.pagoSuscripcion.findMany({
      where: { estado: 'APROBADO', creadoEn: { gte: haceUnAno } },
      select: { monto: true, creadoEn: true },
    }),
    // Para el ingreso recurrente: el último pago aprobado de cada tienda que sigue al día.
    prisma.tenant.findMany({
      where: { planVenceEn: { gt: ahora }, plan: { not: 'GRATIS' } },
      select: {
        pagosSuscripcion: {
          where: { estado: 'APROBADO' },
          orderBy: { creadoEn: 'desc' },
          take: 1,
          select: { monto: true, periodo: true },
        },
      },
    }),
    prisma.tenant.findMany({
      where: { planVenceEn: { gt: ahora, lt: new Date(ahora.getTime() + 7 * DIA) }, plan: { not: 'GRATIS' } },
      orderBy: { planVenceEn: 'asc' },
      select: { id: true, nombre: true, subdominio: true, plan: true, planVenceEn: true, ...duenaDe },
    }),
    prisma.tenant.findMany({
      where: { planVenceEn: { lte: ahora }, plan: { not: 'GRATIS' } },
      orderBy: { planVenceEn: 'asc' },
      select: { id: true, nombre: true, subdominio: true, plan: true, planVenceEn: true, ...duenaDe },
    }),
    prisma.historialPlan.findMany({
      where: { motivo: 'VENCIMIENTO', creadoEn: { gte: new Date(ahora.getTime() - 30 * DIA) } },
      orderBy: { creadoEn: 'desc' },
      take: 30,
      select: { creadoEn: true, planAnterior: true, tenant: { select: { id: true, nombre: true, subdominio: true, ...duenaDe } } },
    }),
    // Abrieron el pago de Bold hace más de media hora y nunca se aprobó.
    prisma.pagoSuscripcion.findMany({
      where: {
        estado: 'PENDIENTE',
        creadoEn: { lt: new Date(ahora.getTime() - 30 * 60_000), gt: new Date(ahora.getTime() - 14 * DIA) },
      },
      orderBy: { creadoEn: 'desc' },
      take: 40,
      select: {
        referencia: true,
        plan: true,
        periodo: true,
        monto: true,
        creadoEn: true,
        tenant: { select: { id: true, nombre: true, subdominio: true, plan: true, ...duenaDe } },
      },
    }),
    prisma.pagoSuscripcion.findMany({
      where: { estado: { not: 'PENDIENTE' } },
      orderBy: { creadoEn: 'desc' },
      take: 12,
      select: {
        referencia: true,
        plan: true,
        periodo: true,
        monto: true,
        estado: true,
        cuponCodigo: true,
        creadoEn: true,
        tenant: { select: { id: true, nombre: true } },
      },
    }),
  ])

  const meses = Array.from({ length: 12 }, (_, indice) => {
    const fecha = new Date(haceUnAno.getFullYear(), haceUnAno.getMonth() + indice, 1)
    return { mes: fecha.toISOString().slice(0, 7), total: 0, cantidad: 0 }
  })
  for (const pago of aprobados) {
    const fila = meses.find((mes) => mes.mes === pago.creadoEn.toISOString().slice(0, 7))
    if (fila) {
      fila.total += pago.monto
      fila.cantidad += 1
    }
  }
  const suma = (desde: Date, hasta?: Date) =>
    aprobados.filter((pago) => pago.creadoEn >= desde && (!hasta || pago.creadoEn < hasta)).reduce((total, pago) => total + pago.monto, 0)

  const recurrente = Math.round(
    activos.reduce((total, tenant) => {
      const pago = tenant.pagosSuscripcion[0]
      return pago ? total + (pago.periodo === 'ANUAL' ? pago.monto / 12 : pago.monto) : total
    }, 0),
  )

  const conDuena = <T extends { usuarios: { nombre: string; email: string }[] }>({ usuarios, ...resto }: T) => ({
    ...resto,
    duena: usuarios[0] ?? null,
  })

  res.json({
    ingresoMes: suma(inicioMes),
    ingresoMesAnterior: suma(inicioMesAnterior, inicioMes),
    recurrente,
    pagadoras: activos.length,
    meses,
    vencenPronto: vencenPronto.map(conDuena),
    enGracia: enGracia.map((tenant) => ({
      ...conDuena(tenant),
      bajaEn: new Date(tenant.planVenceEn!.getTime() + DIAS_GRACIA * DIA),
    })),
    bajaron: bajaron.map(({ tenant, ...resto }) => ({ ...resto, tenant: conDuena(tenant) })),
    abandonos: abandonos.map(({ tenant, ...resto }) => ({ ...resto, tenant: conDuena(tenant) })),
    ultimos,
  })
}

export const esquemaBuscarPagos = z.object({
  buscar: z.string().trim().max(80).optional(),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR']).optional(),
})

export async function listarPagos(req: Request, res: Response): Promise<void> {
  const { buscar, estado } = req.query as z.infer<typeof esquemaBuscarPagos>
  const pagos = await prisma.pagoSuscripcion.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(buscar
        ? {
            OR: [
              { referencia: { contains: buscar, mode: 'insensitive' } },
              { idBold: { contains: buscar, mode: 'insensitive' } },
              { tenant: { nombre: { contains: buscar, mode: 'insensitive' } } },
              { tenant: { subdominio: { contains: buscar, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    orderBy: { creadoEn: 'desc' },
    take: 150,
    select: {
      referencia: true,
      plan: true,
      periodo: true,
      monto: true,
      montoOriginal: true,
      cuponCodigo: true,
      estado: true,
      idBold: true,
      cubreHasta: true,
      creadoEn: true,
      tenant: { select: { id: true, nombre: true, subdominio: true } },
    },
  })
  res.json({ pagos })
}

export async function detallePago(req: Request, res: Response): Promise<void> {
  const pago = await prisma.pagoSuscripcion.findUnique({
    where: { referencia: req.params.referencia as string },
    include: { tenant: { select: { id: true, nombre: true, subdominio: true } } },
  })
  if (!pago) throw noEncontrado('Ese pago no existe')
  res.json({ pago })
}

/**
 * Marca un pago como reembolsado (el dinero se devuelve desde el panel de
 * Bold). Si se pide, también le quita a la tienda el tiempo que cubría.
 */
export const esquemaReembolso = z.object({ quitarTiempo: z.boolean().default(false) })

export async function reembolsarPago(req: Request, res: Response): Promise<void> {
  const { quitarTiempo } = req.body as z.infer<typeof esquemaReembolso>
  const referencia = req.params.referencia as string
  const pago = await prisma.pagoSuscripcion.findUnique({ where: { referencia } })
  if (!pago) throw noEncontrado('Ese pago no existe')
  if (pago.estado !== 'APROBADO') throw new ErrorHttp(400, 'Sólo se reembolsan pagos aprobados', 'NO_APROBADO')

  await prisma.$transaction(async (tx) => {
    await tx.pagoSuscripcion.update({ where: { id: pago.id }, data: { estado: 'ANULADO' } })
    if (quitarTiempo) {
      const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: pago.tenantId }, select: { planVenceEn: true } })
      if (tenant.planVenceEn) {
        const dias = pago.periodo === 'ANUAL' ? 365 : 30
        const nueva = new Date(tenant.planVenceEn.getTime() - dias * DIA)
        await tx.tenant.update({ where: { id: pago.tenantId }, data: { planVenceEn: nueva } })
      }
    }
  })
  registrarActividad(req, 'Marcó un pago como reembolsado', `${referencia}${quitarTiempo ? ' · quitó el tiempo' : ''}`, pago.tenantId)
  res.json({ ok: true })
}

// ── Cupones de suscripción ──

export const esquemaCuponSuscripcion = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,24}$/, 'Sólo letras, números, guion y guion bajo (3 a 24)'),
  porcentaje: z.coerce.number().int().min(1).max(100),
  planes: z.array(PLAN_PAGO).default([]),
  usosMaximos: z.coerce.number().int().positive().nullable().default(null),
  venceEn: z.coerce.date().nullable().default(null),
  activo: z.boolean().default(true),
})

export async function listarCuponesSuscripcion(_req: Request, res: Response): Promise<void> {
  res.json({ cupones: await prisma.cuponSuscripcion.findMany({ orderBy: { creadoEn: 'desc' } }) })
}

export async function guardarCuponSuscripcion(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaCuponSuscripcion>
  const id = req.params.id as string | undefined
  const otro = await prisma.cuponSuscripcion.findUnique({ where: { codigo: datos.codigo }, select: { id: true } })
  if (otro && otro.id !== id) {
    throw new ErrorHttp(409, 'Ya existe un cupón con ese código', 'CODIGO_EN_USO', [
      { campo: 'codigo', mensaje: 'Ya existe un cupón con ese código' },
    ])
  }
  const cupon = id
    ? await prisma.cuponSuscripcion.update({ where: { id }, data: datos })
    : await prisma.cuponSuscripcion.create({ data: datos })
  registrarActividad(req, id ? 'Editó un cupón de suscripción' : 'Creó un cupón de suscripción', cupon.codigo)
  res.status(id ? 200 : 201).json({ cupon })
}

export async function eliminarCuponSuscripcion(req: Request, res: Response): Promise<void> {
  const cupon = await prisma.cuponSuscripcion.delete({ where: { id: req.params.id as string } }).catch(() => null)
  if (!cupon) throw noEncontrado('Ese cupón no existe')
  registrarActividad(req, 'Eliminó un cupón de suscripción', cupon.codigo)
  res.status(204).end()
}

// ── Prueba gratis y referidos ──

export const esquemaPromos = z.object({
  prueba: z.object({ activa: z.boolean(), plan: PLAN_PAGO, dias: z.coerce.number().int().min(1).max(90) }),
  referidos: z.object({ activa: z.boolean(), dias: z.coerce.number().int().min(1).max(365) }),
})

export async function leerPromos(_req: Request, res: Response): Promise<void> {
  const [prueba, referidos, topReferidos] = await Promise.all([
    leerAjuste('prueba'),
    leerAjuste('referidos'),
    prisma.tenant.groupBy({
      by: ['referidoPorId'],
      where: { referidoPorId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referidoPorId: 'desc' } },
      take: 10,
    }),
  ])
  const padrinos = await prisma.tenant.findMany({
    where: { id: { in: topReferidos.map((fila) => fila.referidoPorId!) } },
    select: { id: true, nombre: true, subdominio: true },
  })
  res.json({
    prueba,
    referidos,
    topReferidos: topReferidos.map((fila) => ({
      tienda: padrinos.find((padrino) => padrino.id === fila.referidoPorId) ?? null,
      invitadas: fila._count._all,
    })),
  })
}

export async function guardarPromos(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaPromos>
  await Promise.all([guardarAjuste('prueba', datos.prueba), guardarAjuste('referidos', datos.referidos)])
  registrarActividad(
    req,
    'Cambió las promociones',
    `Prueba ${datos.prueba.activa ? `${datos.prueba.dias} días de ${datos.prueba.plan}` : 'apagada'} · Referidos ${datos.referidos.activa ? `${datos.referidos.dias} días` : 'apagados'}`,
  )
  res.json(datos)
}

export { PLAN }
