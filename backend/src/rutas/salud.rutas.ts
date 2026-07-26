import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { conexionRedis } from '../config/redis.js'

const enrutador = Router()

/**
 * Sonda de vida. Deliberadamente fuera de `resolverTenant`: la consultan el
 * monitor de uptime y el despliegue por IP, sin un Host de tenant válido.
 */
enrutador.get('/', (_req, res) => {
  res.json({ estado: 'ok', hora: new Date().toISOString() })
})

/** Comprobación profunda: confirma que Postgres y Redis responden. */
enrutador.get('/detallada', async (_req, res) => {
  const [baseDatos, redis] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    conexionRedis.ping(),
  ])

  const dependencias = {
    postgres: baseDatos.status === 'fulfilled' ? 'ok' : 'caído',
    redis: redis.status === 'fulfilled' ? 'ok' : 'caído',
  }
  const todoBien = Object.values(dependencias).every((estado) => estado === 'ok')

  res.status(todoBien ? 200 : 503).json({ estado: todoBien ? 'ok' : 'degradado', dependencias })
})

export default enrutador
