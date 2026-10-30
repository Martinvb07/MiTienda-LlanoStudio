import type { Request, Response } from 'express'
import { z } from 'zod'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { ErrorHttp } from '../utilidades/errores.js'
import { pushConfigurado } from '../servicios/push.servicio.js'

/** Suscripción de un dispositivo a los avisos push del panel. */

export const esquemaSuscripcionPush = z.object({
  endpoint: z.string().url().max(800),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(4).max(100) }),
})

export const esquemaBajaPush = z.object({ endpoint: z.string().max(800) })

/** La llave pública que el navegador necesita para suscribirse (null = push apagado en el servidor). */
export function llavePush(_req: Request, res: Response): void {
  res.json({ llave: pushConfigurado() ? entorno.VAPID_PUBLICA : null })
}

export async function suscribirPush(req: Request, res: Response): Promise<void> {
  if (!pushConfigurado()) throw new ErrorHttp(503, 'Los avisos en el celular todavía no están activos en el servidor', 'PUSH_APAGADO')
  const { endpoint, keys } = req.body as z.infer<typeof esquemaSuscripcionPush>
  const { usuarioId, tenantId } = req.sesion!
  await prisma.suscripcionPush.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, usuarioId, tenantId },
    update: { p256dh: keys.p256dh, auth: keys.auth, usuarioId, tenantId },
  })
  res.status(204).end()
}

export async function darDeBajaPush(req: Request, res: Response): Promise<void> {
  const { endpoint } = req.body as z.infer<typeof esquemaBajaPush>
  await prisma.suscripcionPush.deleteMany({ where: { endpoint, usuarioId: req.sesion!.usuarioId } })
  res.status(204).end()
}
