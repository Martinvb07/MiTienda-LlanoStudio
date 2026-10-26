import { describe, expect, it } from 'vitest'
import { agruparClientes, normalizarTelefono, type CitaCliente, type PedidoCliente } from './clientes.js'

const pedido = (datos: Partial<PedidoCliente>): PedidoCliente => ({
  id: Math.random().toString(36),
  numero: 1001,
  clienteNombre: 'Ana',
  clienteEmail: 'ana@x.co',
  clienteTelefono: '3001234567',
  ciudad: 'Bogotá',
  estado: 'ENTREGADO',
  total: 100000,
  creadoEn: new Date('2026-10-01'),
  ...datos,
})

const cita = (datos: Partial<CitaCliente>): CitaCliente => ({
  id: Math.random().toString(36),
  servicio: 'Corte',
  clienteNombre: 'Ana',
  clienteEmail: null,
  clienteTelefono: '300 123 4567',
  estado: 'COMPLETADA',
  inicio: new Date('2026-10-05'),
  ...datos,
})

describe('normalizarTelefono', () => {
  it('ignora espacios, guiones y el +57', () => {
    expect(normalizarTelefono('+57 300 123-4567')).toBe('3001234567')
    expect(normalizarTelefono('12')).toBeNull()
  })
})

describe('agruparClientes', () => {
  it('suma los pedidos de la misma persona y no cuenta los cancelados', () => {
    const [cliente, ...resto] = agruparClientes(
      [pedido({}), pedido({ clienteEmail: 'ANA@x.co', total: 50000, creadoEn: new Date('2026-10-10') }), pedido({ estado: 'CANCELADO', total: 999999 })],
      [],
    )
    expect(resto).toHaveLength(0)
    expect(cliente).toMatchObject({ pedidos: 2, gastado: 150000, email: 'ana@x.co' })
    expect(cliente!.pedidoIds).toHaveLength(3)
  })

  it('une citas y pedidos por el celular aunque cambie el formato', () => {
    const clientes = agruparClientes([pedido({})], [cita({})])
    expect(clientes).toHaveLength(1)
    expect(clientes[0]).toMatchObject({ pedidos: 1, citas: 1 })
  })

  it('separa personas distintas y ordena por lo más reciente', () => {
    const clientes = agruparClientes(
      [pedido({}), pedido({ clienteNombre: 'Beto', clienteEmail: 'beto@x.co', clienteTelefono: '3109998877', creadoEn: new Date('2026-10-20') })],
      [],
    )
    expect(clientes.map((cliente) => cliente.nombre)).toEqual(['Beto', 'Ana'])
  })
})
