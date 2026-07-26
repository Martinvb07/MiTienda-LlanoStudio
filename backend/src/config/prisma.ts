import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generado/prisma/client.js'
import { entorno } from './entorno.js'

/**
 * Cliente único de Prisma.
 *
 * Desde Prisma 7 la conexión entra por driver adapter en vez de leerse del
 * schema, así que la cadena viaja desde `entorno` (ya validada).
 */
const adaptador = new PrismaPg({ connectionString: entorno.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter: adaptador,
  log: entorno.esProduccion ? ['warn', 'error'] : ['warn', 'error'],
})

export async function desconectarPrisma(): Promise<void> {
  await prisma.$disconnect()
}
