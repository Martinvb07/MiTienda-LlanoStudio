/**
 * Clasificación de un Host en tráfico de panel, de tienda por subdominio o de
 * dominio propio.
 *
 * Es una función pura y sin dependencias a propósito: el `middleware.ts` de
 * Next replica esta misma lógica para decidir qué renderizar, y así las dos
 * mitades del sistema no se contradicen. Si cambias las reglas aquí, cambia
 * también frontend/src/utilidades/dominios.ts.
 */

export type TipoTrafico = 'panel' | 'tienda' | 'dominio-propio' | 'desconocido'

export interface ClasificacionHost {
  tipo: TipoTrafico
  /** Host normalizado: minúsculas, sin puerto y sin punto final. */
  host: string
  /** Sólo cuando tipo === 'tienda'. */
  subdominio?: string
  /** Sólo cuando tipo === 'dominio-propio'. */
  dominio?: string
}

export interface OpcionesDominio {
  dominioBase: string
  subdominioPanel: string
}

/**
 * Subdominios que nunca pueden pertenecer a una tienda. `panel` está reservado
 * porque en el frontend compite con la ruta estática /panel.
 */
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

/** Quita puerto, espacios, mayúsculas y el punto final de un FQDN. */
export function normalizarHost(host?: string | null): string {
  if (!host) return ''
  let valor = host.trim().toLowerCase()

  // IPv6 entre corchetes: "[::1]:4000" -> "[::1]"
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

  // "localhost" siempre cuenta como dominio base para que en desarrollo
  // funcionen mitienda.localhost:3000 y ropa.localhost:3000 sin tocar nada.
  const basesConocidas = Array.from(new Set([dominioBase, 'localhost'].filter(Boolean)))

  // Acceso plano por IP o localhost sin subdominio: es el panel.
  if (HOSTS_LOCALES.has(host)) return { tipo: 'panel', host }

  for (const base of basesConocidas) {
    if (host === base || host === `www.${base}`) return { tipo: 'panel', host }

    if (host.endsWith(`.${base}`)) {
      const etiqueta = host.slice(0, host.length - base.length - 1)

      // No admitimos subdominios anidados (a.b.llanostudio.co).
      if (!etiqueta || etiqueta.includes('.')) return { tipo: 'desconocido', host }
      if (etiqueta === subdominioPanel) return { tipo: 'panel', host }
      if (SUBDOMINIOS_RESERVADOS.has(etiqueta)) return { tipo: 'desconocido', host }

      return { tipo: 'tienda', host, subdominio: etiqueta }
    }
  }

  // No cuelga de ningún dominio base: sólo puede ser un dominio propio.
  return { tipo: 'dominio-propio', host, dominio: host }
}

/** Valida una etiqueta de subdominio antes de asignarla a un tenant nuevo. */
export function esSubdominioValido(valor: string): boolean {
  const etiqueta = valor.trim().toLowerCase()
  if (etiqueta.length < 3 || etiqueta.length > 63) return false
  if (SUBDOMINIOS_RESERVADOS.has(etiqueta)) return false
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(etiqueta)
}
