/**
 * Costo del envío según dónde llega el pedido. La tienda pone zonas (su
 * ciudad, el área metropolitana, la costa…) con las ciudades que cubren y su
 * precio; lo que no cae en ninguna paga el costo general. Recoger en la
 * tienda no cobra envío.
 *
 * La API hace la misma cuenta al crear el pedido con una copia de esta función
 * (backend/src/utilidades/envios.ts): si cambias una, cambia la otra.
 */

export interface ZonaEnvio {
  id: string
  nombre: string
  /** Ciudades o municipios que cubre, como los escribe la gente. */
  ciudades: string[]
  /** Pesos. 0 = envío gratis en esa zona. */
  costo: number
  /** Días que tarda, para mostrarlo en el checkout: "1 a 2 días". */
  tiempo?: string
}

export interface AjustesEnvio {
  /** Costo para lo que no cae en ninguna zona (o para todo, sin zonas). */
  costoEnvio?: number
  envioGratisDesde?: number
  zonasEnvio?: ZonaEnvio[]
  /** Sin zona que coincida, no se envía: el cliente debe estar en una zona. */
  soloZonas?: boolean
  recogerEnTienda?: boolean
}

export type Entrega = 'domicilio' | 'recoger'

/** "Bogotá D.C." y "bogota" son la misma ciudad. */
export function normalizarCiudad(ciudad: string): string {
  return ciudad
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(d\.?\s?c\.?|distrito capital)\b/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** La zona que cubre la ciudad, si alguna la cubre. */
export function zonaDe(ajustes: AjustesEnvio, ciudad: string | undefined): ZonaEnvio | null {
  if (!ciudad) return null
  const buscada = normalizarCiudad(ciudad)
  if (!buscada) return null
  return ajustes.zonasEnvio?.find((zona) => zona.ciudades.some((otra) => normalizarCiudad(otra) === buscada)) ?? null
}

export type ResultadoEnvio = { ok: true; costo: number; zona: ZonaEnvio | null } | { ok: false; motivo: string }

/**
 * Cuánto cuesta el envío. `subtotal` va ya con el descuento del cupón: el
 * envío gratis desde cierto monto mira lo que de verdad se paga.
 */
export function calcularEnvio(ajustes: AjustesEnvio, subtotal: number, ciudad?: string, entrega: Entrega = 'domicilio'): ResultadoEnvio {
  if (entrega === 'recoger') {
    return ajustes.recogerEnTienda ? { ok: true, costo: 0, zona: null } : { ok: false, motivo: 'Esta tienda no tiene recogida en el local' }
  }
  const zona = zonaDe(ajustes, ciudad)
  if (!zona && ajustes.soloZonas && ajustes.zonasEnvio?.length) {
    return { ok: false, motivo: 'Por ahora no hacemos envíos a esa ciudad' }
  }
  const costo = zona ? zona.costo : (ajustes.costoEnvio ?? 0)
  if (costo <= 0) return { ok: true, costo: 0, zona }
  if (ajustes.envioGratisDesde && subtotal >= ajustes.envioGratisDesde) return { ok: true, costo: 0, zona }
  return { ok: true, costo, zona }
}
