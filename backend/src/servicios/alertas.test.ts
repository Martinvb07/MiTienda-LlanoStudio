import { beforeEach, describe, expect, it } from 'vitest'

process.env.DATABASE_URL ??= 'postgresql://prueba:prueba@localhost:5432/prueba'
process.env.JWT_SECRETO ??= 'secreto-de-pruebas-123'

// Se importa después de fijar las variables de entorno, que entorno.ts lee al cargar.
const { firmaError, reiniciarAlertas, tocaAlertar } = await import('./alertas.servicio.js')

describe('firmaError', () => {
  it('trata como el mismo error la misma ruta con otro id', () => {
    const a = firmaError({ ruta: '/api/panel/pedidos/clx1a2b3c4d5e6f7g8h9i0j1', mensaje: 'falló' })
    const b = firmaError({ ruta: '/api/panel/pedidos/clz9y8x7w6v5u4t3s2r1q0p9?x=1', mensaje: 'falló' })
    expect(a).toBe(b)
  })
})

describe('tocaAlertar', () => {
  beforeEach(() => reiniciarAlertas())

  it('no repite el mismo error antes de 15 minutos', () => {
    expect(tocaAlertar('x', 0)).toBe(true)
    expect(tocaAlertar('x', 60_000)).toBe(false)
    expect(tocaAlertar('x', 16 * 60_000)).toBe(true)
  })

  it('no manda más de 20 alertas por hora', () => {
    for (let i = 0; i < 20; i++) expect(tocaAlertar(`e${i}`, 1_000)).toBe(true)
    expect(tocaAlertar('otra', 2_000)).toBe(false)
    expect(tocaAlertar('otra', 3_700_000)).toBe(true)
  })
})
