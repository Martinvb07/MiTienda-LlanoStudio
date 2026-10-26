import { describe, expect, it } from 'vitest'
import { calcularEnvio, normalizarCiudad, zonaDe, type AjustesEnvio } from './envios.js'

const ajustes: AjustesEnvio = {
  costoEnvio: 18000,
  envioGratisDesde: 200000,
  zonasEnvio: [
    { id: 'z1', nombre: 'Villavicencio', ciudades: ['Villavicencio'], costo: 6000 },
    { id: 'z2', nombre: 'Bogotá y alrededores', ciudades: ['Bogotá', 'Soacha', 'Chía'], costo: 12000 },
    { id: 'z3', nombre: 'Barrio vecino', ciudades: ['Acacías'], costo: 0 },
  ],
}

describe('normalizarCiudad', () => {
  it('ignora tildes, mayúsculas y el D.C.', () => {
    expect(normalizarCiudad('Bogotá D.C.')).toBe('bogota')
    expect(normalizarCiudad('  BOGOTA ')).toBe('bogota')
    expect(normalizarCiudad('Chía')).toBe('chia')
  })
})

describe('calcularEnvio', () => {
  it('usa el costo de la zona que cubre la ciudad', () => {
    expect(calcularEnvio(ajustes, 50000, 'villavicencio')).toEqual({ ok: true, costo: 6000, zona: ajustes.zonasEnvio![0] })
    expect(zonaDe(ajustes, 'Bogotá D.C.')?.id).toBe('z2')
  })

  it('usa el costo general fuera de las zonas', () => {
    expect(calcularEnvio(ajustes, 50000, 'Medellín')).toMatchObject({ ok: true, costo: 18000, zona: null })
  })

  it('el envío gratis desde cierto monto aplica también a las zonas', () => {
    expect(calcularEnvio(ajustes, 200000, 'Soacha')).toMatchObject({ ok: true, costo: 0 })
  })

  it('una zona con costo 0 es gratis', () => {
    expect(calcularEnvio(ajustes, 1000, 'Acacias')).toMatchObject({ ok: true, costo: 0 })
  })

  it('recoger en la tienda no cobra, si la tienda lo ofrece', () => {
    expect(calcularEnvio({ ...ajustes, recogerEnTienda: true }, 1000, undefined, 'recoger')).toMatchObject({ ok: true, costo: 0 })
    expect(calcularEnvio(ajustes, 1000, undefined, 'recoger').ok).toBe(false)
  })

  it('con soloZonas, rechaza las ciudades que no cubre', () => {
    expect(calcularEnvio({ ...ajustes, soloZonas: true }, 1000, 'Cali').ok).toBe(false)
    expect(calcularEnvio({ ...ajustes, soloZonas: true }, 1000, 'Chía').ok).toBe(true)
  })

  it('sin zonas se comporta como antes', () => {
    expect(calcularEnvio({ costoEnvio: 10000, envioGratisDesde: 50000 }, 40000, 'Cali')).toMatchObject({ costo: 10000 })
    expect(calcularEnvio({ costoEnvio: 10000, envioGratisDesde: 50000 }, 50000, 'Cali')).toMatchObject({ costo: 0 })
    expect(calcularEnvio({}, 40000, 'Cali')).toMatchObject({ costo: 0 })
  })
})
