/**
 * Imágenes subidas en desarrollo sin R2: las sirve la API en
 * /api/medios-locales a través del proxy de Next. El optimizador de imágenes
 * no pasa por ese proxy, así que se muestran tal cual.
 */
export function esMedioLocal(src: string): boolean {
  return src.startsWith('/api/')
}
