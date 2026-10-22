import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { noEncontrado } from '../../utilidades/errores.js'
import { registrarActividad } from '../../servicios/admins.servicio.js'
import { guardarAjuste, leerAjuste } from '../../servicios/plataforma.servicio.js'
import { enviarCorreoDirecto, plantillaCorreo, smtpConfigurado } from '../../servicios/correos.servicio.js'
import { ErrorHttp } from '../../utilidades/errores.js'

const PLAN = z.enum(['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO'])

// ── Anuncios ──

export const esquemaAnuncio = z.object({
  titulo: z.string().trim().min(1).max(120),
  cuerpo: z.string().trim().max(1000).default(''),
  tipo: z.enum(['CAMPANA', 'BARRA']),
  planes: z.array(PLAN).default([]),
  activo: z.boolean().default(true),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().nullable().default(null),
})

export async function listarAnuncios(_req: Request, res: Response): Promise<void> {
  res.json({ anuncios: await prisma.anuncio.findMany({ orderBy: { creadoEn: 'desc' } }) })
}

export async function guardarAnuncio(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaAnuncio>
  const id = req.params.id as string | undefined
  const anuncio = id
    ? await prisma.anuncio.update({ where: { id }, data: datos })
    : await prisma.anuncio.create({ data: datos })
  registrarActividad(req, id ? 'Editó un anuncio' : 'Publicó un anuncio', anuncio.titulo)
  res.status(id ? 200 : 201).json({ anuncio })
}

export async function eliminarAnuncio(req: Request, res: Response): Promise<void> {
  const anuncio = await prisma.anuncio.delete({ where: { id: req.params.id as string } }).catch(() => null)
  if (!anuncio) throw noEncontrado('Ese anuncio no existe')
  registrarActividad(req, 'Eliminó un anuncio', anuncio.titulo)
  res.status(204).end()
}

// ── Novedades ──

export const esquemaNovedad = z.object({
  titulo: z.string().trim().min(1).max(120),
  cuerpo: z.string().trim().min(1).max(3000),
  etiqueta: z.string().trim().max(24).nullable().default(null),
  publicadaEn: z.coerce.date().optional(),
})

export async function listarNovedades(_req: Request, res: Response): Promise<void> {
  res.json({ novedades: await prisma.novedad.findMany({ orderBy: { publicadaEn: 'desc' } }) })
}

export async function guardarNovedad(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaNovedad>
  const id = req.params.id as string | undefined
  const novedad = id
    ? await prisma.novedad.update({ where: { id }, data: datos })
    : await prisma.novedad.create({ data: datos })
  registrarActividad(req, id ? 'Editó una novedad' : 'Publicó una novedad', novedad.titulo)
  res.status(id ? 200 : 201).json({ novedad })
}

export async function eliminarNovedad(req: Request, res: Response): Promise<void> {
  const novedad = await prisma.novedad.delete({ where: { id: req.params.id as string } }).catch(() => null)
  if (!novedad) throw noEncontrado('Esa novedad no existe')
  res.status(204).end()
}

// ── Plantillas de WhatsApp y correos ──

export const esquemaPlantillas = z.object({
  plantillas: z
    .array(z.object({ titulo: z.string().trim().min(1).max(60), texto: z.string().trim().min(1).max(1000) }))
    .max(30),
})

export async function leerPlantillasWhatsapp(_req: Request, res: Response): Promise<void> {
  res.json({ plantillas: await leerAjuste('plantillasWhatsapp') })
}

export async function guardarPlantillasWhatsapp(req: Request, res: Response): Promise<void> {
  const { plantillas } = req.body as z.infer<typeof esquemaPlantillas>
  await guardarAjuste('plantillasWhatsapp', plantillas)
  registrarActividad(req, 'Editó las plantillas de WhatsApp')
  res.json({ plantillas })
}

export const esquemaCorreos = z.object({
  bienvenida: z.boolean(),
  vencePronto: z.boolean(),
  teExtranamos: z.boolean(),
})

export async function leerCorreos(_req: Request, res: Response): Promise<void> {
  const [ajustes, enviados] = await Promise.all([
    leerAjuste('correos'),
    prisma.correoEnviado.groupBy({ by: ['tipo'], _count: { _all: true } }),
  ])
  res.json({
    configurado: smtpConfigurado(),
    ajustes,
    enviados: Object.fromEntries(enviados.map((fila) => [fila.tipo, fila._count._all])),
  })
}

export async function guardarCorreos(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaCorreos>
  await guardarAjuste('correos', datos)
  registrarActividad(req, 'Cambió los correos automáticos')
  res.json({ ajustes: datos })
}

/** Manda un correo de prueba a quien está conectado. */
export async function probarCorreo(req: Request, res: Response): Promise<void> {
  if (!smtpConfigurado()) throw new ErrorHttp(400, 'Falta configurar el SMTP en el .env del servidor', 'SIN_SMTP')
  await enviarCorreoDirecto(
    req.admin!.email,
    'Correo de prueba de Mi Tienda',
    plantillaCorreo('Los correos funcionan', ['Si te llegó esto, la configuración de correo del servidor está bien.']),
  )
  res.json({ ok: true })
}
