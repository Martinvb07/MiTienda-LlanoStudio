/**
 * Inserta datos estructurados JSON-LD. Se escapa el "<" para que un texto
 * escrito por la tienda (p. ej. "</script>" en una descripción) no pueda
 * cerrar la etiqueta y meter código en la página.
 */
export function DatosEstructurados({ datos }: { datos: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, '\\u003c') }} />
}
