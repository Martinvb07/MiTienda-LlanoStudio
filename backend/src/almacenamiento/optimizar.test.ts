import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { optimizarImagen } from './optimizar.js'

const foto = (ancho: number, alto: number) =>
  sharp({ create: { width: ancho, height: alto, channels: 3, background: { r: 200, g: 120, b: 40 } } }).jpeg().toBuffer()

describe('optimizarImagen', () => {
  it('pasa a WebP y achica lo que supera el ancho máximo', async () => {
    const { contenido, tipoMime } = await optimizarImagen(await foto(4000, 3000), 'image/jpeg')
    const datos = await sharp(contenido).metadata()
    expect(tipoMime).toBe('image/webp')
    expect(datos.format).toBe('webp')
    expect(datos.width).toBe(2000)
    expect(datos.height).toBe(1500)
  })

  it('no agranda las imágenes pequeñas', async () => {
    const { contenido } = await optimizarImagen(await foto(300, 200), 'image/jpeg')
    expect((await sharp(contenido).metadata()).width).toBe(300)
  })

  it('rechaza lo que no es una imagen', async () => {
    await expect(optimizarImagen(Buffer.from('esto no es una foto'), 'image/png')).rejects.toMatchObject({ estado: 415 })
  })
})
