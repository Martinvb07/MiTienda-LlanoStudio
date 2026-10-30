import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { encolarFactura } from '../colas/index.js'
import { ErrorHttp, noEncontrado } from '../utilidades/errores.js'
import { ErrorAlegra } from '../servicios/facturacion/alegra.js'
import { guardarSecretoFacturacion, probarCredenciales } from '../servicios/facturacion/facturacion.servicio.js'
import { tiendaDeLaSesion } from './tiendaPanel.controlador.js'
import { descifrar } from '../utilidades/cifrado.js'

/** Factura electrónica DIAN: la tienda conecta su cuenta de Alegra y factura sus pedidos. */

async function estado(tiendaId: string) {
  const fila = await prisma.facturacionTienda.findUnique({ where: { tiendaId } })
  return {
    proveedor: 'alegra',
    activa: fila?.activa ?? false,
    automatica: fila?.automatica ?? false,
    usuario: fila?.usuario ?? '',
    tokenPuesto: Boolean(fila?.secreto),
  }
}

export async function obtenerFacturacion(req: Request, res: Response): Promise<void> {
  res.json({ facturacion: await estado(await tiendaDeLaSesion(req)) })
}

export const esquemaFacturacion = z.object({
  activa: z.boolean(),
  automatica: z.boolean(),
  usuario: z.string().trim().toLowerCase().email('Escribe el correo con el que entras a Alegra').max(160),
  // Vacío = se conserva el que ya estaba guardado.
  token: z.string().trim().max(200).optional(),
})

export async function guardarFacturacion(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaFacturacion>
  const actual = await prisma.facturacionTienda.findUnique({ where: { tiendaId } })
  const secreto = datos.token ? guardarSecretoFacturacion(datos.token) : actual?.secreto
  if (!secreto) throw new ErrorHttp(400, 'Pega el token de la API de Alegra', 'FALTA_TOKEN', [{ campo: 'token', mensaje: 'Obligatorio' }])

  if (datos.activa && (datos.token || datos.usuario !== actual?.usuario || !actual?.activa)) {
    try {
      await probarCredenciales({ usuario: datos.usuario, token: datos.token || descifrar(secreto) })
    } catch (error) {
      const mensaje = error instanceof ErrorAlegra ? error.message : 'No pudimos comprobar la cuenta de Alegra'
      throw new ErrorHttp(400, mensaje, 'ALEGRA_RECHAZO', [{ campo: 'token', mensaje }])
    }
  }

  // Otra cuenta = otros ítems: se olvida el mapa de productos de la anterior.
  const cambioCuenta = actual && actual.usuario !== datos.usuario
  await prisma.facturacionTienda.upsert({
    where: { tiendaId },
    create: { tiendaId, activa: datos.activa, automatica: datos.automatica, usuario: datos.usuario, secreto },
    update: { activa: datos.activa, automatica: datos.automatica, usuario: datos.usuario, secreto, ...(cambioCuenta ? { items: {} } : {}) },
  })
  res.json({ facturacion: await estado(tiendaId) })
}

/** "Emitir factura" desde el detalle del pedido. */
export async function facturarPedido(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const pedido = await prisma.pedido.findFirst({ where: { id: String(req.params.id), tiendaId }, select: { id: true, facturaId: true, estado: true } })
  if (!pedido) throw noEncontrado('Ese pedido no existe')
  if (pedido.facturaId) throw new ErrorHttp(409, 'Este pedido ya tiene factura', 'YA_FACTURADO')
  if (pedido.estado === 'CANCELADO' || pedido.estado === 'REEMBOLSADO') throw new ErrorHttp(409, 'Un pedido cancelado no se factura', 'CANCELADO')
  const configuracion = await prisma.facturacionTienda.findUnique({ where: { tiendaId }, select: { activa: true } })
  if (!configuracion?.activa) throw new ErrorHttp(409, 'Conecta tu cuenta de Alegra en Configuración para facturar', 'SIN_FACTURACION')

  await prisma.pedido.update({ where: { id: pedido.id }, data: { facturaEstado: 'PENDIENTE', facturaError: null } })
  await encolarFactura(pedido.id)
  res.status(202).json({ facturaEstado: 'PENDIENTE' })
}

/** Para la tienda pública: si puede pedir factura electrónica al comprar. */
export async function facturaElectronicaActiva(tiendaId: string): Promise<boolean> {
  const fila = await prisma.facturacionTienda.findUnique({ where: { tiendaId }, select: { activa: true } })
  return fila?.activa ?? false
}
