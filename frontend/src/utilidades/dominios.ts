/**
 * Copia de backend/src/utilidades/dominios.ts.
 *
 * Se duplica a propósito: el middleware de Next corre en el runtime edge y no
 * puede importar del paquete del backend. Si cambias las reglas en un lado,
 * cámbialas en el otro — hay tests en ambos que fijan el comportamiento.
 */

export type TipoTrafico = 'sitio' | 'panel' | 'tienda' | 'dominio-propio' | 'desconocido'

export interface ClasificacionHost {
  tipo: TipoTrafico
  host: string
  subdominio?: string
  dominio?: string
}

export interface OpcionesDominio {
  dominioBase: string
  subdominioPanel: string
}

export const SUBDOMINIOS_RESERVADOS: ReadonlySet<string> = new Set([
  'www',
  'api',
  'admin',
  'panel',
  'app',
  'cdn',
  'assets',
  'static',
  'media',
  'mail',
  'smtp',
  'ftp',
  'blog',
  'docs',
  'ayuda',
  'soporte',
  'estado',
  'status',
])

export function normalizarHost(host?: string | null): string {
  if (!host) return ''
  let valor = host.trim().toLowerCase()

  if (valor.startsWith('[')) {
    const cierre = valor.indexOf(']')
    return cierre === -1 ? valor : valor.slice(0, cierre + 1)
  }

  const posicionPuerto = valor.lastIndexOf(':')
  if (posicionPuerto !== -1 && /^\d+$/.test(valor.slice(posicionPuerto + 1))) {
    valor = valor.slice(0, posicionPuerto)
  }

  if (valor.endsWith('.')) valor = valor.slice(0, -1)
  return valor
}

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'])

export function clasificarHost(
  hostCrudo: string | null | undefined,
  opciones: OpcionesDominio,
): ClasificacionHost {
  const host = normalizarHost(hostCrudo)
  if (!host) return { tipo: 'desconocido', host }

  const dominioBase = normalizarHost(opciones.dominioBase)
  const subdominioPanel = opciones.subdominioPanel.toLowerCase()
  const basesConocidas = Array.from(new Set([dominioBase, 'localhost'].filter(Boolean)))

  // El dominio pelado es la web comercial de Llano Studio, no el panel.
  if (HOSTS_LOCALES.has(host)) return { tipo: 'sitio', host }

  for (const base of basesConocidas) {
    if (host === base || host === `www.${base}`) return { tipo: 'sitio', host }

    if (host.endsWith(`.${base}`)) {
      const etiqueta = host.slice(0, host.length - base.length - 1)

      if (!etiqueta || etiqueta.includes('.')) return { tipo: 'desconocido', host }
      if (etiqueta === subdominioPanel) return { tipo: 'panel', host }
      if (SUBDOMINIOS_RESERVADOS.has(etiqueta)) return { tipo: 'desconocido', host }

      return { tipo: 'tienda', host, subdominio: etiqueta }
    }
  }

  return { tipo: 'dominio-propio', host, dominio: host }
}

/** Configuración de dominios leída del entorno, con valores por defecto. */
export const configuracionDominios: OpcionesDominio = {
  dominioBase: process.env.NEXT_PUBLIC_DOMINIO_BASE ?? 'llanostudio.co',
  subdominioPanel: process.env.NEXT_PUBLIC_SUBDOMINIO_PANEL ?? 'mitienda',
}

/**
 * Reconstruye el Host a partir del identificador que el middleware metió en la
 * ruta. Si tiene puntos es un dominio propio; si no, una etiqueta de subdominio.
 *
 * Las páginas de tienda lo usan en vez de leer headers(): consultar headers()
 * volvería la ruta dinámica y perderíamos el ISR, que es justo lo que hace que
 * las tiendas indexen bien.
 */
export function hostDesdeIdentificador(
  identificador: string,
  opciones: OpcionesDominio = configuracionDominios,
): string {
  const valor = decodeURIComponent(identificador).trim().toLowerCase()
  return valor.includes('.') ? valor : `${valor}.${opciones.dominioBase}`
}
