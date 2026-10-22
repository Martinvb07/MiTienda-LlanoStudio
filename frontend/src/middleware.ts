import { NextResponse, type NextRequest } from 'next/server'
import { clasificarHost, configuracionDominios } from '@/utilidades/dominios'

/** Header con el que el middleware le pasa el Host original a los layouts. */
export const CABECERA_HOST = 'x-mitienda-host'

/**
 * Resolución de tenant por dominio de entrada.
 *
 *   llanostudio.co           -> web comercial (en producción la sirve el sitio
 *                               de Llano Studio; nginx no la manda aquí)
 *   mitienda.llanostudio.co  -> web de Mi Tienda en /, panel en /panel
 *   ropa.llanostudio.co      -> tienda       (/x se reescribe a /ropa/x)
 *   www.miropa.com           -> dominio propio (/x se reescribe a /www.miropa.com/x)
 *
 * Se reescribe a una ruta con el identificador de tienda dentro en vez de
 * resolverlo sólo por header, porque así cada tienda tiene su propia entrada en
 * la caché de rutas y puede usar ISR. La URL que ve el visitante no cambia.
 *
 * El identificador que viaja en la ruta es la etiqueta del subdominio o, para
 * dominios propios, el host completo (contiene puntos, y por eso se distinguen).
 */
export function middleware(peticion: NextRequest) {
  const clasificacion = clasificarHost(
    peticion.headers.get('host'),
    configuracionDominios,
  )

  const cabeceras = new Headers(peticion.headers)
  cabeceras.set(CABECERA_HOST, clasificacion.host)

  const url = peticion.nextUrl.clone()
  const ruta = url.pathname

  // Detrás de nginx con HTTPS, nextUrl llega con el protocolo de
  // X-Forwarded-Proto (https), pero Next escucha en http. Con https en el
  // destino, Next cree que el rewrite va a otro servidor e intenta hacerse
  // proxy por TLS a sí mismo (EPROTO). El rewrite siempre es interno: http.
  url.protocol = 'http:'

  switch (clasificacion.tipo) {
    case 'sitio':
      // La web comercial vive en las rutas reales de (sitio): nada que reescribir.
      return NextResponse.next({ request: { headers: cabeceras } })

    case 'panel':
      // llanostudio.co es la web del estudio, así que la de Mi Tienda vive
      // aquí: la portada en / y el panel en /panel.
      return NextResponse.next({ request: { headers: cabeceras } })

    case 'tienda':
    case 'dominio-propio': {
      const identificador =
        clasificacion.tipo === 'tienda' ? clasificacion.subdominio! : clasificacion.host

      url.pathname = `/${identificador}${ruta === '/' ? '' : ruta}`
      return NextResponse.rewrite(url, { request: { headers: cabeceras } })
    }

    default: {
      url.pathname = '/tienda-no-encontrada'
      return NextResponse.rewrite(url, { request: { headers: cabeceras } })
    }
  }
}

export const config = {
  /*
   * Se excluyen las rutas internas de Next y cualquier archivo con extensión,
   * para no reescribir estáticos ni imágenes.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
