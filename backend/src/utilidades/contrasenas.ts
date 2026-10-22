import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (
  contrasena: string,
  sal: Buffer,
  largo: number,
) => Promise<Buffer>

const LARGO_CLAVE = 64

/**
 * Hash de contraseñas con scrypt, que viene en Node: no hace falta una
 * dependencia nativa como bcrypt para tener un derivador lento y con sal.
 *
 * Formato guardado: "scrypt$<sal en base64>$<hash en base64>".
 */
export async function cifrarContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(16)
  const hash = await scryptAsync(contrasena, sal, LARGO_CLAVE)
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`
}

export async function verificarContrasena(contrasena: string, guardado: string): Promise<boolean> {
  const [algoritmo, salTexto, hashTexto] = guardado.split('$')
  if (algoritmo !== 'scrypt' || !salTexto || !hashTexto) return false

  const esperado = Buffer.from(hashTexto, 'base64')
  const calculado = await scryptAsync(contrasena, Buffer.from(salTexto, 'base64'), esperado.length)

  // Comparación en tiempo constante: no deja adivinar el hash por lo que tarda.
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado)
}
