import { ImageResponse } from 'next/og'

export const alt = 'Mi Sitio, de Llano Studio: tu tienda, tu página y tus enlaces'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Imagen al compartir el sitio: negro, titular grande y fino, como la portada. */
export default function ImagenCompartir() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80 }}>
        <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Mi Sitio, de Llano Studio</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 92, lineHeight: 1, letterSpacing: -4 }}>
          <span>Todo tu negocio,</span>
          <span>en un solo sitio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: 'rgba(255,255,255,0.6)' }}>
          <span>Tienda · Página · Enlaces</span>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: '#3b60ff' }} />
          <span>misitio.llanostudio.co</span>
        </div>
      </div>
    ),
    size,
  )
}
