import { describe, expect, it } from 'vitest'
import { cifrarContrasena, verificarContrasena } from './contrasenas.js'

describe('contrasenas', () => {
  it('verifica la contraseña correcta y rechaza otra', async () => {
    const guardado = await cifrarContrasena('una-clave-larga')
    expect(guardado.startsWith('scrypt$')).toBe(true)
    expect(await verificarContrasena('una-clave-larga', guardado)).toBe(true)
    expect(await verificarContrasena('otra-clave', guardado)).toBe(false)
  })

  it('usa una sal distinta cada vez', async () => {
    expect(await cifrarContrasena('igual')).not.toBe(await cifrarContrasena('igual'))
  })

  it('rechaza un hash con formato desconocido', async () => {
    expect(await verificarContrasena('x', 'bcrypt$abc')).toBe(false)
  })
})
