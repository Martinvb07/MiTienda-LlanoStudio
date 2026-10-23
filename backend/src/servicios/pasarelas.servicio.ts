import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { prisma } from '../config/prisma.js'
import type { Prisma } from '../generado/prisma/client.js'
import { cifrar, descifrar } from '../utilidades/cifrado.js'
import { registro } from '../utilidades/registro.js'
import { urlPanel } from './suscripciones.servicio.js'

/**
 * Pasarelas de pago de las tiendas: Wompi, ePayco y Bold. Cada tienda pone
 * sus propias llaves y el dinero le llega directo a ella; Mi Sitio sólo arma
 * el checkout y escucha el aviso de pago para marcar el pedido como pagado.
 *
 * Cada pasarela tiene tres piezas:
 *  · checkout: lo que el navegador necesita para cobrar;
 *  · leerAviso: valida la firma del webhook y dice qué pago y en qué estado;
 *  · consultar: le pregunta a la pasarela, por si el aviso no llegó.
 */

export type Proveedor = 'WOMPI' | 'EPAYCO' | 'BOLD'
export const PROVEEDORES: Proveedor[] = ['WOMPI', 'EPAYCO', 'BOLD']
export type EstadoPasarela = 'APROBADO' | 'RECHAZADO' | 'PENDIENTE' | 'ANULADO' | 'ERROR'

/** Secretos de cada pasarela. Lo público (llavePublica) va aparte, sin cifrar. */
export interface Secretos {
  /** Wompi: secreto de integridad (firma del checkout). */
  integridad?: string
  /** Wompi: secreto de eventos (firma de los webhooks). */
  eventos?: string
  /** ePayco: P_CUST_ID_CLIENTE. */
  idCliente?: string
  /** ePayco: P_KEY. */
  pKey?: string
  /** Bold: llave secreta. */
  secreta?: string
}

export const guardarSecretos = (secretos: Secretos) => cifrar(JSON.stringify(secretos))
export function leerSecretos(guardado: string): Secretos {
  try {
    return JSON.parse(descifrar(guardado)) as Secretos
  } catch (error) {
    registro.error({ err: error }, 'No se pudieron descifrar las llaves de una pasarela')
    return {}
  }
}

/** Qué secretos pide cada pasarela para quedar lista. */
export const SECRETOS_REQUERIDOS: Record<Proveedor, (keyof Secretos)[]> = {
  WOMPI: ['integridad', 'eventos'],
  EPAYCO: ['idCliente', 'pKey'],
  BOLD: ['secreta'],
}

export const nuevaReferenciaPago = (numeroPedido: number) =>
  `P${numeroPedido}-${Date.now().toString(36)}${randomBytes(3).toString('hex')}`.toUpperCase()

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex')
const iguales = (a: string, b: string) => {
  const x = Buffer.from(a.toLowerCase())
  const y = Buffer.from(b.toLowerCase())
  return x.length === y.length && timingSafeEqual(x, y)
}

/** URL a donde avisa la pasarela (la tienda la pega en su panel de Wompi o Bold). */
export const urlAviso = (proveedor: Proveedor) => `${urlPanel()}/api/pagos/aviso/${proveedor.toLowerCase()}`

export interface DatosCheckout {
  referencia: string
  monto: number
  descripcion: string
  correo: string
  nombre: string
  /** A dónde vuelve el comprador, con ?ref=<referencia> ya puesto. */
  retorno: string
}

/** Lo que el navegador necesita para abrir el cobro en cada pasarela. */
export function armarCheckout(
  proveedor: Proveedor,
  pasarela: { llavePublica: string; modoPrueba: boolean; secretos: Secretos },
  datos: DatosCheckout,
) {
  const { llavePublica, secretos } = pasarela
  if (proveedor === 'WOMPI') {
    const centavos = Math.round(datos.monto * 100)
    const firma = sha256(`${datos.referencia}${centavos}COP${secretos.integridad ?? ''}`)
    const url = new URL('https://checkout.wompi.co/p/')
    url.searchParams.set('public-key', llavePublica)
    url.searchParams.set('currency', 'COP')
    url.searchParams.set('amount-in-cents', String(centavos))
    url.searchParams.set('reference', datos.referencia)
    url.searchParams.set('signature:integrity', firma)
    url.searchParams.set('redirect-url', datos.retorno)
    url.searchParams.set('customer-data:email', datos.correo)
    url.searchParams.set('customer-data:full-name', datos.nombre)
    return { tipo: 'redireccion' as const, url: url.toString() }
  }
  if (proveedor === 'EPAYCO') {
    return {
      tipo: 'epayco' as const,
      llave: llavePublica,
      prueba: pasarela.modoPrueba,
      datos: {
        name: datos.descripcion.slice(0, 60),
        description: datos.descripcion,
        invoice: datos.referencia,
        currency: 'cop',
        amount: String(Math.round(datos.monto)),
        tax_base: '0',
        tax: '0',
        country: 'co',
        lang: 'es',
        external: 'false',
        response: datos.retorno,
        confirmation: urlAviso('EPAYCO'),
        email_billing: datos.correo,
        name_billing: datos.nombre,
      },
    }
  }
  const monto = Math.round(datos.monto)
  return {
    tipo: 'bold' as const,
    llave: llavePublica,
    referencia: datos.referencia,
    monto,
    moneda: 'COP',
    firma: sha256(`${datos.referencia}${monto}COP${secretos.secreta ?? ''}`),
    descripcion: datos.descripcion,
    redireccion: datos.retorno,
    correo: datos.correo,
  }
}

