import type { EnlaceBio } from '@/tipos/bloques'
import type { AjustesTienda } from '@/tipos/tienda'
import { enlaceWhatsapp } from './whatsapp'

const usuario = (valor: string) => valor.trim().replace(/^@/, '')

/** A dónde lleva una red con sólo el usuario o el número. */
function deRed(icono: string | undefined, valor: string): string | null {
  switch (icono) {
    case 'whatsapp':
      return enlaceWhatsapp(valor)
    case 'instagram':
      return `https://instagram.com/${usuario(valor)}`
    case 'tiktok':
      return `https://tiktok.com/@${usuario(valor)}`
    case 'facebook':
      return `https://facebook.com/${usuario(valor)}`
    case 'youtube':
      return `https://youtube.com/@${usuario(valor)}`
    default:
      return null
  }
}

/**
 * El enlace de un botón de la bio. Se puede escribir como uno quiera: una
 * dirección con o sin https, @usuario, un número de WhatsApp o un correo. Sin
 * nada escrito, las redes usan las de Contacto y redes.
 */
export function hrefEnlace(enlace: Pick<EnlaceBio, 'url' | 'icono'>, ajustes: AjustesTienda = {}): string {
  const url = enlace.url.trim()
  if (!url) {
    const guardado =
      enlace.icono === 'whatsapp'
        ? ajustes.whatsapp
        : enlace.icono === 'instagram'
          ? ajustes.instagram
          : enlace.icono === 'tiktok'
            ? ajustes.tiktok
            : enlace.icono === 'facebook'
              ? ajustes.facebook
              : enlace.icono === 'correo'
                ? ajustes.correo && `mailto:${ajustes.correo}`
                : undefined
    if (!guardado) return '#'
    return guardado.startsWith('http') || guardado.startsWith('mailto:') ? guardado : (deRed(enlace.icono, guardado) ?? '#')
  }
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return url
  if (url.startsWith('@')) return deRed(enlace.icono, url) ?? `https://instagram.com/${usuario(url)}`
  if (/^\+?[\d\s()-]{7,}$/.test(url)) return enlaceWhatsapp(url)
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(url)) return `mailto:${url}`
  return `https://${url}`
}
