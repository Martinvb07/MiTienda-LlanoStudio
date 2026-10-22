import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import type { Prisma } from '../../generado/prisma/client.js'
import { ErrorHttp, noEncontrado } from '../../utilidades/errores.js'
import { registrarActividad } from '../../servicios/admins.servicio.js'
import { guardarAjuste, leerAjuste } from '../../servicios/plataforma.servicio.js'

// ── Blog ──

const seccion = z.object({
  titulo: z.string().trim().max(160).optional(),
  parrafos: z.array(z.string().trim().min(1).max(4000)).max(20),
  lista: z.array(z.string().trim().min(1).max(400)).max(20).optional(),
})

export const esquemaArticulo = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Sólo minúsculas, números y guiones'),
  titulo: z.string().trim().min(1).max(160),
  categoria: z.string().trim().min(1).max(40),
  resumen: z.string().trim().min(1).max(400),
  portada: z.string().trim().min(1).max(500),
  minutos: z.coerce.number().int().min(1).max(60),
  secciones: z.array(seccion).min(1).max(30),
  publicado: z.boolean().default(true),
  fecha: z.coerce.date().optional(),
})

export async function listarArticulosAdmin(_req: Request, res: Response): Promise<void> {
  res.json({ articulos: await prisma.articulo.findMany({ orderBy: { fecha: 'desc' } }) })
}

export async function guardarArticulo(req: Request, res: Response): Promise<void> {
  const { secciones, ...datos } = req.body as z.infer<typeof esquemaArticulo>
  const id = req.params.id as string | undefined
  const otro = await prisma.articulo.findUnique({ where: { slug: datos.slug }, select: { id: true } })
  if (otro && otro.id !== id) {
    throw new ErrorHttp(409, 'Ya hay un artículo con esa dirección', 'SLUG_EN_USO', [
      { campo: 'slug', mensaje: 'Ya hay un artículo con esa dirección' },
    ])
  }
  const data = { ...datos, secciones: secciones as Prisma.InputJsonValue }
  const articulo = id
    ? await prisma.articulo.update({ where: { id }, data })
    : await prisma.articulo.create({ data })
  registrarActividad(req, id ? 'Editó un artículo' : 'Publicó un artículo', articulo.titulo)
  res.status(id ? 200 : 201).json({ articulo })
}

export async function eliminarArticulo(req: Request, res: Response): Promise<void> {
  const articulo = await prisma.articulo.delete({ where: { id: req.params.id as string } }).catch(() => null)
  if (!articulo) throw noEncontrado('Ese artículo no existe')
  registrarActividad(req, 'Eliminó un artículo', articulo.titulo)
  res.status(204).end()
}

// ── Textos de la web: preguntas de precios, testimonios y respuestas rápidas del chat ──

const pregunta = z.object({ pregunta: z.string().trim().min(1).max(200), respuesta: z.string().trim().min(1).max(2000) })

export const esquemaTextos = z.object({
  preguntasPrecios: z.array(pregunta).max(30),
  testimonios: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(80),
        tienda: z.string().trim().min(1).max(80),
        texto: z.string().trim().min(1).max(600),
        foto: z.string().trim().max(500).optional(),
      }),
    )
    .max(20),
  opcionesSoporte: z
    .array(pregunta.extend({ enlace: z.string().trim().max(300).optional() }))
    .max(12),
})

export async function leerTextos(_req: Request, res: Response): Promise<void> {
  const [preguntasPrecios, testimonios, opcionesSoporte] = await Promise.all([
    leerAjuste('preguntasPrecios'),
    leerAjuste('testimonios'),
    leerAjuste('opcionesSoporte'),
  ])
  res.json({ preguntasPrecios, testimonios, opcionesSoporte })
}

export async function guardarTextos(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaTextos>
  await Promise.all([
    guardarAjuste('preguntasPrecios', datos.preguntasPrecios),
    guardarAjuste('testimonios', datos.testimonios),
    guardarAjuste('opcionesSoporte', datos.opcionesSoporte),
  ])
  registrarActividad(req, 'Editó los textos de la web')
  res.json(datos)
}