export interface AvisoPago {
  referencia: string
  estado: EstadoPasarela
  monto: number | null
  datos: unknown
}

/** Busca el pago por referencia y trae las llaves de su tienda para validar el aviso. */
async function pasarelaDelPago(referencia: string, proveedor: Proveedor) {
  const pago = await prisma.pago.findUnique({
    where: { referencia },
    select: { pedido: { select: { tiendaId: true } } },
  })
  if (!pago) return null
  const pasarela = await prisma.pasarelaTienda.findUnique({
    where: { tiendaId_proveedor: { tiendaId: pago.pedido.tiendaId, proveedor } },
  })
  return pasarela ? { ...pasarela, secretos: leerSecretos(pasarela.secretos) } : null
}

const ESTADOS_WOMPI: Record<string, EstadoPasarela> = {
  APPROVED: 'APROBADO',
  DECLINED: 'RECHAZADO',
  VOIDED: 'ANULADO',
  ERROR: 'ERROR',
  PENDING: 'PENDIENTE',
}
const ESTADOS_EPAYCO: Record<string, EstadoPasarela> = { '1': 'APROBADO', '2': 'RECHAZADO', '3': 'PENDIENTE', '4': 'ERROR', '6': 'ANULADO', '11': 'ANULADO' }

/** Lee y valida el aviso (webhook) de una pasarela. null = firma inválida o pago desconocido. */
export async function leerAviso(proveedor: Proveedor, cuerpo: Record<string, unknown>, crudo?: Buffer, cabeceras?: Record<string, unknown>): Promise<AvisoPago | null> {
  if (proveedor === 'WOMPI') {
    const evento = cuerpo as {
      data?: { transaction?: Record<string, unknown> }
      signature?: { properties?: string[]; checksum?: string }
      timestamp?: number
    }
    const transaccion = evento.data?.transaction
    const referencia = String(transaccion?.reference ?? '')
    const pasarela = referencia ? await pasarelaDelPago(referencia, 'WOMPI') : null
    if (!pasarela || !transaccion || !evento.signature?.checksum) return null
    // Checksum = SHA256(valores de las propiedades indicadas + timestamp + secreto de eventos).
    const valores = (evento.signature.properties ?? []).map((ruta) =>
      ruta.split('.').reduce<unknown>((valor, clave) => (valor as Record<string, unknown> | undefined)?.[clave], evento.data),
    )
    const esperado = sha256(`${valores.join('')}${evento.timestamp ?? ''}${pasarela.secretos.eventos ?? ''}`)
    if (!iguales(esperado, evento.signature.checksum)) return null
    return {
      referencia,
      estado: ESTADOS_WOMPI[String(transaccion.status)] ?? 'PENDIENTE',
      monto: Number(transaccion.amount_in_cents) / 100,
      datos: cuerpo,
    }
  }

  if (proveedor === 'EPAYCO') {
    const campos = cuerpo as Record<string, string | undefined>
    const referencia = String(campos.x_id_invoice ?? '')
    const pasarela = referencia ? await pasarelaDelPago(referencia, 'EPAYCO') : null
    if (!pasarela || !campos.x_signature) return null
    // Firma = SHA256(cliente^pKey^x_ref_payco^x_transaction_id^x_amount^x_currency_code).
    const esperado = sha256(
      [pasarela.secretos.idCliente, pasarela.secretos.pKey, campos.x_ref_payco, campos.x_transaction_id, campos.x_amount, campos.x_currency_code].join('^'),
    )
    if (!iguales(esperado, campos.x_signature)) return null
    return {
      referencia,
      estado: ESTADOS_EPAYCO[String(campos.x_cod_response ?? campos.x_cod_transaction_state)] ?? 'PENDIENTE',
      monto: Number(campos.x_amount),
      datos: cuerpo,
    }
  }

  // Bold: HMAC-SHA256 (llave secreta de la tienda) sobre el cuerpo crudo en base64.
  const evento = cuerpo as { type?: string; data?: { metadata?: { reference?: string }; amount?: { total?: number } } }
  const referencia = String(evento.data?.metadata?.reference ?? '')
  const pasarela = referencia ? await pasarelaDelPago(referencia, 'BOLD') : null
  const firma = String(cabeceras?.['x-bold-signature'] ?? '')
  if (!pasarela || !crudo || !firma) return null
  const esperado = createHmac('sha256', pasarela.secretos.secreta ?? '').update(crudo.toString('base64')).digest('hex')
  if (!iguales(esperado, firma)) return null
  const estado: EstadoPasarela =
    evento.type === 'SALE_APPROVED' ? 'APROBADO' : evento.type === 'SALE_REJECTED' ? 'RECHAZADO' : evento.type === 'VOID_APPROVED' ? 'ANULADO' : 'PENDIENTE'
  return { referencia, estado, monto: evento.data?.amount?.total ?? null, datos: cuerpo }
}

