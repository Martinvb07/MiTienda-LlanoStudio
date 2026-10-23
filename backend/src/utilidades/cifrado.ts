import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { entorno } from '../config/entorno.js'

/**
 * AES-256-GCM para guardar secretos de terceros (llaves de las pasarelas de
 * las tiendas). El texto cifrado lleva el IV y la etiqueta de autenticidad:
 * "v1.<iv>.<etiqueta>.<datos>" en base64url.
 */
const clave = () => createHash('sha256').update(entorno.CLAVE_CIFRADO || `mitienda:${entorno.JWT_SECRETO}`).digest()

export function cifrar(texto: string): string {
  const iv = randomBytes(12)
  const cifrador = createCipheriv('aes-256-gcm', clave(), iv)
  const datos = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()])
  return ['v1', iv, cifrador.getAuthTag(), datos].map((parte) => (typeof parte === 'string' ? parte : parte.toString('base64url'))).join('.')
}

export function descifrar(guardado: string): string {
  const [version, iv, etiqueta, datos] = guardado.split('.')
  if (version !== 'v1' || !iv || !etiqueta || !datos) throw new Error('Formato de cifrado desconocido')
  const descifrador = createDecipheriv('aes-256-gcm', clave(), Buffer.from(iv, 'base64url'))
  descifrador.setAuthTag(Buffer.from(etiqueta, 'base64url'))
  return Buffer.concat([descifrador.update(Buffer.from(datos, 'base64url')), descifrador.final()]).toString('utf8')
}
