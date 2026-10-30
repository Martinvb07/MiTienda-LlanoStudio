import { beforeEach, describe, expect, it } from 'vitest'
import type { Request } from 'express'

process.env.DATABASE_URL ??= 'postgresql://prueba:prueba@localhost:5432/prueba'
process.env.JWT_SECRETO ??= 'secreto-de-pruebas-123'
process.env.TOKEN_INTERNO = 'token-interno-de-pruebas'

// Se importa después de fijar las variables de entorno, que entorno.ts lee al cargar.
const { ipCliente, registrarIntento, reiniciarContadores } = await import('./limiteIntentos.js')

const peticion = (headers: Record<string, string>, ip = '127.0.0.1') => ({ headers, ip }) as unknown as Request

describe('registrarIntento', () => {
  beforeEach(() => reiniciarContadores())

  it('deja pasar hasta el máximo y frena el siguiente', () => {
    const ahora = 1_000_000
    for (let i = 0; i < 3; i++) expect(registrarIntento('x', 60_000, 3, ahora).permitido).toBe(true)
    const frenado = registrarIntento('x', 60_000, 3, ahora + 1_000)
    expect(frenado.permitido).toBe(false)
    expect(frenado.restanteMs).toBe(59_000)
  })

  it('vuelve a contar desde cero cuando pasa la ventana', () => {
    for (let i = 0; i < 4; i++) registrarIntento('y', 60_000, 3, 0)
    expect(registrarIntento('y', 60_000, 3, 60_000).permitido).toBe(true)
  })

  it('lleva cuentas separadas por clave', () => {
    for (let i = 0; i < 4; i++) registrarIntento('a', 60_000, 3, 0)
    expect(registrarIntento('b', 60_000, 3, 0).permitido).toBe(true)
  })
})

describe('ipCliente', () => {
  it('usa la IP que reenvía Next sólo si trae el token interno', () => {
    expect(ipCliente(peticion({ 'x-mitienda-interno': 'token-interno-de-pruebas', 'x-mitienda-ip': '200.1.2.3' }))).toBe('200.1.2.3')
    expect(ipCliente(peticion({ 'x-mitienda-ip': '200.1.2.3', 'x-real-ip': '190.5.5.5' }))).toBe('190.5.5.5')
  })

  it('cae en la IP del socket cuando no hay cabeceras', () => {
    expect(ipCliente(peticion({}, '10.0.0.9'))).toBe('10.0.0.9')
  })
})
