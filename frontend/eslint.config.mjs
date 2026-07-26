import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const rutaArchivo = fileURLToPath(import.meta.url)
const rutaDirectorio = dirname(rutaArchivo)

const compat = new FlatCompat({ baseDirectory: rutaDirectorio })

const configuracion = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default configuracion
