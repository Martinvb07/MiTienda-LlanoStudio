/**
 * Los últimos errores 500 de la API, en memoria, para verlos desde el admin
 * sin entrar al servidor. Se pierden al reiniciar: para eso están los logs.
 */
export interface ErrorReciente {
  hora: string
  /** api = el servidor; web = el navegador de alguien (lo reporta el frontend). */
  origen?: 'api' | 'web' | 'proceso'
  metodo: string
  ruta: string
  mensaje: string
  pila?: string
}

const LIMITE = 100
const errores: ErrorReciente[] = []

export function anotarError(error: ErrorReciente) {
  errores.unshift(error)
  if (errores.length > LIMITE) errores.length = LIMITE
}

export const erroresRecientes = () => [...errores]
