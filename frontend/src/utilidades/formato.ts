/** Formatea un importe en pesos colombianos: "$ 45.900". */
export function formatearPrecio(valor: string | number, moneda = 'COP'): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor
  if (!Number.isFinite(numero)) return '—'

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    // El peso colombiano no usa decimales en el día a día.
    maximumFractionDigits: 0,
  }).format(numero)
}

/** Convierte un nombre en una etiqueta apta para URL. */
export function generarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
