import { beforeAll, describe, expect, it } from 'vitest'
import type * as Controlador from './panel.controlador.js'
import { PLANES } from '../utilidades/planes.js'

process.env.DATABASE_URL ??= 'postgresql://prueba:prueba@localhost:5432/prueba'
process.env.JWT_SECRETO ??= 'secreto-de-pruebas-123'

// Se importa después de fijar las variables de entorno, que entorno.ts lee al cargar.
let controlador: typeof Controlador
beforeAll(async () => {
  controlador = await import('./panel.controlador.js')
})

describe('registro por tipo de sitio', () => {
  it('sin tipo, se registra una tienda', () => {
    const datos = controlador.esquemaRegistro.parse({
      nombre: 'Ana',
      email: 'ana@correo.co',
      contrasena: '12345678',
      tienda: 'Ana Café',
      subdominio: 'ana-cafe',
    })
    expect(datos.tipo).toBe('tienda')
  })

  it('acepta página y rechaza lo que todavía no existe', () => {
    const base = { nombre: 'Ana', email: 'ana@correo.co', contrasena: '12345678', tienda: 'Ana', subdominio: 'ana' }
    expect(controlador.esquemaRegistro.parse({ ...base, tipo: 'pagina' }).tipo).toBe('pagina')
    expect(controlador.esquemaRegistro.safeParse({ ...base, tipo: 'enlaces' }).success).toBe(false)
  })

  it('la página arranca sin catálogo y con secciones que el plan Gratis deja guardar', () => {
    const bloques = controlador.bloquesIniciales('Morichal Abogados', 'pagina')
    const tipos = bloques.map((bloque) => bloque.tipo)
    expect(tipos).not.toContain('grilla-productos')
    expect(tipos).toEqual(expect.arrayContaining(['servicios', 'horario']))
    expect(tipos.every((tipo) => PLANES.GRATIS.bloques.includes(tipo))).toBe(true)
    expect(bloques.length).toBeLessThanOrEqual(PLANES.GRATIS.secciones)
  })

  it('la tienda sigue arrancando con su catálogo', () => {
    expect(controlador.bloquesIniciales('Lana Andina').map((bloque) => bloque.tipo)).toContain('grilla-productos')
  })
})
