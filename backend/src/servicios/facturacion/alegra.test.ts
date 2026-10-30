import { describe, expect, it } from 'vitest'
import { CONSUMIDOR_FINAL, contactoDe, ErrorAlegra, facturaDe, type PedidoAFacturar } from './alegra.js'

const pedido = (datos: Partial<PedidoAFacturar> = {}): PedidoAFacturar => ({
  numero: 1001,
  creadoEn: new Date('2026-10-30T15:00:00Z'),
  clienteNombre: 'Luis Pérez',
  clienteEmail: 'luis@x.co',
  clienteTelefono: '3001234567',
  clienteTipoDocumento: null,
  clienteDocumento: null,
  direccionEnvio: { direccion: 'Calle 1', ciudad: 'Villavicencio' },
  metodoPago: 'contra-entrega',
  subtotal: 100_000,
  descuento: 0,
  envio: 0,
  items: [{ productoId: 'p1', nombre: 'Gorra', precioUnitario: 50_000, cantidad: 2 }],
  ...datos,
})

describe('contactoDe', () => {
  it('sin documento factura como consumidor final', () => {
    expect(contactoDe(pedido()).identificationObject).toEqual({ type: 'CC', number: CONSUMIDOR_FINAL })
  })

  it('con NIT, es persona jurídica y quita el dígito de verificación', () => {
    const contacto = contactoDe(pedido({ clienteTipoDocumento: 'NIT', clienteDocumento: '900123456-7' }))
    expect(contacto.identificationObject).toEqual({ type: 'NIT', number: '900123456' })
    expect(contacto.kindOfPerson).toBe('LEGAL_ENTITY')
  })
})

describe('facturaDe', () => {
  const ids = new Map([['p1', '11']])

  it('arma los ítems con los ids de Alegra y pide el sello electrónico', () => {
    const factura = facturaDe(pedido(), '7', ids, null)
    expect(factura.client).toEqual({ id: '7' })
    expect(factura.items).toEqual([{ id: '11', description: 'Gorra', price: 50_000, quantity: 2 }])
    expect(factura.stamp).toEqual({ generateStamp: true })
    expect(factura.date).toBe('2026-10-30')
  })

  it('reparte el cupón como porcentaje y suma el envío como línea aparte', () => {
    const factura = facturaDe(pedido({ descuento: 10_000, envio: 8_000 }), '7', ids, '99')
    expect(factura.items[0]).toMatchObject({ discount: 10 })
    expect(factura.items[1]).toEqual({ id: '99', description: 'Envío', price: 8_000, quantity: 1 })
  })
})

describe('ErrorAlegra', () => {
  it('no reintenta lo que Alegra rechaza, sí las caídas', () => {
    expect(new ErrorAlegra(400, 'x').definitivo).toBe(true)
    expect(new ErrorAlegra(429, 'x').definitivo).toBe(false)
    expect(new ErrorAlegra(503, 'x').definitivo).toBe(false)
  })
})
