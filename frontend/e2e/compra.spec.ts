import { expect, test } from '@playwright/test'
import { PUERTO_WEB, crearTiendaPrueba, pedidosDe, productosDe, urlTienda, type TiendaPrueba } from './ayudas'

let tienda: TiendaPrueba

test.beforeAll(async () => {
  tienda = await crearTiendaPrueba([
    { nombre: 'Gorra llanera', slug: 'gorra-llanera', precio: 45000, stock: 5 },
    { nombre: 'Ruana de lana', slug: 'ruana-de-lana', precio: 120000, stock: 0 },
  ])
})

test('un cliente compra: ficha → carrito → pedido, y el stock baja', async ({ page }) => {
  await page.goto(urlTienda(tienda.subdominio, '/productos/gorra-llanera'))
  await expect(page.getByRole('heading', { name: 'Gorra llanera' })).toBeVisible()

  await page.getByRole('button', { name: /Agregar al carrito/ }).click()
  await page.goto(urlTienda(tienda.subdominio, '/carrito'))

  await page.getByLabel('Nombre completo').fill('Luis Pérez')
  await page.getByLabel('Correo').fill('luis@prueba.co')
  await page.getByLabel('Celular').fill('3001234567')
  await page.getByLabel('Dirección').fill('Calle 10 # 5-20')
  await page.getByLabel('Ciudad').fill('Villavicencio')
  await page.getByText('Contra entrega').click()
  await page.getByRole('button', { name: /Confirmar pedido/ }).click()

  await expect(page.getByText(/Recibimos tu pedido/)).toBeVisible()

  const pedidos = await pedidosDe(tienda.token)
  expect(pedidos).toHaveLength(1)
  expect(pedidos[0]!.estado).toBe('PENDIENTE')
  const gorra = (await productosDe(tienda.token)).find((producto) => producto.slug === 'gorra-llanera')
  expect(gorra?.stock).toBe(4)
})

test('un producto agotado no se puede comprar y ofrece «Avísame cuando llegue»', async ({ page }) => {
  await page.goto(urlTienda(tienda.subdominio, '/productos/ruana-de-lana'))
  await expect(page.getByRole('button', { name: 'Agotado' })).toBeDisabled()

  await page.getByLabel('Tu correo').fill('maria@prueba.co')
  await page.getByRole('button', { name: 'Avisarme' }).click()
  await expect(page.getByText(/Te escribimos a maria@prueba.co/)).toBeVisible()

  const ruana = (await productosDe(tienda.token)).find((producto) => producto.slug === 'ruana-de-lana')
  expect(ruana?.esperando).toBe(1)
})

test('los favoritos se guardan en el navegador', async ({ page }) => {
  await page.goto(urlTienda(tienda.subdominio, '/productos/gorra-llanera'))
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.getByRole('link', { name: /Ver favoritos/ }).click()
  await expect(page.getByRole('heading', { name: 'Tus favoritos' })).toBeVisible()
  await expect(page.getByText('Gorra llanera')).toBeVisible()
})

test('cada tienda sirve su robots.txt, su sitemap y su catálogo', async ({ request }) => {
  // Node no resuelve *.localhost como el navegador: se pide a localhost con el Host de la tienda.
  const pedir = (ruta: string) => request.get(`http://localhost:${PUERTO_WEB}${ruta}`, { headers: { host: `${tienda.subdominio}.localhost` } })

  expect(await (await pedir('/robots.txt')).text()).toContain('Disallow: /carrito')
  expect(await (await pedir('/sitemap.xml')).text()).toContain('/productos/gorra-llanera')

  const catalogo = await pedir('/catalogo.xml')
  expect(catalogo.headers()['content-type']).toContain('xml')
  expect(await catalogo.text()).toContain('<rss')
})
