import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import type { Prisma } from '../generado/prisma/client.js'
import { registro } from '../utilidades/registro.js'

/**
 * Suscripciones de la plataforma, cobradas con el botón de pagos de Bold.
 *
 * El flujo: el panel pide un checkout (se crea un PagoSuscripcion PENDIENTE y
 * se firma el monto), Bold cobra y avisa por webhook. Si el webhook no llega
 * (o aún no está configurado), al volver del pago el panel pide verificar y se
 * le pregunta a Bold por la transacción. Las dos vías terminan en aplicarPago,
 * que es idempotente.
 */

/** Días que se sigue con el plan pago después de vencido, avisando arriba del panel. */
export const DIAS_GRACIA = 5
const DIA = 24 * 60 * 60 * 1000

export const boldConfigurado = () => Boolean(entorno.BOLD_LLAVE_IDENTIDAD)

export function urlPanel() {
  return (entorno.URL_PANEL || `https://${entorno.SUBDOMINIO_PANEL}.${entorno.DOMINIO_BASE}`).replace(/\/$/, '')
}

/** Referencia que viaja a Bold: sólo letras, números y guiones, máximo 60. */
export function nuevaReferencia() {
  return `MT-${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`.toUpperCase()
}

/** Hash de integridad del botón: SHA-256 de referencia + monto + moneda + llave secreta. */
export function firmaIntegridad(referencia: string, monto: number, moneda = 'COP') {
  return createHash('sha256').update(`${referencia}${monto}${moneda}${entorno.BOLD_LLAVE_SECRETA}`).digest('hex')
}

/** Bold firma el webhook con HMAC-SHA256 (llave secreta) sobre el cuerpo crudo en base64. */
export function firmaWebhookValida(cuerpoCrudo: Buffer, firma: string | undefined) {
  if (!firma) return false
  const esperada = createHmac('sha256', entorno.BOLD_LLAVE_SECRETA).update(cuerpoCrudo.toString('base64')).digest('hex')
  const a = Buffer.from(esperada)
  const b = Buffer.from(firma.trim().toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

function sumarPeriodo(desde: Date, periodo: 'MENSUAL' | 'ANUAL') {
  const fecha = new Date(desde)
  if (periodo === 'ANUAL') fecha.setFullYear(fecha.getFullYear() + 1)
  else fecha.setMonth(fecha.getMonth() + 1)
  return fecha
}

/**
 * Marca un pago como aprobado y le extiende el plan a la tienda. Si renueva el
 * mismo plan antes de vencer, el tiempo se suma al que le quedaba; si cambia
 * de plan, el nuevo periodo empieza hoy.
 */
export async function aplicarPago(referencia: string, idBold: string | null, datos: unknown) {
  return prisma.$transaction(async (tx) => {
    const pago = await tx.pagoSuscripcion.findUnique({ where: { referencia } })
    if (!pago || pago.estado === 'APROBADO') return pago

    const tenant = await tx.tenant.findUniqueOrThrow({
      where: { id: pago.tenantId },
      select: { plan: true, planVenceEn: true },
    })
    const ahora = new Date()
    const desde =
      tenant.plan === pago.plan && tenant.planVenceEn && tenant.planVenceEn > ahora ? tenant.planVenceEn : ahora
    const cubreHasta = sumarPeriodo(desde, pago.periodo)

    // updateMany con el estado en el filtro: si el webhook y la verificación
    // llegan a la vez, sólo uno de los dos extiende el plan.
    const { count } = await tx.pagoSuscripcion.updateMany({
      where: { id: pago.id, estado: { not: 'APROBADO' } },
      data: { estado: 'APROBADO', idBold, datosBold: datos as Prisma.InputJsonValue, cubreHasta },
    })
    if (count === 0) return pago

    await tx.tenant.update({ where: { id: pago.tenantId }, data: { plan: pago.plan, planVenceEn: cubreHasta } })
    registro.info({ referencia, plan: pago.plan, cubreHasta }, 'Suscripción pagada')
    return { ...pago, estado: 'APROBADO' as const, cubreHasta }
  })
}

export async function marcarPago(referencia: string, estado: 'RECHAZADO' | 'ANULADO' | 'ERROR', datos: unknown) {
  await prisma.pagoSuscripcion.updateMany({
    where: { referencia, estado: 'PENDIENTE' },
    data: { estado, datosBold: datos as Prisma.InputJsonValue },
  })
}

/**
 * Le pregunta a Bold cómo quedó una transacción. Respaldo del webhook: sirve
 * aunque todavía no esté configurado en el panel de Bold.
 */
export async function consultarEnBold(referencia: string) {
  const respuesta = await fetch(`https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(referencia)}`, {
    headers: { Authorization: `x-api-key ${entorno.BOLD_LLAVE_IDENTIDAD}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!respuesta.ok) return null
  const datos = (await respuesta.json()) as { payment_status?: string; payment_id?: string; transaction_id?: string }
  return { estado: datos.payment_status ?? 'PENDING', idBold: datos.payment_id ?? datos.transaction_id ?? null, datos }
}

export type EstadoSuscripcion = 'sin-vencimiento' | 'activa' | 'por-vencer' | 'gracia'

/** Cómo va el plan de una tienda, para el aviso del panel. */
export function estadoSuscripcion(venceEn: Date | null, ahora = new Date()) {
  if (!venceEn) return { estado: 'sin-vencimiento' as EstadoSuscripcion, venceEn: null, diasRestantes: null, bajaEn: null }
  const bajaEn = new Date(venceEn.getTime() + DIAS_GRACIA * DIA)
  const restante = venceEn.getTime() - ahora.getTime()
  const estado: EstadoSuscripcion = restante > DIAS_GRACIA * DIA ? 'activa' : restante > 0 ? 'por-vencer' : 'gracia'
  const diasRestantes = Math.ceil((estado === 'gracia' ? bajaEn.getTime() - ahora.getTime() : restante) / DIA)
  return { estado, venceEn: venceEn.toISOString(), diasRestantes: Math.max(diasRestantes, 0), bajaEn: bajaEn.toISOString() }
}

/** Pasa a Gratis las tiendas que llevan más de los días de gracia sin pagar. */
export async function aplicarVencimientos(tenantId?: string) {
  const limite = new Date(Date.now() - DIAS_GRACIA * DIA)
  const { count } = await prisma.tenant.updateMany({
    where: { ...(tenantId ? { id: tenantId } : {}), planVenceEn: { lt: limite }, plan: { not: 'GRATIS' } },
    data: { plan: 'GRATIS', planVenceEn: null },
  })
  if (count > 0 && !tenantId) registro.info({ cantidad: count }, 'Planes vencidos pasados a Gratis')
  return count
}
