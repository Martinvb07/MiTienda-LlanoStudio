import type { Request, Response } from 'express'
import { z } from 'zod'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { listarOfertas } from '../servicios/ofertas.servicio.js'
import {
  aplicarPago,
  aplicarVencimientos,
  boldConfigurado,
  estadoSuscripcion,
  firmaIntegridad,
  firmaWebhookValida,
  marcarPago,
  nuevaReferencia,
  sincronizarPago,
  sincronizarPendientes,
  urlPanel,
} from '../servicios/suscripciones.servicio.js'
import { ErrorHttp, noAutorizado, noEncontrado, solicitudInvalida } from '../utilidades/errores.js'
import { PLANES } from '../utilidades/planes.js'
import { registro } from '../utilidades/registro.js'

export const esquemaCheckout = z.object({
  plan: z.enum(['EMPRENDE', 'NEGOCIO', 'PRO']),
  periodo: z.enum(['MENSUAL', 'ANUAL']),
})

const PAGO_PUBLICO = {
  referencia: true,
  plan: true,
  periodo: true,
  monto: true,
  estado: true,
  cubreHasta: true,
  creadoEn: true,
} as const

/** Plan actual, cuándo vence, los precios para pagar y el historial de cobros. */
export async function obtenerSuscripcion(req: Request, res: Response): Promise<void> {
  const tenantId = req.sesion!.tenantId
  await sincronizarPendientes(tenantId)
  await aplicarVencimientos(tenantId)

  const [tenant, ofertas, pagos] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { plan: true, planVenceEn: true } }),
    listarOfertas(),
    prisma.pagoSuscripcion.findMany({
      where: { tenantId, estado: { not: 'PENDIENTE' } },
      orderBy: { creadoEn: 'desc' },
      take: 24,
      select: PAGO_PUBLICO,
    }),
  ])

  res.json({
    plan: tenant.plan,
    ...estadoSuscripcion(tenant.planVenceEn),
    pagosHabilitados: boldConfigurado(),
    planes: ofertas.map((oferta) => ({ ...oferta, nombre: PLANES[oferta.plan].nombre })),
    pagos,
  })
}

/**
 * Prepara el botón de Bold: registra el intento y devuelve los datos firmados.
 * El monto lo pone el servidor con la oferta vigente, nunca el navegador.
 */
export async function crearCheckout(req: Request, res: Response): Promise<void> {
  if (!boldConfigurado()) {
    throw new ErrorHttp(503, 'Los pagos en línea todavía no están activos. Escríbenos y te ayudamos.', 'PAGOS_INACTIVOS')
  }
  const { plan, periodo } = req.body as z.infer<typeof esquemaCheckout>
  const oferta = (await listarOfertas()).find((item) => item.plan === plan)!
  const monto = periodo === 'ANUAL' ? oferta.precioAnual : oferta.precio
  if (monto <= 0) throw solicitudInvalida(periodo === 'ANUAL' ? 'Este plan no se vende anual' : 'Este plan no tiene precio')

  const pago = await prisma.pagoSuscripcion.create({
    data: { tenantId: req.sesion!.tenantId, plan, periodo, monto, referencia: nuevaReferencia() },
    select: { referencia: true },
  })

  const nombre = PLANES[plan].nombre
  res.status(201).json({
    referencia: pago.referencia,
    monto,
    moneda: 'COP',
    llave: entorno.BOLD_LLAVE_IDENTIDAD,
    firma: firmaIntegridad(pago.referencia, monto),
    descripcion: `Mi Tienda · Plan ${nombre} ${periodo === 'ANUAL' ? 'anual' : 'mensual'}`,
    redireccion: `${urlPanel()}/panel/plan`,
    correo: req.sesion!.email,
  })
}

/** Al volver de Bold: si el webhook no ha llegado, se le pregunta a Bold directamente. */
export async function verificarPago(req: Request, res: Response): Promise<void> {
  const referencia = req.params.referencia as string
  let pago = await prisma.pagoSuscripcion.findFirst({
    where: { referencia, tenantId: req.sesion!.tenantId },
    select: PAGO_PUBLICO,
  })
  if (!pago) throw noEncontrado('Ese pago no existe')

  if (pago.estado === 'PENDIENTE' && boldConfigurado()) {
    await sincronizarPago(referencia)
    pago = await prisma.pagoSuscripcion.findUniqueOrThrow({ where: { referencia }, select: PAGO_PUBLICO })
  }

  res.json({ pago })
}

interface EventoBold {
  type?: string
  data?: { payment_id?: string; metadata?: { reference?: string } }
}

/**
 * Webhook de Bold (Integraciones > Webhooks). Responde 200 a todo lo que tenga
 * firma válida, aunque no sea de una suscripción, para que Bold no reintente.
 */
export async function webhookBold(req: Request, res: Response): Promise<void> {
  const crudo = req.cuerpoCrudo
  if (!crudo || !firmaWebhookValida(crudo, req.header('x-bold-signature'))) {
    registro.warn({ firma: Boolean(req.header('x-bold-signature')) }, 'Webhook de Bold con firma inválida')
    throw noAutorizado('Firma inválida')
  }

  const evento = req.body as EventoBold
  const referencia = evento.data?.metadata?.reference
  registro.info({ tipo: evento.type, referencia }, 'Webhook de Bold recibido')
  if (referencia) {
    if (evento.type === 'SALE_APPROVED') await aplicarPago(referencia, evento.data?.payment_id ?? null, evento)
    else if (evento.type === 'SALE_REJECTED') await marcarPago(referencia, 'RECHAZADO', evento)
    else if (evento.type === 'VOID_APPROVED') await marcarPago(referencia, 'ANULADO', evento)
  }
  res.json({ recibido: true })
}
