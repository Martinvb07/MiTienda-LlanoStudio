import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { leerAjuste } from '../servicios/plataforma.servicio.js'

const enrutador = Router()

/**
 * Contenido público de la web que se edita desde el admin. Lo consume el SSR
 * de Next con caché corta; si falla, la web usa lo que trae en el código.
 */
enrutador.get('/sitio', async (_req, res) => {
  const [preguntasPrecios, testimonios, opcionesSoporte, mantenimiento] = await Promise.all([
    leerAjuste('preguntasPrecios'),
    leerAjuste('testimonios'),
    leerAjuste('opcionesSoporte'),
    leerAjuste('mantenimiento'),
  ])
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ preguntasPrecios, testimonios, opcionesSoporte, mantenimiento })
})

enrutador.get('/articulos', async (_req, res) => {
  const articulos = await prisma.articulo.findMany({
    where: { publicado: true, fecha: { lte: new Date() } },
    orderBy: { fecha: 'desc' },
  })
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ articulos })
})

export default enrutador
