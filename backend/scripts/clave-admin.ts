/**
 * Genera el hash de la contraseña del panel de administración:
 *
 *   npm run admin:clave -- "tu-contraseña-larga"
 *
 * Pega el resultado en backend/.env como ADMIN_CONTRASENA_HASH, entre comillas
 * simples (el hash lleva signos $).
 */
import { cifrarContrasena } from '../src/utilidades/contrasenas.js'

const contrasena = process.argv[2]
if (!contrasena || contrasena.length < 12) {
  console.error('Uso: npm run admin:clave -- "una-contraseña-de-al-menos-12-caracteres"')
  process.exit(1)
}

console.warn(`ADMIN_CONTRASENA_HASH='${await cifrarContrasena(contrasena)}'`)
