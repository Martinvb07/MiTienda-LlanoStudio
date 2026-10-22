import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { Prisma } from '../generado/prisma/client.js'
import { planDeLaSesion, tiendaDeLaSesion } from '../servicios/sesion.servicio.js'
import { fueraDelPlan } from '../utilidades/planes.js'
import { ErrorHttp, noEncontrado, solicitudInvalida } from '../utilidades/errores.js'

export const esquemaCupon = z
  .object({
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, 'Usa de 3 a 30 letras, números o guiones, sin espacios'),
    tipo: z.enum(['PORCENTAJE', 'FIJO', 'ENVIO_GRATIS']),
    valor: z.coerce.number().min(0).max(1_000_000_000).default(0),
    minimo: z.coerce.number().min(0).max(1_000_000_000).nullable().optional(),
    usosMaximos: z.coerce.number().int().min(1).max(1_000_000).nullable().optional(),
    venceEn: z.coerce.date().nullable().optional(),
    activo: z.boolean().default(true),
  })
  .refine((cupon) => cupon.tipo !== 'PORCENTAJE' || (cupon.valor > 0 && cupon.valor <= 100), {
    message: 'El porcentaje va de 1 a 100',
    path: ['valor'],
  })
  .refine((cupon) => cupon.tipo !== 'FIJO' || cupon.valor > 0, { message: 'Escribe cuánto descuenta', path: ['valor'] })

const campos = {
  id: true,
  codigo: true,
  tipo: true,
  valor: true,
  minimo: true,
  usosMaximos: true,
  usos: true,
  venceEn: true,
  activo: true,
  creadoEn: true,
} as const

type CuponBd = Prisma.CuponGetPayload<{ select: typeof campos }>

const serializar = (cupon: CuponBd) => ({
  ...cupon,
  valor: cupon.valor.toString(),
  minimo: cupon.minimo?.toString() ?? null,
})

function siCodigoRepetido(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ErrorHttp(409, 'Ya tienes un cupón con ese código', 'CODIGO_EN_USO', [
      { campo: 'codigo', mensaje: 'Ya tienes un cupón con ese código' },
    ])
  }
  throw error
}

export async function listarCupones(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const cupones = await prisma.cupon.findMany({ where: { tiendaId }, select: campos, orderBy: { creadoEn: 'desc' } })
  res.json({ cupones: cupones.map(serializar) })
}

/** Cuenta los cupones activos (sin `excepto`) y frena si el plan no deja uno más. */
async function revisarLimiteCupones(req: Request, tiendaId: string, excepto?: string) {
  const plan = await planDeLaSesion(req)
  if (plan.cupones === null) return
  if (plan.cupones === 0) throw fueraDelPlan(`Los cupones de descuento no están incluidos en tu plan ${plan.nombre}`)
  const activos = await prisma.cupon.count({ where: { tiendaId, activo: true, ...(excepto ? { id: { not: excepto } } : {}) } })
  if (activos >= plan.cupones) {
    throw fueraDelPlan(`Tu plan ${plan.nombre} admite ${plan.cupones} cupones activos a la vez. Desactiva uno o mejora tu plan.`)
  }
}

export async function crearCupon(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const datos = req.body as z.infer<typeof esquemaCupon>
  if (datos.activo) await revisarLimiteCupones(req, tiendaId)
  const cupon = await prisma.cupon.create({ data: { ...datos, tiendaId }, select: campos }).catch(siCodigoRepetido)
  res.status(201).json({ cupon: serializar(cupon) })
}

export async function actualizarCupon(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const id = req.params.id as string
  const existe = await prisma.cupon.findFirst({ where: { id, tiendaId }, select: { id: true } })
  if (!existe) throw noEncontrado('Ese cupón no existe')
  if ((req.body as z.infer<typeof esquemaCupon>).activo) await revisarLimiteCupones(req, tiendaId, id)
  const cupon = await prisma.cupon
    .update({ where: { id }, data: req.body as z.infer<typeof esquemaCupon>, select: campos })
    .catch(siCodigoRepetido)
  res.json({ cupon: serializar(cupon) })
}

export async function eliminarCupon(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const { count } = await prisma.cupon.deleteMany({ where: { id: req.params.id as string, tiendaId } })
  if (count === 0) throw noEncontrado('Ese cupón no existe')
  res.status(204).end()
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo (lo usan la tienda y la creación del pedido)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultadoCupon {
  codigo: string
  descuento: number
  envioGratis: boolean
  descripcion: string
}

/**
 * Valida un código contra la tienda y el subtotal, y dice cuánto descuenta.
 * Lanza un error con el motivo (vencido, agotado, mínimo no alcanzado…).
 */
export async function evaluarCupon(
  cliente: Prisma.TransactionClient | typeof prisma,
  tiendaId: string,
  codigo: string,
  subtotal: number,
): Promise<ResultadoCupon & { id: string }> {
  const cupon = await cliente.cupon.findUnique({
    where: { tiendaId_codigo: { tiendaId, codigo: codigo.trim().toUpperCase() } },
  })
  const invalido = (mensaje: string) => solicitudInvalida(mensaje, [{ campo: 'cupon', mensaje }])

  if (!cupon || !cupon.activo) throw invalido('Ese código no existe')
  if (cupon.venceEn && cupon.venceEn.getTime() < Date.now()) throw invalido('Ese código ya venció')
  if (cupon.usosMaximos !== null && cupon.usos >= cupon.usosMaximos) throw invalido('Ese código ya se usó todas las veces')
  if (cupon.minimo && subtotal < Number(cupon.minimo)) {
    throw invalido(`Ese código aplica a compras desde $${Number(cupon.minimo).toLocaleString('es-CO')}`)
  }

  const valor = Number(cupon.valor)
  const descuento =
    cupon.tipo === 'PORCENTAJE' ? Math.round((subtotal * valor) / 100) : cupon.tipo === 'FIJO' ? Math.min(valor, subtotal) : 0

  return {
    id: cupon.id,
    codigo: cupon.codigo,
    descuento,
    envioGratis: cupon.tipo === 'ENVIO_GRATIS',
    descripcion:
      cupon.tipo === 'PORCENTAJE'
        ? `${valor}% de descuento`
        : cupon.tipo === 'FIJO'
          ? `$${valor.toLocaleString('es-CO')} de descuento`
          : 'Envío gratis',
  }
}

export const esquemaValidarCupon = z.object({
  codigo: z.string().trim().min(1).max(30),
  subtotal: z.coerce.number().min(0).max(10_000_000_000),
})

/** Para la tienda: muestra el descuento antes de confirmar. El pedido lo vuelve a calcular. */
export async function validarCuponPublico(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const { codigo, subtotal } = req.body as z.infer<typeof esquemaValidarCupon>
  const { id: _id, ...resultado } = await evaluarCupon(prisma, tiendaId, codigo, subtotal)
  res.json({ cupon: resultado })
}
