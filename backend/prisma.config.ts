import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

/**
 * Configuración del CLI de Prisma (migrate, studio, introspect).
 *
 * Desde Prisma 7 la cadena de conexión ya no vive en schema.prisma. El CLI la
 * lee de aquí; la aplicación en runtime la recibe por driver adapter en
 * src/config/prisma.ts. Prisma 7 tampoco carga .env solo, de ahí el import
 * de 'dotenv/config' en la primera línea.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
