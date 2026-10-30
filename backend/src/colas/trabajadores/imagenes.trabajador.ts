import { Worker, type Job } from 'bullmq'
import { crearConexionRedis } from '../../config/redis.js'
import { prisma } from '../../config/prisma.js'
import { registro } from '../../utilidades/registro.js'
import { guardarObjeto, leerMedio, RUTA_MEDIOS_LOCALES } from '../../almacenamiento/medios.js'
import { r2Configurado, urlPublica } from '../../almacenamiento/r2.js'
import { optimizarImagen } from '../../almacenamiento/optimizar.js'
import { NOMBRES_COLAS, type TrabajoOptimizarImagen } from '../definiciones.js'

const TIPO_POR_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
}

const urlDe = (clave: string) => (r2Configurado() ? urlPublica(clave) : `${RUTA_MEDIOS_LOCALES}/${clave}`)

/**
 * Trabajador de imágenes de producto: descarga la foto original, la pasa a
 * WebP liviano, la guarda con una clave nueva y cambia la URL en el producto.
 * El original no se borra: puede seguir citado en el diseño de la tienda.
 */
async function procesar(trabajo: Job<TrabajoOptimizarImagen>): Promise<{ url: string | null }> {
  const { claveOriginal, tiendaId, productoId, anchoMaximo } = trabajo.data
  const extension = claveOriginal.split('.').pop()?.toLowerCase() ?? ''
  const tipoMime = TIPO_POR_EXTENSION[extension]
  if (!tipoMime) {
    registro.warn({ trabajoId: trabajo.id, claveOriginal }, 'Imagen con extensión desconocida: se omite')
    return { url: null }
  }

  const original = await leerMedio(claveOriginal)
  const optimizada = await optimizarImagen(original, tipoMime, anchoMaximo)
  if (optimizada.contenido === original) return { url: null }

  const claveNueva = `${claveOriginal.replace(/\.[^./]+$/, '')}-opt.${optimizada.extension}`
  const url = await guardarObjeto(claveNueva, optimizada.contenido, optimizada.tipoMime)

  if (productoId) {
    const urlVieja = urlDe(claveOriginal)
    const producto = await prisma.producto.findFirst({ where: { id: productoId, tiendaId }, select: { fotos: true } })
    if (producto?.fotos.includes(urlVieja)) {
      await prisma.producto.update({
        where: { id: productoId },
        data: { fotos: producto.fotos.map((foto) => (foto === urlVieja ? url : foto)) },
      })
    }
  }

  registro.info(
    { trabajoId: trabajo.id, tiendaId, claveOriginal, antes: original.length, despues: optimizada.contenido.length },
    'Imagen optimizada',
  )
  return { url }
}

export function crearTrabajadorImagenes(): Worker<TrabajoOptimizarImagen> {
  // BullMQ exige una conexión propia por trabajador: sus comandos de espera
  // son bloqueantes y no pueden compartir la conexión de los productores.
  const trabajador = new Worker<TrabajoOptimizarImagen>(NOMBRES_COLAS.imagenes, procesar, {
    connection: crearConexionRedis(),
    concurrency: 3,
  })

  trabajador.on('failed', (trabajo, error) => {
    registro.error(
      { trabajoId: trabajo?.id, intento: trabajo?.attemptsMade, err: error },
      'Falló un trabajo de imagen',
    )
  })

  return trabajador
}
