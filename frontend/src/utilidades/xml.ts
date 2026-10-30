/** Escapa texto para meterlo dentro de un documento XML (sitemap, feeds). */
export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Respuesta XML con caché corta, igual que el ISR de las tiendas. */
export function respuestaXml(cuerpo: string): Response {
  return new Response(cuerpo, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=300' },
  })
}
