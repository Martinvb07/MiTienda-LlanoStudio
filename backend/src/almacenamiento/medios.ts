import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ErrorHttp } from '../utilidades/errores.js'
import { claveMedio, r2Configurado, subirObjeto, urlPublica } from './r2.js'

/** Formatos que acepta el panel para logos, portadas y fotos de producto. */
export const TIPOS_IMAGEN: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

/**
 * Carpeta de medios sin R2. Sin credenciales de R2 los archivos se guardan
 * aquí y se sirven en /api/medios-locales (en el VPS, nginx directo desde la
 * carpeta). Sirve para desarrollo y para un servidor de prueba; con muchas
 * tiendas conviene R2, que no consume disco del VPS.
 */
export const CARPETA_MEDIOS_LOCALES = path.resolve(import.meta.dirname, '../../.medios')
export const RUTA_MEDIOS_LOCALES = '/api/medios-locales'

/** Guarda una imagen de una tienda y devuelve su URL pública. */
export async function guardarImagen(
  tenantId: string,
  tiendaId: string,
  contenido: Buffer,
  tipoMime: string,
): Promise<string> {
  const extension = TIPOS_IMAGEN[tipoMime]
  if (!extension) throw new ErrorHttp(415, 'Formato de imagen no admitido', 'FORMATO_NO_ADMITIDO')

  const clave = claveMedio(tenantId, tiendaId, `${randomUUID()}.${extension}`)

  if (r2Configurado()) {
    await subirObjeto(clave, contenido, tipoMime)
    return urlPublica(clave)
  }

  const destino = path.join(CARPETA_MEDIOS_LOCALES, clave)
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(destino, contenido)
  return `${RUTA_MEDIOS_LOCALES}/${clave}`
}
