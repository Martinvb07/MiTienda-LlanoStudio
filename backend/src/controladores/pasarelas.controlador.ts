import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { tiendaDeLaSesion } from '../servicios/sesion.servicio.js'
import {
  PROVEEDORES,
  SECRETOS_REQUERIDOS,
  aplicarResultado,
  consultarPago,
  guardarSecretos,
  leerAviso,
  leerSecretos,
  urlAviso,
  type Proveedor,
} from '../servicios/pasarelas.servicio.js'
import { ErrorHttp, noEncontrado } from '../utilidades/errores.js'
import { registro } from '../utilidades/registro.js'

const PROVEEDOR = z.enum(['WOMPI', 'EPAYCO', 'BOLD'])

// ─────────────────────────────────────────────────────────────────────────────
// Panel: la tienda conecta sus cuentas
// ─────────────────────────────────────────────────────────────────────────────

/** Estado de cada pasarela. Nunca devuelve los secretos: sólo si están puestos. */
export async function listarPasarelas(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const filas = await prisma.pasarelaTienda.findMany({ where: { tiendaId } })
  res.json({
    pasarelas: PROVEEDORES.map((proveedor) => {
      const fila = filas.find((otra) => otra.proveedor === proveedor)
      const secretos = fila ? leerSecretos(fila.secretos) : {}
      return {
        proveedor,
        activa: fila?.activa ?? false,
        modoPrueba: fila?.modoPrueba ?? true,
        llavePublica: fila?.llavePublica ?? '',
        secretosPuestos: Object.fromEntries(SECRETOS_REQUERIDOS[proveedor].map((clave) => [clave, Boolean(secretos[clave])])),
        urlAviso: urlAviso(proveedor),
      }
    }),
  })
}

export const esquemaPasarela = z.object({
  activa: z.boolean(),
  modoPrueba: z.boolean(),
  llavePublica: z.string().trim().max(200),
  // Vacío o ausente = se conserva el que ya estaba guardado.
  secretos: z
    .object({
      integridad: z.string().trim().max(300).optional(),
      eventos: z.string().trim().max(300).optional(),
      idCliente: z.string().trim().max(60).optional(),
      pKey: z.string().trim().max(300).optional(),
      secreta: z.string().trim().max(300).optional(),
    })
    .default({}),
})

export async function guardarPasarela(req: Request, res: Response): Promise<void> {
  const proveedor = PROVEEDOR.parse(req.params.proveedor) as Proveedor
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaPasarela>

  const actual = await prisma.pasarelaTienda.findUnique({ where: { tiendaId_proveedor: { tiendaId, proveedor } } })
  const anteriores = actual ? leerSecretos(actual.secretos) : {}
  const secretos = { ...anteriores }
  for (const [clave, valor] of Object.entries(datos.secretos)) if (valor) secretos[clave as keyof typeof secretos] = valor

  // Para activarla tiene que estar completa.
  if (datos.activa) {
    const faltan = [!datos.llavePublica && 'llavePublica', ...SECRETOS_REQUERIDOS[proveedor].filter((clave) => !secretos[clave])].filter(Boolean)
    if (faltan.length) {
      throw new ErrorHttp(
        400,
        'Faltan llaves para activar esta pasarela',
        'FALTAN_LLAVES',
        faltan.map((campo) => ({ campo, mensaje: 'Obligatorio para activar' })),
      )
    }
    if (proveedor === 'WOMPI' && !/^pub_(test|prod)_/.test(datos.llavePublica)) {
      throw new ErrorHttp(400, 'La llave pública de Wompi empieza por pub_test_ o pub_prod_', 'LLAVE_INVALIDA', [
        { campo: 'llavePublica', mensaje: 'Debe empezar por pub_test_ o pub_prod_' },
      ])
    }
  }

  await prisma.pasarelaTienda.upsert({
    where: { tiendaId_proveedor: { tiendaId, proveedor } },
    create: { tiendaId, proveedor, activa: datos.activa, modoPrueba: datos.modoPrueba, llavePublica: datos.llavePublica, secretos: guardarSecretos(secretos) },
    update: { activa: datos.activa, modoPrueba: datos.modoPrueba, llavePublica: datos.llavePublica, secretos: guardarSecretos(secretos) },
  })
  await listarPasarelas(req, res)
}

// ─────────────────────────────────────────────────────────────────────────────
// Avisos de las pasarelas (webhooks) y estado del pago para la tienda
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Webhook de cada pasarela. Responde 200 siempre que la firma sea válida
 * (aunque el estado no cambie) para que no reintenten sin fin.
 */
export async function recibirAviso(req: Request, res: Response): Promise<void> {
  const proveedor = PROVEEDOR.parse(String(req.params.proveedor).toUpperCase()) as Proveedor
  // ePayco puede mandar la confirmación por POST (formulario) o por GET.
  const cuerpo = { ...(req.query as Record<string, unknown>), ...((req.body as Record<string, unknown>) ?? {}) }
  const aviso = await leerAviso(proveedor, cuerpo, req.cuerpoCrudo, req.headers)
  if (!aviso) {
    registro.warn({ proveedor }, 'Aviso de pago con firma inválida o pago desconocido')
    res.status(400).json({ error: { codigo: 'AVISO_INVALIDO', mensaje: 'Firma inválida' } })
    return
  }
  await aplicarResultado(aviso.referencia, aviso)
  res.json({ recibido: true })
}

/**
 * La tienda consulta cómo va un pago al volver de la pasarela. Si sigue
 * pendiente, le pregunta a la pasarela directamente.
 */
export async function estadoPago(req: Request, res: Response): Promise<void> {
  const referencia = req.params.referencia as string
  const pago = await prisma.pago.findFirst({
    where: { referencia, pedido: { tiendaId: req.tenant!.tiendaId } },
    select: {
      estado: true,
      proveedor: true,
      monto: true,
      pedido: { select: { numero: true, clienteNombre: true, clienteEmail: true, total: true, tiendaId: true } },
    },
  })
  if (!pago) throw noEncontrado('Ese pago no existe')

  let estado = pago.estado
  if (estado === 'PENDIENTE' && pago.proveedor !== 'PSE') {
    const pasarela = await prisma.pasarelaTienda.findUnique({
      where: { tiendaId_proveedor: { tiendaId: pago.pedido.tiendaId, proveedor: pago.proveedor } },
    })
    const idExterno = String(req.query.id ?? req.query.ref_payco ?? '') || undefined
    if (pasarela) {
      const resultado = await consultarPago(pago.proveedor as Proveedor, pasarela, referencia, idExterno)
      if (resultado) estado = ((await aplicarResultado(referencia, resultado)) as typeof estado | null) ?? estado
    }
  }

  res.json({
    pago: {
      estado,
      proveedor: pago.proveedor,
      monto: pago.monto.toString(),
      pedido: { numero: pago.pedido.numero, clienteNombre: pago.pedido.clienteNombre, clienteEmail: pago.pedido.clienteEmail, total: pago.pedido.total.toString() },
    },
  })
}

/** Proveedores activos de una tienda, para el checkout público. */
export async function pasarelasActivas(tiendaId: string): Promise<Proveedor[]> {
  const filas = await prisma.pasarelaTienda.findMany({ where: { tiendaId, activa: true }, select: { proveedor: true } })
  return filas.map((fila) => fila.proveedor as Proveedor)
}
