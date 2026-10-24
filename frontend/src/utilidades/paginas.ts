import type { Bloque } from '@/tipos/bloques'
import type { AjustesTienda, PaginaExtra, Tienda } from '@/tipos/tienda'
import { generarSlug } from './formato'
import { tipoSitio } from './sitio'

/**
 * Páginas aparte de la de inicio (/servicios, /nosotros…) en la página para tu
 * negocio. Viven en Tienda.ajustes.paginas, cada una con sus secciones.
 */

/** Direcciones que ya usa el sitio: una página extra no puede llamarse así (igual que en el backend). */
export const RUTAS_RESERVADAS: ReadonlySet<string> = new Set(['buscar', 'carrito', 'categoria', 'pago', 'productos', 'panel', 'api'])

/** Las páginas extra que se publican: sólo en la página para tu negocio (el plan ya las recortó). */
export function paginasDe(tienda: Pick<Tienda, 'tipo' | 'ajustes'>): PaginaExtra[] {
  return tipoSitio(tienda.tipo) === 'pagina' ? (tienda.ajustes.paginas ?? []) : []
}

/** Una dirección libre a partir del nombre: "Nuestros servicios" → "nuestros-servicios" (o "-2" si ya está). */
export function rutaLibre(titulo: string, otras: PaginaExtra[], propia?: string): string {
  const base = generarSlug(titulo).slice(0, 36) || 'pagina'
  const usadas = new Set(otras.filter((pagina) => pagina.id !== propia).map((pagina) => pagina.ruta))
  let ruta = RUTAS_RESERVADAS.has(base) ? `${base}-1` : base
  for (let numero = 2; usadas.has(ruta); numero++) ruta = `${base}-${numero}`
  return ruta
}

/**
 * Una página nueva: arranca con un título grande y el mismo pie de la de
 * inicio, para que se vea completa desde el primer momento.
 */
export function crearPagina(titulo: string, otras: PaginaExtra[], inicio: Bloque[]): PaginaExtra {
  const id = `pagina-${Math.random().toString(36).slice(2, 10)}`
  const pie = inicio.find((bloque) => bloque.tipo === 'pie')
  return {
    id,
    titulo,
    ruta: rutaLibre(titulo, otras),
    bloques: [
      { id: `hero-${id.slice(7)}`, tipo: 'hero', props: { titulo, subtitulo: 'Cuenta en una línea de qué trata esta página.', alineacion: 'izquierda' } },
      ...(pie ? [{ ...structuredClone(pie), id: `pie-${id.slice(7)}` }] : []),
    ],
  }
}

/** El menú con el enlace de una página agregado, cambiado de dirección o quitado. */
export function menuConPagina(
  menu: AjustesTienda['menu'] = [],
  cambio: { quitar: string } | { agregar: PaginaExtra } | { de: string; a: PaginaExtra },
): NonNullable<AjustesTienda['menu']> {
  if ('quitar' in cambio) return menu.filter((item) => item.enlace !== `/${cambio.quitar}`)
  if ('agregar' in cambio) return [...menu, { texto: cambio.agregar.titulo, enlace: `/${cambio.agregar.ruta}` }]
  return menu.map((item) => (item.enlace === `/${cambio.de}` ? { texto: cambio.a.titulo, enlace: `/${cambio.a.ruta}` } : item))
}
