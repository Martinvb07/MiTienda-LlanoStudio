import 'server-only'

/**
 * Cliente HTTP hacia la API de Express.
 *
 * El backend decide el tenant por el header Host, pero en SSR la llamada es
 * servidor a servidor y ese Host sería el de la API. Por eso se manda el Host
 * original en `x-mitienda-host`, acompañado del token interno que el backend
 * exige para hacerle caso.
 */

const URL_API = process.env.URL_API ?? 'http://localhost:4000'
const TOKEN_INTERNO = process.env.MITIENDA_TOKEN_INTERNO ?? ''

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje)
    this.name = 'ErrorApi'
  }
}

export interface OpcionesPeticion {
  /** Host de la tienda en cuyo nombre se pregunta. */
  host: string
  /** Segundos de revalidación ISR. `false` fuerza render dinámico. */
  revalidar?: number | false
  etiquetas?: string[]
}

export async function pedirApi<T>(ruta: string, opciones: OpcionesPeticion): Promise<T> {
  const { host, revalidar = 60, etiquetas } = opciones

  const respuesta = await fetch(`${URL_API}${ruta}`, {
    headers: {
      accept: 'application/json',
      'x-mitienda-host': host,
      ...(TOKEN_INTERNO ? { 'x-mitienda-interno': TOKEN_INTERNO } : {}),
    },
    next: revalidar === false ? { revalidate: 0 } : { revalidate: revalidar, tags: etiquetas },
  })

  if (!respuesta.ok) {
    let mensaje = `La API respondió ${respuesta.status}`
    try {
      const cuerpo = (await respuesta.json()) as { error?: { mensaje?: string } }
      if (cuerpo.error?.mensaje) mensaje = cuerpo.error.mensaje
    } catch {
      // Respuesta sin JSON: nos quedamos con el mensaje genérico.
    }
    throw new ErrorApi(respuesta.status, mensaje)
  }

  return (await respuesta.json()) as T
}

/**
 * POST a la API en nombre de la tienda de `host` (por ejemplo, un pedido). No
 * lanza en errores 4xx: devuelve el cuerpo para mostrar el mensaje al cliente.
 */
export async function enviarApi<T>(
  ruta: string,
  cuerpo: unknown,
  host: string,
): Promise<{ ok: true; datos: T } | { ok: false; estado: number; mensaje: string; campos: Record<string, string> }> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-mitienda-host': host,
        ...(TOKEN_INTERNO ? { 'x-mitienda-interno': TOKEN_INTERNO } : {}),
      },
      body: JSON.stringify(cuerpo),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, estado: 0, mensaje: 'No pudimos conectar con la tienda. Intenta de nuevo.', campos: {} }
  }

  const datos = (await respuesta.json().catch(() => ({}))) as T & {
    error?: { mensaje?: string; detalles?: { campo: string; mensaje: string }[] }
  }
  if (respuesta.ok) return { ok: true, datos }
  return {
    ok: false,
    estado: respuesta.status,
    mensaje: datos.error?.mensaje ?? `La tienda respondió ${respuesta.status}`,
    campos: Object.fromEntries((datos.error?.detalles ?? []).map((detalle) => [detalle.campo.split('.').pop()!, detalle.mensaje])),
  }
}
