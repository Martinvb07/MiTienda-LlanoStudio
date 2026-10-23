import { createHash } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import type * as Servicio from './pasarelas.servicio.js'
import type * as Cifrado from '../utilidades/cifrado.js'

process.env.DATABASE_URL ??= 'postgresql://prueba:prueba@localhost:5432/prueba'
process.env.JWT_SECRETO ??= 'secreto-de-pruebas-123'

// Se importan después de fijar las variables de entorno, que entorno.ts lee al cargar.
let servicio: typeof Servicio
let cifrado: typeof Cifrado
beforeAll(async () => {
  servicio = await import('./pasarelas.servicio.js')
  cifrado = await import('../utilidades/cifrado.js')
})

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex')
const datos = {
  referencia: 'P1001-ABC',
  monto: 45900,
  descripcion: 'Pedido #1001',
  correo: 'ana@x.co',
  nombre: 'Ana',
  retorno: 'https://cafe.llanostudio.co/pago?ref=P1001-ABC',
}

describe('cifrado de llaves', () => {
  it('cifra y descifra, y cada cifrado es distinto', () => {
    const a = cifrado.cifrar('secreto')
    expect(a).not.toContain('secreto')
    expect(cifrado.descifrar(a)).toBe('secreto')
    expect(cifrado.cifrar('secreto')).not.toBe(a)
  })
  it('rechaza un texto alterado', () => {
    const a = cifrado.cifrar('secreto')
    expect(() => cifrado.descifrar(a.slice(0, -3) + 'AAA')).toThrow()
  })
})

describe('checkout de cada pasarela', () => {
  it('Wompi: monto en centavos y firma de integridad', () => {
    const checkout = servicio.armarCheckout('WOMPI', { llavePublica: 'pub_test_x', modoPrueba: true, secretos: { integridad: 'int' } }, datos)
    if (checkout.tipo !== 'redireccion') throw new Error('tipo')
    const url = new URL(checkout.url)
    expect(url.searchParams.get('amount-in-cents')).toBe('4590000')
    expect(url.searchParams.get('signature:integrity')).toBe(sha256('P1001-ABC4590000COPint'))
  })
  it('ePayco: factura = referencia y confirmación a la URL de avisos', () => {
    const checkout = servicio.armarCheckout('EPAYCO', { llavePublica: 'pk', modoPrueba: true, secretos: {} }, datos)
    if (checkout.tipo !== 'epayco') throw new Error('tipo')
    expect(checkout.datos.invoice).toBe('P1001-ABC')
    expect(checkout.datos.amount).toBe('45900')
    expect(checkout.datos.confirmation).toMatch(/\/api\/pagos\/aviso\/epayco$/)
  })
  it('Bold: firma de integridad con la llave secreta de la tienda', () => {
    const checkout = servicio.armarCheckout('BOLD', { llavePublica: 'id', modoPrueba: true, secretos: { secreta: 'sec' } }, datos)
    if (checkout.tipo !== 'bold') throw new Error('tipo')
    expect(checkout.firma).toBe(sha256('P1001-ABC45900COPsec'))
  })
})
