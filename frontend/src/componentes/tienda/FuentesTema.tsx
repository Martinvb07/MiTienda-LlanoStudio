import type { TemaTienda } from '@/tipos/tienda'
import { urlFuentes } from '@/utilidades/fuentes'

/**
 * Carga de Google Fonts sólo las familias que eligió la tienda. React sube el
 * <link> al <head> y no lo repite aunque se pinte en varias páginas.
 */
export function FuentesTema({ tema }: { tema: TemaTienda }) {
  const url = urlFuentes(tema.fuenteTitulos, tema.fuenteCuerpo)
  if (!url) return null
  return <link rel="stylesheet" href={url} precedence="default" />
}
