'use client'

import { useState, type ReactNode } from 'react'
import Image, { type ImageProps } from 'next/image'

/**
 * Foto de producto que, si no carga (enlace roto, archivo borrado), muestra
 * `respaldo` en vez del ícono de imagen rota del navegador.
 */
export function FotoSegura({ respaldo = null, ...props }: ImageProps & { respaldo?: ReactNode }) {
  const [fallo, setFallo] = useState(false)
  if (fallo) return <>{respaldo}</>
  // eslint-disable-next-line jsx-a11y/alt-text -- el alt llega en props
  return <Image {...props} onError={() => setFallo(true)} />
}
