import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ErrorHttp } from '../utilidades/errores.js'
import { entorno } from '../config/entorno.js'
import { claveMedio, leerObjeto, r2Configurado, subirObjeto, urlPublica } from './r2.js'
import { optimizarImagen } from './optimizar.js'

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

/**
 * Guarda una imagen de una tienda y devuelve su URL pública. Se optimiza aquí
 * mismo (WebP, 2000 px como mucho, sin EXIF): con sharp tarda unos cientos de
 * milisegundos y así la foto ya queda liviana desde la primera visita.
 */
export async function guardarImagen(
  tenantId: string,
  tiendaId: string,
  contenido: Buffer,
  tipoMime: string,
): Promise<string> {
  if (!TIPOS_IMAGEN[tipoMime]) throw new ErrorHttp(415, 'Formato de imagen no admitido', 'FORMATO_NO_ADMITIDO')

  const optimizada = await optimizarImagen(contenido, tipoMime)
  const clave = claveMedio(tenantId, tiendaId, `${randomUUID()}.${optimizada.extension}`)
  return guardarObjeto(clave, optimizada.contenido, optimizada.tipoMime)
}

/** Escribe en R2 o, sin R2, en la carpeta local. Devuelve la URL pública. */
export async function guardarObjeto(clave: string, contenido: Buffer, tipoMime: string): Promise<string> {
  if (r2Configurado()) {
    await subirObjeto(clave, contenido, tipoMime)
    return urlPublica(clave)
  }

  const destino = path.join(CARPETA_MEDIOS_LOCALES, clave)
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(destino, contenido)
  return `${RUTA_MEDIOS_LOCALES}/${clave}`
}

/**
 * Clave de almacenamiento de una URL que generó guardarObjeto, o null si la URL
 * es de afuera (una foto pegada desde otro sitio).
 */
export function claveDeUrl(url: string): string | null {
  if (url.startsWith(`${RUTA_MEDIOS_LOCALES}/`)) return url.slice(RUTA_MEDIOS_LOCALES.length + 1)
  const base = entorno.R2_URL_PUBLICA.replace(/\/$/, '')
  if (base && url.startsWith(`${base}/`)) return url.slice(base.length + 1)
  return null
}

/** Lee un medio guardado, venga de R2 o de la carpeta local. */
export async function leerMedio(clave: string): Promise<Buffer> {
  if (r2Configurado()) return leerObjeto(clave)
  const ruta = path.resolve(CARPETA_MEDIOS_LOCALES, clave)
  // La clave sale de la base de datos, pero igual no se deja salir de la carpeta.
  if (!ruta.startsWith(CARPETA_MEDIOS_LOCALES + path.sep)) throw new Error(`Clave de medio inválida: ${clave}`)
  return readFile(ruta)
}
