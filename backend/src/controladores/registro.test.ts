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

  it('acepta página y enlaces, y rechaza lo que no existe', () => {
    const base = { nombre: 'Ana', email: 'ana@correo.co', contrasena: '12345678', tienda: 'Ana', subdominio: 'ana' }
    expect(controlador.esquemaRegistro.parse({ ...base, tipo: 'pagina' }).tipo).toBe('pagina')
    expect(controlador.esquemaRegistro.parse({ ...base, tipo: 'enlaces' }).tipo).toBe('enlaces')
    expect(controlador.esquemaRegistro.safeParse({ ...base, tipo: 'blog' }).success).toBe(false)
  })

  it('los enlaces arrancan con perfil y botones, dentro del plan Gratis', () => {
    const bloques = controlador.bloquesIniciales('Valentina Rey', 'enlaces')
    const tipos = bloques.map((bloque) => bloque.tipo)
    expect(tipos).toEqual(['perfil', 'enlaces'])
    expect(tipos.every((tipo) => PLANES.GRATIS.bloques.includes(tipo))).toBe(true)
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

describe('botones de los enlaces en el admin', () => {
  it('cuenta los botones de todas las secciones de enlaces y tolera JSON raro', async () => {
    const { contarEnlaces } = await import('./admin.controlador.js')
    const bloques = [
      { tipo: 'perfil', props: {} },
      { tipo: 'enlaces', props: { items: [{}, {}, {}] } },
      { tipo: 'enlaces', props: { items: [{}] } },
      { tipo: 'enlaces', props: { items: 'nada' } },
      null,
    ]
    expect(contarEnlaces(bloques)).toBe(4)
    expect(contarEnlaces('no es una lista')).toBe(0)
  })
})

describe('páginas extra de la página para tu negocio', () => {
  const tienda = (paginas: unknown) => ({
    nombre: 'Morichal Abogados',
    descripcion: null,
    logoUrl: null,
    plantilla: 'clasica',
    tema: {},
    configuracionBloques: [],
    ajustes: { paginas },
    publicada: true,
  })
  const pagina = (ruta: string) => ({ id: ruta, titulo: 'Servicios', ruta, bloques: [{ id: 'h', tipo: 'hero', props: { titulo: 'Hola' } }] })

  it('acepta páginas con dirección propia', () => {
    const datos = controlador.esquemaTienda.parse(tienda([pagina('servicios'), pagina('nosotros')]))
    expect(datos.ajustes.paginas?.map((otra) => otra.ruta)).toEqual(['servicios', 'nosotros'])
  })

  it('rechaza direcciones que ya usa el sitio, repetidas o con caracteres raros', () => {
    expect(controlador.esquemaTienda.safeParse(tienda([pagina('carrito')])).success).toBe(false)
    expect(controlador.esquemaTienda.safeParse(tienda([pagina('servicios'), pagina('servicios')])).success).toBe(false)
    expect(controlador.esquemaTienda.safeParse(tienda([pagina('mis servicios')])).success).toBe(false)
  })

  it('sólo Negocio y Pro traen páginas extra', () => {
    expect(PLANES.GRATIS.paginasExtra).toBe(0)
    expect(PLANES.EMPRENDE.paginasExtra).toBe(0)
    expect(PLANES.NEGOCIO.paginasExtra).toBeGreaterThan(0)
    expect(PLANES.PRO.paginasExtra).toBeGreaterThan(PLANES.NEGOCIO.paginasExtra)
  })
})