/**
 * Le pregunta a la pasarela cómo quedó un pago, con el identificador que trae
 * el comprador al volver (Wompi ?id=, ePayco ?ref_payco=) o la referencia (Bold).
 */
export async function consultarPago(
  proveedor: Proveedor,
  pasarela: { llavePublica: string; modoPrueba: boolean },
  referencia: string,
  idExterno?: string,
): Promise<Omit<AvisoPago, 'referencia'> | null> {
  try {
    if (proveedor === 'WOMPI') {
      if (!idExterno) return null
      const base = pasarela.llavePublica.startsWith('pub_test_') ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1'
      const respuesta = await fetch(`${base}/transactions/${encodeURIComponent(idExterno)}`, { signal: AbortSignal.timeout(10_000) })
      if (!respuesta.ok) return null
      const { data } = (await respuesta.json()) as { data?: { status?: string; reference?: string; amount_in_cents?: number } }
      if (data?.reference !== referencia) return null
      return { estado: ESTADOS_WOMPI[String(data.status)] ?? 'PENDIENTE', monto: Number(data.amount_in_cents) / 100, datos: data }
    }
    if (proveedor === 'EPAYCO') {
      if (!idExterno) return null
      const respuesta = await fetch(`https://secure.epayco.co/validation/v1/reference/${encodeURIComponent(idExterno)}`, {
        signal: AbortSignal.timeout(10_000),
      })
      if (!respuesta.ok) return null
      const { data } = (await respuesta.json()) as { data?: { x_id_invoice?: string; x_cod_response?: number; x_amount?: string } }
      if (data?.x_id_invoice !== referencia) return null
      return { estado: ESTADOS_EPAYCO[String(data.x_cod_response)] ?? 'PENDIENTE', monto: Number(data.x_amount), datos: data }
    }
    const respuesta = await fetch(`https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(referencia)}`, {
      headers: { Authorization: `x-api-key ${pasarela.llavePublica}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!respuesta.ok) return null
    const datos = (await respuesta.json()) as { payment_status?: string; total?: number }
    const estado: EstadoPasarela =
      datos.payment_status === 'APPROVED' ? 'APROBADO' : datos.payment_status === 'REJECTED' || datos.payment_status === 'FAILED' ? 'RECHAZADO' : 'PENDIENTE'
    return { estado, monto: datos.total ?? null, datos }
  } catch (error) {
    registro.warn({ err: error, proveedor, referencia }, 'No se pudo consultar el pago en la pasarela')
    return null
  }
}

/**
 * Aplica el resultado a la base de datos. Aprobado → el pedido pasa a Pagado.
 * Si el monto no coincide con lo cobrado, queda como error para revisar a mano.
 * Es idempotente: un aviso repetido no cambia nada.
 */
export async function aplicarResultado(referencia: string, resultado: Omit<AvisoPago, 'referencia'>) {
  const pago = await prisma.pago.findUnique({ where: { referencia }, select: { id: true, estado: true, monto: true, pedidoId: true } })
  if (!pago || pago.estado === 'APROBADO' || resultado.estado === 'PENDIENTE') return pago?.estado ?? null

  let estado = resultado.estado
  if (estado === 'APROBADO' && resultado.monto !== null && Math.abs(resultado.monto - Number(pago.monto)) > 1) {
    registro.error({ referencia, esperado: pago.monto.toString(), recibido: resultado.monto }, 'Pago aprobado con un monto distinto')
    estado = 'ERROR'
  }

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.pago.updateMany({
      where: { id: pago.id, estado: { not: 'APROBADO' } },
      data: { estado, datosProveedor: resultado.datos as Prisma.InputJsonValue },
    })
    if (count > 0 && estado === 'APROBADO') {
      await tx.pedido.updateMany({ where: { id: pago.pedidoId, estado: 'PENDIENTE' }, data: { estado: 'PAGADO' } })
    }
  })
  registro.info({ referencia, estado }, 'Pago de pedido actualizado')
  return estado
}
