import { beforeAll, describe, expect, it } from 'vitest'
import type * as Ofertas from './ofertas.servicio.js'

process.env.DATABASE_URL ??= 'postgresql://prueba:prueba@localhost:5432/prueba'
process.env.JWT_SECRETO ??= 'secreto-de-pruebas-123'

// Se importa después de fijar las variables de entorno, que entorno.ts lee al cargar.
let ofertas: typeof Ofertas
beforeAll(async () => {
  ofertas = await import('./ofertas.servicio.js')
})

describe('ofertas por tipo de sitio', () => {
  it('reconoce los tres productos y manda lo demás a la tienda', () => {
    expect(ofertas.tipoOferta('pagina')).toBe('pagina')
    expect(ofertas.tipoOferta('enlaces')).toBe('enlaces')
    expect(ofertas.tipoOferta('blog')).toBe('tienda')
    expect(ofertas.tipoOferta(undefined)).toBe('tienda')
  })

  it('los enlaces cuestan menos que la página, y la página menos que la tienda', () => {
    for (const plan of ofertas.ORDEN.filter((otro) => otro !== 'GRATIS')) {
      const enlaces = ofertas.OFERTAS_ENLACES_POR_DEFECTO[plan]
      const pagina = ofertas.OFERTAS_PAGINA_POR_DEFECTO[plan]
      expect(enlaces.precio).toBeLessThan(pagina.precio)
      expect(pagina.precio).toBeLessThan(ofertas.OFERTAS_POR_DEFECTO[plan].precio)
      // El anual sale más barato que doce meses.
      expect(enlaces.precioAnual).toBeLessThan(enlaces.precio * 12)
    }
  })
})
