/** Arma una tienda de prueba por la API, como lo haría una dueña desde el panel. */

export const URL_API = process.env.E2E_URL_API ?? 'http://localhost:4000'
export const PUERTO_WEB = process.env.E2E_PUERTO_WEB ?? '3000'

export const urlTienda = (subdominio: string, ruta = '/') => `http://${subdominio}.localhost:${PUERTO_WEB}${ruta}`

async function api<T>(ruta: string, opciones: { metodo?: string; token?: string; cuerpo?: unknown } = {}): Promise<T> {
  const respuesta = await fetch(`${URL_API}/api${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(opciones.token ? { authorization: `Bearer ${opciones.token}` } : {}),
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
  })
  if (!respuesta.ok) throw new Error(`${opciones.metodo ?? 'GET'} ${ruta} respondió ${respuesta.status}: ${await respuesta.text()}`)
  return (respuesta.status === 204 ? undefined : await respuesta.json()) as T
}

export interface TiendaPrueba {
  subdominio: string
  token: string
  productos: Record<string, { id: string; slug: string }>
}

export async function crearTiendaPrueba(productos: { nombre: string; slug: string; precio: number; stock: number }[]): Promise<TiendaPrueba> {
  const subdominio = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const { token } = await api<{ token: string }>('/panel/registro', {
    metodo: 'POST',
    cuerpo: { nombre: 'Dueña de Prueba', email: `${subdominio}@prueba.co`, contrasena: 'clave-de-prueba-123', tienda: 'Tienda de Prueba', subdominio },
  })

  const { tienda } = await api<{ tienda: Record<string, unknown> & { ajustes: Record<string, unknown> } }>('/panel/tienda', { token })
  await api('/panel/tienda', {
    metodo: 'PUT',
    token,
    cuerpo: {
      nombre: tienda.nombre,
      descripcion: tienda.descripcion,
      logoUrl: tienda.logoUrl,
      plantilla: tienda.plantilla,
      tema: tienda.tema,
      configuracionBloques: tienda.configuracionBloques,
      ajustes: { ...tienda.ajustes, pagoContraEntrega: true },
      publicada: true,
    },
  })

  const creados: TiendaPrueba['productos'] = {}
  for (const producto of productos) {
    const { producto: creado } = await api<{ producto: { id: string; slug: string } }>('/panel/productos', {
      metodo: 'POST',
      token,
      cuerpo: { ...producto, descripcion: `${producto.nombre} de prueba`, precioComparacion: null, fotos: [], activo: true },
    })
    creados[producto.slug] = creado
  }
  return { subdominio, token, productos: creados }
}

export const pedidosDe = (token: string) =>
  api<{ pedidos: { id: string; numero: number; estado: string; total: string; items: { cantidad: number }[] }[] }>('/panel/pedidos', { token }).then((r) => r.pedidos)

export const productosDe = (token: string) =>
  api<{ productos: { slug: string; stock: number; esperando?: number }[] }>('/panel/productos', { token }).then((r) => r.productos)
