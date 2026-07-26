import path from 'node:path'
import type { NextConfig } from 'next'

const configuracion: NextConfig = {
  reactStrictMode: true,

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
