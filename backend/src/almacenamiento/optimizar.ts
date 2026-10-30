import sharp from 'sharp'
import { ErrorHttp } from '../utilidades/errores.js'

/**
 * Optimización de imágenes antes de guardarlas.
 *
 * Una foto sacada con el celular pesa 3–6 MB; la misma foto a 2000 px en WebP
 * queda en 150–400 KB y se ve igual. En conexiones móviles lentas eso es la
 * diferencia entre una tienda que carga y una que la gente abandona.
 *
 * Los tamaños para cada pantalla los saca después el optimizador de Next
 * (next/image) a partir de esta versión, así que basta con guardar una.
 */

/** Lado mayor de la imagen guardada. Next la achica para cada pantalla. */
export const ANCHO_MAXIMO = 2000

export interface ImagenOptimizada {
  contenido: Buffer
  tipoMime: string
  extension: string
}

export async function optimizarImagen(original: Buffer, tipoMime: string, anchoMaximo = ANCHO_MAXIMO): Promise<ImagenOptimizada> {
  // Los GIF suelen ser animados: se conservan todos los cuadros.
  const animada = tipoMime === 'image/gif' || tipoMime === 'image/webp'

  let contenido: Buffer
  try {
    contenido = await sharp(original, { animated: animada, failOn: 'error' })
      // Gira según el EXIF del celular y después lo descarta (con él se va la ubicación GPS).
      .rotate()
      .resize({ width: anchoMaximo, height: anchoMaximo, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()
  } catch {
    throw new ErrorHttp(415, 'No pudimos leer esa imagen. Prueba con otra foto en JPG, PNG o WebP.', 'IMAGEN_INVALIDA')
  }

  // Una imagen ya liviana en WebP puede crecer al recomprimirla: entonces se deja tal cual.
  if (tipoMime === 'image/webp' && contenido.length >= original.length) {
    return { contenido: original, tipoMime, extension: 'webp' }
  }
  return { contenido, tipoMime: 'image/webp', extension: 'webp' }
}
