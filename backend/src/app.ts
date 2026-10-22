import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { entorno } from './config/entorno.js'
import { registro } from './utilidades/registro.js'
import { manejadorErrores, rutaNoEncontrada } from './middlewares/manejadorErrores.js'
import { normalizarHost } from './utilidades/dominios.js'
import enrutadorApi from './rutas/index.js'
import { CARPETA_MEDIOS_LOCALES, RUTA_MEDIOS_LOCALES } from './almacenamiento/index.js'

export function crearApp() {
  const app = express()

  // En el VPS la API va detrás de Nginx: sin esto, req.ip y el Host llegan mal.
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin(origen, callback) {
        // Peticiones sin Origin (SSR de Next, curl, healthchecks) pasan.
        if (!origen) return callback(null, true)

        if (entorno.origenesPermitidos.includes(origen)) return callback(null, true)

        // Cada tienda vive en su propio dominio, así que se admite cualquier
        // subdominio del dominio base además de la lista explícita.
        try {
          const host = normalizarHost(new URL(origen).hostname)
          if (host === entorno.DOMINIO_BASE || host.endsWith(`.${entorno.DOMINIO_BASE}`)) {
            return callback(null, true)
          }
        } catch {
          // Origin mal formado: se rechaza abajo.
        }

        return callback(new Error(`Origen no permitido por CORS: ${origen}`))
      },
      credentials: true,
    }),
  )

  // 2 MB: el diseño completo de la tienda viaja entero en cada guardado.
  app.use(
    express.json({
      limit: '2mb',
      // Bold firma los bytes exactos del webhook: se guardan antes de parsear.
      verify(req, _res, buffer) {
        if (req.url?.startsWith('/api/bold/')) (req as express.Request).cuerpoCrudo = Buffer.from(buffer)
      },
    }),
  )
  app.use(express.urlencoded({ extended: true }))
  app.use(pinoHttp({ logger: registro }))

  // Imágenes guardadas sin R2 (ver almacenamiento/medios.ts). En el VPS las
  // sirve nginx directamente; esto cubre el desarrollo y cualquier hueco.
  app.use(
    RUTA_MEDIOS_LOCALES,
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(CARPETA_MEDIOS_LOCALES, { fallthrough: false, maxAge: '365d', immutable: true }),
  )

  app.use('/api', enrutadorApi)

  app.use(rutaNoEncontrada)
  app.use(manejadorErrores)

  return app
}
