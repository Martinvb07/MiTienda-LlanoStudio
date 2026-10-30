/**
 * Encola la optimización de las fotos de producto que se subieron antes de que
 * el panel las pasara a WebP. Lo procesa el proceso de trabajadores.
 *
 *   npm run medios:optimizar             todas las tiendas
 *   npm run medios:optimizar -- <tiendaId>
 *
 * Se puede correr varias veces: las fotos que ya son WebP se saltan.
 */
import { prisma, desconectarPrisma } from '../src/config/prisma.js'
import { claveDeUrl } from '../src/almacenamiento/medios.js'
import { cerrarColas, encolarOptimizacionImagen } from '../src/colas/index.js'
import { cerrarRedis } from '../src/config/redis.js'

const tiendaId = process.argv[2]

const productos = await prisma.producto.findMany({
  where: tiendaId ? { tiendaId } : {},
  select: { id: true, fotos: true, tienda: { select: { id: true, tenantId: true } } },
})

let encoladas = 0
for (const producto of productos) {
  for (const foto of producto.fotos) {
    const clave = claveDeUrl(foto)
    if (!clave || clave.endsWith('.webp')) continue
    await encolarOptimizacionImagen({
      tenantId: producto.tienda.tenantId,
      tiendaId: producto.tienda.id,
      productoId: producto.id,
      claveOriginal: clave,
    })
    encoladas++
  }
}

console.warn(`Fotos encoladas: ${encoladas} (de ${productos.length} productos)`)
await cerrarColas()
await cerrarRedis()
await desconectarPrisma()
