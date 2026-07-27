import path from 'node:path'
import type { NextConfig } from 'next'

const configuracion: NextConfig = {
  reactStrictMode: true,

  /*
   * Dos procesos de Next que compartan carpeta de compilación se corrompen el
   * uno al otro: el segundo deja a medias lo que el primero estaba sirviendo y
   * el servidor empieza a responder 500.
   *
   * Con esto, una comprobación puntual puede escribir en otro sitio sin tocar
   * el servidor que ya esté levantado:
   *   $env:NEXT_DIST_DIR='.next-verificacion'; npx next build
   */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',

  // Sin esto Next busca el lockfile hacia arriba y puede elegir uno ajeno al
  // proyecto, arrastrando archivos de más al empaquetar para el despliegue.
  outputFileTracingRoot: path.join(import.meta.dirname, '..'),

  // Las tiendas se sirven en dominios de clientes, así que el build debe correr
  // aunque falte alguna dependencia opcional del entorno de CI.
  poweredByHeader: false,

  images: {
    // Fotos servidas desde Cloudflare R2 (dominio público del bucket).
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.llanostudio.co' },
    ],
  },

  experimental: {
    // El panel sube archivos grandes vía Server Actions.
    serverActions: { bodySizeLimit: '4mb' },
  },
}

export default configuracion
