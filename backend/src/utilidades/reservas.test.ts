import { describe, expect, it } from 'vitest'
import { aFecha, buscarSeccionReservas, diaSemana, fechaLocal, horasLibres, leerConfig, sumarDias } from './reservas.js'

const config = leerConfig({
  servicios: [{ id: 's1', nombre: 'Corte', duracion: 60 }],
  dias: [{ dia: 2, activo: true, desde: '08:00', hasta: '11:00' }],
  intervalo: 30,
  capacidad: 1,
  diasAdelante: 30,
  anticipacion: 2,
})
const corte = config.servicios[0]!
// Lunes 26 de octubre de 2026, 7 a. m. en Colombia.
const ahora = aFecha('2026-10-26', '07:00')

describe('fechas en hora de Colombia', () => {
  it('convierte y lee la fecha local', () => {
    expect(aFecha('2026-10-27', '09:30').toISOString()).toBe('2026-10-27T14:30:00.000Z')
    expect(fechaLocal(new Date('2026-10-27T03:00:00Z'))).toBe('2026-10-26')
    expect(diaSemana('2026-10-27')).toBe(2)
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
  })
})

describe('leerConfig', () => {
  it('pone valores seguros a lo que falta o viene mal', () => {
    const leida = leerConfig({ intervalo: 'x', capacidad: 999, dias: [{ dia: 1, activo: true, desde: '18:00', hasta: '08:00' }] })
    expect(leida.intervalo).toBe(30)
    expect(leida.capacidad).toBe(50)
    expect(leida.dias.find((dia) => dia.dia === 1)?.activo).toBe(false)
    expect(leida.servicios).toEqual([])
  })
})

describe('horasLibres', () => {
  it('arma los turnos que caben antes del cierre', () => {
    expect(horasLibres(config, corte, '2026-10-27', [], ahora)).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00'])
  })

  it('quita los turnos que se cruzan con citas cuando no hay cupo', () => {
    const ocupadas = [{ inicio: aFecha('2026-10-27', '09:00'), fin: aFecha('2026-10-27', '10:00') }]
    expect(horasLibres(config, corte, '2026-10-27', ocupadas, ahora)).toEqual(['08:00', '10:00'])
    expect(horasLibres({ ...config, capacidad: 2 }, corte, '2026-10-27', ocupadas, ahora)).toHaveLength(5)
  })

  it('respeta la anticipación, los días cerrados y el rango de fechas', () => {
    expect(horasLibres(config, corte, '2026-10-27', [], aFecha('2026-10-27', '07:30'))).toEqual(['09:30', '10:00'])
    expect(horasLibres(config, corte, '2026-11-01', [], ahora)).toEqual([])
    expect(horasLibres({ ...config, cerrado: ['2026-10-27'] }, corte, '2026-10-27', [], ahora)).toEqual([])
    expect(horasLibres(config, corte, '2026-10-20', [], ahora)).toEqual([])
    expect(horasLibres(config, corte, '2027-01-05', [], ahora)).toEqual([])
  })
})

describe('buscarSeccionReservas', () => {
  it('encuentra la sección en el inicio o en una página aparte', () => {
    const seccion = { tipo: 'reservas', props: { servicios: [{ id: 'a', nombre: 'Consulta', duracion: 45 }] } }
    expect(buscarSeccionReservas([seccion], {})?.servicios[0]?.duracion).toBe(45)
    expect(buscarSeccionReservas([], { paginas: [{ bloques: [seccion] }] })).not.toBeNull()
    expect(buscarSeccionReservas([{ ...seccion, visible: false }], {})).toBeNull()
    expect(buscarSeccionReservas([], {})).toBeNull()
  })
})
