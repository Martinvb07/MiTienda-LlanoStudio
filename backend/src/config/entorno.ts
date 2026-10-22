import 'dotenv/config'
import { z } from 'zod'

/**
 * Validación de variables de entorno. Si falta algo el proceso muere al
 * arrancar, en vez de fallar a mitad de una petición de un cliente real.
 */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PUERTO: z.coerce.number().int().positive().default(4000),
  // Sólo escucha en local: afuera habla nginx. 0.0.0.0 la expone en todas las interfaces.
  HOST: z.string().default('127.0.0.1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  DOMINIO_BASE: z.string().min(1).default('llanostudio.co'),
  SUBDOMINIO_PANEL: z.string().min(1).default('mitienda'),

  JWT_SECRETO: z.string().min(16, 'JWT_SECRETO debe tener al menos 16 caracteres'),
  ORIGENES_PERMITIDOS: z.string().default('http://localhost:3000'),

  // Secreto compartido con el servidor de Next. Permite que el SSR diga en
  // nombre de qué Host pregunta. Vacío = anulación deshabilitada.
  TOKEN_INTERNO: z.string().default(''),

  // Dominios propios: a dónde deben apuntar. El CNAME sirve para www.tienda.com;
  // la IP, para el dominio raíz (tienda.com) que no admite CNAME.
  CNAME_DOMINIOS: z.string().default('tiendas.llanostudio.co'),
  IP_SERVIDOR: z.string().default(''),

  // Panel de administración de la plataforma (Llano Studio). Sin estos dos
  // valores el acceso de admin queda deshabilitado. El hash se genera con
  // `npm run admin:clave -- "tu-contraseña"`.
  ADMIN_CORREO: z.string().default(''),
  ADMIN_CONTRASENA_HASH: z.string().default(''),

  // Bold: cobro de las suscripciones de la plataforma. Las dos llaves salen del
  // panel de Bold > Integraciones > Llaves de integración. Sin ellas el botón
  // de pagar queda deshabilitado. En pruebas la llave secreta puede ir vacía.
  BOLD_LLAVE_IDENTIDAD: z.string().default(''),
  BOLD_LLAVE_SECRETA: z.string().default(''),
  // A dónde vuelve la persona después de pagar. Vacío = https://<SUBDOMINIO_PANEL>.<DOMINIO_BASE>
  URL_PANEL: z.string().default(''),

  // Correos automáticos (bienvenida, plan por vencer, te extrañamos). Sin
  // SMTP_HOST no se envía nada y el resto sigue funcionando.
  SMTP_HOST: z.string().default(''),
  SMTP_PUERTO: z.coerce.number().int().positive().default(465),
  SMTP_USUARIO: z.string().default(''),
  SMTP_CLAVE: z.string().default(''),
  CORREO_REMITENTE: z.string().default('Mi Tienda <hola@llanostudio.co>'),

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
