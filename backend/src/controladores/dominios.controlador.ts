import { promises as dns } from 'node:dns'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { entorno } from '../config/entorno.js'
import { planDeLaSesion } from '../servicios/sesion.servicio.js'
import { ErrorHttp, noEncontrado } from '../utilidades/errores.js'
import { fueraDelPlan } from '../utilidades/planes.js'

export const esquemaDominio = z.object({
  dominio: z
    .string()
    .trim()
    .toLowerCase()
    .transform((valor) => valor.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, ''))
    .pipe(
      z
        .string()
        .max(253)
        .regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, 'Escribe un dominio como www.tutienda.com'),
    ),
})

const campos = { id: true, dominio: true, verificado: true, esPrincipal: true, creadoEn: true } as const

async function revisarPlan(req: Request) {
  const plan = await planDeLaSesion(req)
  if (!plan.dominioPropio) throw fueraDelPlan(`El dominio propio no está incluido en tu plan ${plan.nombre}`)
}

/** Instrucciones de DNS que el panel le muestra a la dueña. */
const instrucciones = () => ({ cname: entorno.CNAME_DOMINIOS, ip: entorno.IP_SERVIDOR || null })

export async function listarDominios(req: Request, res: Response): Promise<void> {
  const dominios = await prisma.dominioPropio.findMany({
    where: { tenantId: req.sesion!.tenantId },
    select: campos,
    orderBy: { creadoEn: 'asc' },
  })
  res.json({ dominios, instrucciones: instrucciones() })
}

export async function agregarDominio(req: Request, res: Response): Promise<void> {
  await revisarPlan(req)
  const { dominio } = req.body as z.infer<typeof esquemaDominio>
  if (dominio.endsWith(`.${entorno.DOMINIO_BASE}`) || dominio === entorno.DOMINIO_BASE) {
    throw new ErrorHttp(400, 'Ese ya es un dominio de Mi Sitio', 'DOMINIO_INVALIDO', [
      { campo: 'dominio', mensaje: 'Ese ya es un dominio de Mi Sitio' },
    ])
  }
  const existente = await prisma.dominioPropio.findUnique({ where: { dominio }, select: { id: true } })
  if (existente) {
    throw new ErrorHttp(409, 'Ese dominio ya está conectado a una tienda', 'DOMINIO_EN_USO', [
      { campo: 'dominio', mensaje: 'Ese dominio ya está conectado a una tienda' },
    ])
  }
  const cuenta = await prisma.dominioPropio.count({ where: { tenantId: req.sesion!.tenantId } })
  const creado = await prisma.dominioPropio.create({
    data: { tenantId: req.sesion!.tenantId, dominio, esPrincipal: cuenta === 0 },
    select: campos,
  })
  res.status(201).json({ dominio: creado })
}

/** ¿El DNS del dominio ya apunta a la plataforma? */
export async function apuntaANosotros(dominio: string): Promise<boolean> {
  const objetivo = entorno.CNAME_DOMINIOS.toLowerCase()
  const cnames = await dns.resolveCname(dominio).catch(() => [] as string[])
  if (cnames.some((cname) => cname.toLowerCase().replace(/\.$/, '') === objetivo)) return true

  const ips = await dns.resolve4(dominio).catch(() => [] as string[])
  if (ips.length === 0) return false
  if (entorno.IP_SERVIDOR && ips.includes(entorno.IP_SERVIDOR)) return true
  const nuestras = await dns.resolve4(objetivo).catch(() => [] as string[])
  return ips.some((ip) => nuestras.includes(ip))
}

export async function verificarDominio(req: Request, res: Response): Promise<void> {
  await revisarPlan(req)
  const registro = await prisma.dominioPropio.findFirst({
    where: { id: req.params.id as string, tenantId: req.sesion!.tenantId },
    select: { id: true, dominio: true },
  })
  if (!registro) throw noEncontrado('Ese dominio no está en tu tienda')

  const verificado = await apuntaANosotros(registro.dominio)
  const dominio = await prisma.dominioPropio.update({ where: { id: registro.id }, data: { verificado }, select: campos })
  res.json({ dominio })
}

export async function quitarDominio(req: Request, res: Response): Promise<void> {
  const { count } = await prisma.dominioPropio.deleteMany({
    where: { id: req.params.id as string, tenantId: req.sesion!.tenantId },
  })
  if (count === 0) throw noEncontrado('Ese dominio no está en tu tienda')
  res.status(204).end()
}

/**
 * Revisa solos los dominios que aún no apuntan, para que la dueña no tenga que
 * volver a darle a "Verificar" cuando el DNS por fin propague.
 */
export async function verificarDominiosPendientes() {
  const pendientes = await prisma.dominioPropio.findMany({
    where: { verificado: false, creadoEn: { gt: new Date(Date.now() - 14 * 86_400_000) } },
    select: { id: true, dominio: true },
    take: 100,
  })
  for (const pendiente of pendientes) {
    if (await apuntaANosotros(pendiente.dominio)) {
      await prisma.dominioPropio.update({ where: { id: pendiente.id }, data: { verificado: true } })
    }
  }
}

/**
 * Lista interna para el VPS (deploy/dominios-propios.sh): los dominios
 * verificados de tiendas activas cuyo plan incluye dominio propio. Texto
 * plano, uno por línea. Sólo responde con el token interno.
 */
export async function dominiosParaServidor(req: Request, res: Response): Promise<void> {
  if (!entorno.TOKEN_INTERNO || req.header('x-mitienda-interno') !== entorno.TOKEN_INTERNO) throw noEncontrado()
  const filas = await prisma.dominioPropio.findMany({
    where: { verificado: true, tenant: { activo: true, plan: { in: ['NEGOCIO', 'PRO'] } } },
    select: { dominio: true },
    orderBy: { dominio: 'asc' },
  })
  res.type('text/plain').send(filas.map((fila) => fila.dominio).join('\n'))
}
