import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const rutaArchivo = fileURLToPath(import.meta.url)
const rutaDirectorio = dirname(rutaArchivo)

const compat = new FlatCompat({ baseDirectory: rutaDirectorio })

const configuracion = [
  // El comodín cubre también las carpetas de compilación alternativas que se
  // usan para verificar sin pisar al servidor de desarrollo.
  { ignores: ['.next*/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default configuracion
