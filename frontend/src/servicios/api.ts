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
