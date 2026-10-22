import { execFile, spawn } from 'node:child_process'
import { statfs } from 'node:fs/promises'
import os from 'node:os'
import { promisify } from 'node:util'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { entorno } from '../../config/entorno.js'
import { prisma } from '../../config/prisma.js'
import { conexionRedis } from '../../config/redis.js'
import { erroresRecientes } from '../../utilidades/erroresRecientes.js'
import { ErrorHttp, noEncontrado } from '../../utilidades/errores.js'
import { registrarActividad } from '../../servicios/admins.servicio.js'
import { guardarAjuste, leerAjuste } from '../../servicios/plataforma.servicio.js'
import { smtpConfigurado } from '../../servicios/correos.servicio.js'
import { boldConfigurado } from '../../servicios/suscripciones.servicio.js'
import { registro } from '../../utilidades/registro.js'

const ejecutar = promisify(execFile)

async function medir<T>(tarea: () => Promise<T>) {
  const inicio = performance.now()
  try {
    await tarea()
    return { ok: true, ms: Math.round(performance.now() - inicio) }
  } catch (error) {
    return { ok: false, ms: Math.round(performance.now() - inicio), error: (error as Error).message }
  }
}

/** Salud del servidor: base de datos, Redis, disco, memoria y versión desplegada. */
export async function estadoSistema(_req: Request, res: Response): Promise<void> {
  const [postgres, redis, disco, version] = await Promise.all([
    medir(() => prisma.$queryRaw`SELECT 1`),
    medir(() => Promise.race([conexionRedis.ping(), new Promise((_, no) => setTimeout(() => no(new Error('Sin respuesta')), 2000))])),
    statfs(process.cwd()).catch(() => null),
    ejecutar('git', ['log', '-1', '--format=%h|%s|%cI'], { cwd: process.cwd(), timeout: 3000 })
      .then(({ stdout }) => {
        const [sha, mensaje, fecha] = stdout.trim().split('|')
        return { sha, mensaje, fecha }
      })
      .catch(() => null),
  ])

  res.json({
    postgres,
    redis,
    disco: disco ? { total: disco.blocks * disco.bsize, libre: disco.bavail * disco.bsize } : null,
    memoria: { total: os.totalmem(), libre: os.freemem(), proceso: process.memoryUsage().rss },
    carga: os.loadavg(),
    activoDesde: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    node: process.version,
    version,
    servicios: { bold: boldConfigurado(), correo: smtpConfigurado(), r2: Boolean(entorno.R2_BUCKET && entorno.R2_ACCESS_KEY_ID) },
    errores: erroresRecientes().length,
  })
}

export function listarErrores(_req: Request, res: Response): void {
  res.json({ errores: erroresRecientes() })
}

/**
 * Respaldo completo de la base de datos con pg_dump, descargado al navegador.
 * Necesita pg_dump instalado en el servidor (viene con postgresql-client).
 */
export async function descargarRespaldo(req: Request, res: Response): Promise<void> {
  const url = new URL(entorno.DATABASE_URL)
  url.search = '' // pg_dump no entiende ?schema=public
  const proceso = spawn('pg_dump', ['--no-owner', '--no-privileges', '--format=plain', url.toString()])

  let empezo = false
  proceso.on('error', (error) => {
    registro.error({ err: error }, 'No se pudo ejecutar pg_dump')
    if (!empezo) res.status(501).json({ error: { codigo: 'SIN_PG_DUMP', mensaje: 'El servidor no tiene pg_dump instalado (apt install postgresql-client).' } })
  })
  proceso.stdout.once('data', () => {
    empezo = true
    registrarActividad(req, 'Descargó un respaldo de la base de datos')
  })
  res.setHeader('Content-Type', 'application/sql; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="mitienda-respaldo-${new Date().toISOString().slice(0, 16).replace(':', '')}.sql"`)
  proceso.stdout.pipe(res)
  proceso.stderr.on('data', (dato: Buffer) => registro.warn({ salida: dato.toString() }, 'pg_dump'))
}

// ── Subdominios bloqueados ──

export const esquemaBloqueo = z.object({
  subdominio: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,63}$/, 'Sólo letras, números y guiones'),
  motivo: z.string().trim().max(120).optional(),
})

export async function listarBloqueados(_req: Request, res: Response): Promise<void> {
  res.json({ bloqueados: await prisma.subdominioBloqueado.findMany({ orderBy: { creadoEn: 'desc' } }) })
}

export async function bloquearSubdominio(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaBloqueo>
  const enUso = await prisma.tenant.findUnique({ where: { subdominio: datos.subdominio }, select: { nombre: true } })
  const bloqueado = await prisma.subdominioBloqueado.upsert({
    where: { subdominio: datos.subdominio },
    create: datos,
    update: { motivo: datos.motivo },
  })
  registrarActividad(req, 'Bloqueó un subdominio', datos.subdominio)
  res.status(201).json({ bloqueado, aviso: enUso ? `Ya lo usa la tienda ${enUso.nombre}: el bloqueo aplica a nuevos registros.` : null })
}

export async function desbloquearSubdominio(req: Request, res: Response): Promise<void> {
  await prisma.subdominioBloqueado.deleteMany({ where: { subdominio: req.params.subdominio as string } })
  registrarActividad(req, 'Desbloqueó un subdominio', req.params.subdominio as string)
  res.status(204).end()
}

// ── Dominios propios de todas las tiendas ──

export async function listarTodosLosDominios(_req: Request, res: Response): Promise<void> {
  const dominios = await prisma.dominioPropio.findMany({
    orderBy: { creadoEn: 'desc' },
    include: { tenant: { select: { id: true, nombre: true, subdominio: true, plan: true } } },
  })
  res.json({ dominios })
}

export async function quitarDominioAdmin(req: Request, res: Response): Promise<void> {
  const dominio = await prisma.dominioPropio.delete({ where: { id: req.params.id as string } }).catch(() => null)
  if (!dominio) throw noEncontrado('Ese dominio no existe')
  registrarActividad(req, 'Quitó un dominio propio', dominio.dominio, dominio.tenantId)
  res.status(204).end()
}

// ── Modo mantenimiento ──

export const esquemaMantenimiento = z.object({
  registrosCerrados: z.boolean(),
  mensaje: z.string().trim().min(1).max(240),
})

export async function leerMantenimiento(_req: Request, res: Response): Promise<void> {
  res.json(await leerAjuste('mantenimiento'))
}

export async function guardarMantenimiento(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaMantenimiento>
  await guardarAjuste('mantenimiento', datos)
  registrarActividad(req, datos.registrosCerrados ? 'Cerró los registros' : 'Abrió los registros')
  res.json(datos)
}

export { ErrorHttp }
