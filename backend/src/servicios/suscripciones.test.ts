import { createHash, createHmac } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'

process.env.DATABASE_URL ??= 'postgresql://prueba:prueba@localhost:5432/prueba'
process.env.JWT_SECRETO ??= 'secreto-de-pruebas-123'
process.env.BOLD_LLAVE_SECRETA = 'llave-secreta'

let servicio: typeof import('./suscripciones.servicio.js')
beforeAll(async () => {
  servicio = await import('./suscripciones.servicio.js')
})

const DIA = 24 * 60 * 60 * 1000

describe('firmas de Bold', () => {
  it('hash de integridad = sha256(referencia + monto + moneda + llave)', () => {
    const esperado = createHash('sha256').update('MT-1399000COPllave-secreta').digest('hex')
    expect(servicio.firmaIntegridad('MT-1', 399000)).toBe(esperado)
  })

  it('acepta el webhook firmado sobre el cuerpo en base64 y rechaza el resto', () => {
    const cuerpo = Buffer.from('{"type":"SALE_APPROVED"}')
    const firma = createHmac('sha256', 'llave-secreta').update(cuerpo.toString('base64')).digest('hex')
    expect(servicio.firmaWebhookValida(cuerpo, firma)).toBe(true)
    expect(servicio.firmaWebhookValida(cuerpo, firma.replace(/.$/, '0'))).toBe(false)
    expect(servicio.firmaWebhookValida(Buffer.from('{"type":"otro"}'), firma)).toBe(false)
    expect(servicio.firmaWebhookValida(cuerpo, undefined)).toBe(false)
  })

  it('las referencias sirven como order id de Bold', () => {
    expect(servicio.nuevaReferencia()).toMatch(/^[A-Z0-9-]{1,60}$/)
  })
})

describe('estado de la suscripción', () => {
  const ahora = new Date('2026-10-22T12:00:00Z')
  const en = (dias: number) => new Date(ahora.getTime() + dias * DIA)

  it('sin fecha no vence', () => {
    expect(servicio.estadoSuscripcion(null, ahora).estado).toBe('sin-vencimiento')
  })
  it('activa, por vencer y en gracia', () => {
    expect(servicio.estadoSuscripcion(en(20), ahora).estado).toBe('activa')
    expect(servicio.estadoSuscripcion(en(3), ahora)).toMatchObject({ estado: 'por-vencer', diasRestantes: 3 })
    expect(servicio.estadoSuscripcion(en(-2), ahora)).toMatchObject({ estado: 'gracia', diasRestantes: 3 })
  })
})
