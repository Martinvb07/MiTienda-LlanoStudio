import { S3Client } from '@aws-sdk/client-s3'
import { entorno } from '../config/entorno.js'

/**
 * Cloudflare R2 — almacenamiento de logos y fotos de producto.
 *
 * R2 habla el protocolo de S3, así que se usa el SDK de AWS apuntando al
 * endpoint de la cuenta. La ventaja frente a S3 es que no cobra egreso: las
 * tiendas sirven imágenes sin que el tráfico dispare la factura.
 *
 * Estado: cliente y configuración listos; las operaciones todavía no.
 */

let clienteMemorizado: S3Client | null = null

/** true cuando hay credenciales suficientes para hablar con R2. */
export function r2Configurado(): boolean {
  return Boolean(
    entorno.R2_ACCOUNT_ID &&
      entorno.R2_ACCESS_KEY_ID &&
      entorno.R2_SECRET_ACCESS_KEY &&
      entorno.R2_BUCKET,
  )
}

export function obtenerClienteR2(): S3Client {
  if (!r2Configurado()) {
    throw new Error('Cloudflare R2 no está configurado: revisa las variables R2_* en tu .env')
  }

  clienteMemorizado ??= new S3Client({
    // R2 no tiene regiones al estilo de AWS.
    region: 'auto',
    endpoint: `https://${entorno.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: entorno.R2_ACCESS_KEY_ID,
      secretAccessKey: entorno.R2_SECRET_ACCESS_KEY,
    },
  })

  return clienteMemorizado
}

/**
 * Claves de objeto siempre prefijadas por tenant. Mantiene los medios de cada
 * cliente separados dentro del bucket y hace trivial borrar todo al dar de
 * baja una cuenta.
 */
export function claveMedio(tenantId: string, tiendaId: string, nombreArchivo: string): string {
  return `tenants/${tenantId}/tiendas/${tiendaId}/${nombreArchivo}`
}

/** URL pública de un objeto, servida por el dominio conectado al bucket. */
export function urlPublica(clave: string): string {
  if (!entorno.R2_URL_PUBLICA) {
    throw new Error('Falta R2_URL_PUBLICA para construir URLs públicas')
  }
  return `${entorno.R2_URL_PUBLICA.replace(/\/$/, '')}/${clave}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Operaciones pendientes de implementar
//
// El plan es no proxear archivos por la API: el panel pide una URL firmada,
// sube directo a R2 desde el navegador y luego avisa al backend, que encola la
// optimización (src/colas → trabajadores/imagenes.trabajador.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface OpcionesSubidaFirmada {
  tenantId: string
  tiendaId: string
  nombreArchivo: string
  tipoMime: string
  /** Validez de la URL en segundos. */
  expiraEn?: number
}

/** TODO: firmar un PutObjectCommand con @aws-sdk/s3-request-presigner. */
export function crearUrlSubidaFirmada(_opciones: OpcionesSubidaFirmada): Promise<string> {
  return Promise.reject(new Error('crearUrlSubidaFirmada aún no está implementada'))
}

/** TODO: PutObjectCommand para subidas hechas desde el propio servidor. */
export function subirObjeto(_clave: string, _contenido: Uint8Array, _tipoMime: string): Promise<void> {
  return Promise.reject(new Error('subirObjeto aún no está implementada'))
}

/** TODO: DeleteObjectCommand, al borrar un producto o una tienda. */
export function eliminarObjeto(_clave: string): Promise<void> {
  return Promise.reject(new Error('eliminarObjeto aún no está implementada'))
}
