import webpush from 'web-push'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { registro } from '../utilidades/registro.js'

/**
 * Avisos push al panel instalado como app: el celular de la dueña suena con
 * cada pedido nuevo aunque no tenga el panel abierto.
 */

export const pushConfigurado = () => Boolean(entorno.VAPID_PUBLICA && entorno.VAPID_PRIVADA)

let listo = false
function configurar() {
  if (listo) return
  webpush.setVapidDetails(entorno.ADMIN_CORREO ? `mailto:${entorno.ADMIN_CORREO}` : `https://${entorno.DOMINIO_BASE}`, entorno.VAPID_PUBLICA, entorno.VAPID_PRIVADA)
  listo = true
}

export interface AvisoPush {
  titulo: string
  cuerpo: string
  /** Pantalla del panel que abre al tocar el aviso, p. ej. /panel/pedidos. */
  url: string
  /** Avisos con la misma etiqueta se reemplazan en vez de amontonarse. */
  etiqueta?: string
}

/** Manda el aviso a todos los dispositivos suscritos de la tienda. Nunca lanza. */
export async function avisarTienda(tenantId: string, aviso: AvisoPush): Promise<void> {
  if (!pushConfigurado()) return
  configurar()
  const suscripciones = await prisma.suscripcionPush.findMany({ where: { tenantId }, select: { id: true, endpoint: true, p256dh: true, auth: true } })
  const cuerpo = JSON.stringify(aviso)
  await Promise.all(
    suscripciones.map(async (suscripcion) => {
      try {
        await webpush.sendNotification(
          { endpoint: suscripcion.endpoint, keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth } },
          cuerpo,
          { TTL: 24 * 3600, urgency: 'high' },
        )
      } catch (error) {
        const estado = (error as { statusCode?: number }).statusCode
        // 404/410: el navegador dio de baja la suscripción (desinstaló la app, borró datos).
        if (estado === 404 || estado === 410) {
          await prisma.suscripcionPush.delete({ where: { id: suscripcion.id } }).catch(() => undefined)
        } else {
          registro.warn({ err: error, tenantId }, 'No se pudo enviar el aviso push')
        }
      }
    }),
  )
}

/** Para los controladores: dispara el aviso sin esperar ni romper la respuesta. */
export function avisarTiendaEnSegundoPlano(tenantId: string, aviso: AvisoPush): void {
  avisarTienda(tenantId, aviso).catch((error: unknown) => registro.warn({ err: error }, 'Falló el aviso push'))
}
