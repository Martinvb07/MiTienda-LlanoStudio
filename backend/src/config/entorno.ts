import 'dotenv/config'
import { z } from 'zod'

/**
 * Validación de variables de entorno. Si falta algo el proceso muere al
 * arrancar, en vez de fallar a mitad de una petición de un cliente real.
 */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  DOMINIO_BASE: z.string().min(1).default('llanostudio.co'),
  SUBDOMINIO_PANEL: z.string().min(1).default('mitienda'),

  JWT_SECRETO: z.string().min(16, 'JWT_SECRETO debe tener al menos 16 caracteres'),
  ORIGENES_PERMITIDOS: z.string().default('http://localhost:3000'),

  // Secreto compartido con el servidor de Next. Permite que el SSR diga en
  // nombre de qué Host pregunta. Vacío = anulación deshabilitada.
  TOKEN_INTERNO: z.string().default(''),

  // Cloudflare R2 — opcionales mientras la subida de archivos no esté implementada.
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET: z.string().default(''),
  R2_URL_PUBLICA: z.string().default(''),
})

const resultado = esquema.safeParse(process.env)

if (!resultado.success) {
  const detalle = resultado.error.issues
    .map((problema) => `  · ${problema.path.join('.')}: ${problema.message}`)
    .join('\n')
  console.error(`\nVariables de entorno inválidas:\n${detalle}\n\nRevisa tu archivo .env (parte de .env.ejemplo).\n`)
  process.exit(1)
}

const valores = resultado.data

export const entorno = {
  ...valores,
  esProduccion: valores.NODE_ENV === 'production',
  esDesarrollo: valores.NODE_ENV === 'development',
  origenesPermitidos: valores.ORIGENES_PERMITIDOS.split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
} as const

export type Entorno = typeof entorno
