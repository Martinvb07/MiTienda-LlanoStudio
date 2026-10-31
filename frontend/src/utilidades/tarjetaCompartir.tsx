import { ImageResponse } from 'next/og'

/**
 * Imagen al compartir (WhatsApp, Facebook) cuando la tienda o el producto no
 * tienen foto propia: los colores de la tienda, el nombre en grande y, si es
 * un producto, su precio. Mejor que un enlace sin imagen.
 */

export const TAMANO_TARJETA = { width: 1200, height: 630 }

const hexValido = (valor: string | undefined, respaldo: string) => (valor && /^#[0-9a-f]{6}$/i.test(valor) ? valor : respaldo)

export function tarjetaCompartir({
  titulo,
  subtitulo,
  precio,
  tienda,
  host,
  colores,
}: {
  titulo: string
  subtitulo?: string
  precio?: string
  tienda: string
  host: string
  colores: { fondo?: string; texto?: string; marca?: string; contraste?: string }
}) {
  const fondo = hexValido(colores.fondo, '#ffffff')
  const texto = hexValido(colores.texto, '#0b0b0c')
  const marca = hexValido(colores.marca, '#0b0b0c')
  const contraste = hexValido(colores.contraste, '#ffffff')

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: fondo, color: texto }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 30 }}>
          <span style={{ width: 18, height: 18, borderRadius: 18, background: marca }} />
          <span style={{ opacity: 0.75 }}>{tienda}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ fontSize: titulo.length > 40 ? 64 : 84, lineHeight: 1.02, letterSpacing: -3, fontWeight: 600 }}>{titulo.slice(0, 90)}</span>
          {subtitulo && <span style={{ fontSize: 30, opacity: 0.65, lineHeight: 1.3 }}>{subtitulo.slice(0, 140)}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 28 }}>
          <span style={{ opacity: 0.55 }}>{host}</span>
          {precio && (
            <span style={{ background: marca, color: contraste, padding: '14px 30px', borderRadius: 999, fontSize: 40, fontWeight: 600 }}>{precio}</span>
          )}
        </div>
      </div>
    ),
    { ...TAMANO_TARJETA, headers: { 'cache-control': 'public, max-age=3600, s-maxage=3600' } },
  )
}
