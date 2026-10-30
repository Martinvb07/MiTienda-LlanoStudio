import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { noEncontrado, solicitudInvalida } from '../utilidades/errores.js'
import { registro } from '../utilidades/registro.js'
import { enviarCorreoDirecto, plantillaCorreo } from '../servicios/correos.servicio.js'
import { hostPublico } from '../servicios/avisosPedido.servicio.js'

/** "Avísame cuando llegue": el correo de quien espera un producto agotado. */

export const esquemaAvisame = z.object({
  email: z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160),
})

export async function pedirAvisoPublico(req: Request, res: Response): Promise<void> {
  const { tiendaId } = req.tenant!
  const { email } = req.body as z.infer<typeof esquemaAvisame>
  const producto = await prisma.producto.findFirst({
    where: { id: String(req.params.id), tiendaId, activo: true },
    select: { id: true, stock: true },
  })
  if (!producto) throw noEncontrado('Ese producto no existe')
  if (producto.stock > 0) throw solicitudInvalida('Este producto ya está disponible: puedes comprarlo ahora')

  // Si ya lo había pedido (y se le avisó antes), vuelve a quedar esperando.
  await prisma.avisoDisponible.upsert({
    where: { productoId_email: { productoId: producto.id, email } },
    create: { tiendaId, productoId: producto.id, email },
    update: { avisadoEn: null },
  })
  res.status(201).json({ ok: true })
}

/** Cuántas personas esperan cada producto agotado, para mostrarlo en el panel. */
export async function contarEsperando(tiendaId: string) {
  const grupos = await prisma.avisoDisponible.groupBy({
    by: ['productoId'],
    where: { tiendaId, avisadoEn: null },
    _count: { _all: true },
  })
  return Object.fromEntries(grupos.map((grupo) => [grupo.productoId, grupo._count._all]))
}

/**
 * Si el producto volvió a tener stock, les escribe a todos los que esperaban.
 * Se llama después de guardar un producto; si no hay nadie esperando, no hace nada.
 */
export async function avisarDisponibles(productoId: string): Promise<void> {
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    select: { nombre: true, slug: true, stock: true, activo: true, fotos: true, tienda: { select: { nombre: true, tenantId: true, publicada: true } } },
  })
  if (!producto || producto.stock <= 0 || !producto.activo || !producto.tienda.publicada) return

  const esperando = await prisma.avisoDisponible.findMany({ where: { productoId, avisadoEn: null }, select: { id: true, email: true }, take: 500 })
  if (esperando.length === 0) return

  const host = await hostPublico(producto.tienda.tenantId)
  const html = plantillaCorreo(
    `¡Volvió ${producto.nombre}!`,
    ['Nos pediste que te avisáramos: ya hay unidades otra vez.', 'Son pocas, así que si lo quieres, mejor no esperar mucho.'],
    { texto: 'Lo quiero', url: `https://${host}/productos/${encodeURIComponent(producto.slug)}` },
    producto.tienda.nombre,
  )
  for (const aviso of esperando) {
    try {
      const enviado = await enviarCorreoDirecto(aviso.email, `Ya hay ${producto.nombre} en ${producto.tienda.nombre}`, html)
      if (!enviado) return
      await prisma.avisoDisponible.update({ where: { id: aviso.id }, data: { avisadoEn: new Date() } })
    } catch (error) {
      registro.warn({ err: error, productoId }, 'No se pudo avisar que el producto volvió')
    }
  }
}
