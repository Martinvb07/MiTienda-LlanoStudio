import { describe, expect, it } from 'vitest'
import { clasificarHost, esSubdominioValido, normalizarHost } from './dominios.js'

const opciones = { dominioBase: 'llanostudio.co', subdominioPanel: 'mitienda' }

describe('normalizarHost', () => {
  it('quita el puerto y pasa a minúsculas', () => {
    expect(normalizarHost('Ropa.LlanoStudio.co:3000')).toBe('ropa.llanostudio.co')
  })

  it('conserva el host IPv6 entre corchetes', () => {
    expect(normalizarHost('[::1]:4000')).toBe('[::1]')
  })

  it('quita el punto final de un FQDN', () => {
    expect(normalizarHost('ropa.llanostudio.co.')).toBe('ropa.llanostudio.co')
  })
})

describe('clasificarHost', () => {
  it('reconoce el host del panel', () => {
    expect(clasificarHost('mitienda.llanostudio.co', opciones).tipo).toBe('panel')
  })

  it('extrae el subdominio de una tienda', () => {
    expect(clasificarHost('ropa.llanostudio.co', opciones)).toMatchObject({
      tipo: 'tienda',
      subdominio: 'ropa',
    })
  })

  it('trata como dominio propio lo que no cuelga del dominio base', () => {
    expect(clasificarHost('www.miropa.com', opciones)).toMatchObject({
      tipo: 'dominio-propio',
      dominio: 'www.miropa.com',
    })
  })

  it('rechaza subdominios reservados', () => {
    expect(clasificarHost('api.llanostudio.co', opciones).tipo).toBe('desconocido')
  })

  it('rechaza subdominios anidados', () => {
    expect(clasificarHost('a.b.llanostudio.co', opciones).tipo).toBe('desconocido')
  })

  it('deja trabajar en local con *.localhost', () => {
    expect(clasificarHost('ropa.localhost:3000', opciones)).toMatchObject({
      tipo: 'tienda',
      subdominio: 'ropa',
    })
    expect(clasificarHost('localhost:3000', opciones).tipo).toBe('panel')
  })

  it('marca como desconocido un Host vacío', () => {
    expect(clasificarHost(undefined, opciones).tipo).toBe('desconocido')
  })
})

describe('esSubdominioValido', () => {
  it('acepta etiquetas normales', () => {
    expect(esSubdominioValido('mi-tienda')).toBe(true)
  })

  it('rechaza reservados, cortos y con caracteres raros', () => {
    expect(esSubdominioValido('api')).toBe(false)
    expect(esSubdominioValido('ab')).toBe(false)
    expect(esSubdominioValido('-mala')).toBe(false)
    expect(esSubdominioValido('con_guionbajo')).toBe(false)
  })
})
