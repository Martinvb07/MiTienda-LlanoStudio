import { entorno } from '../config/entorno.js'
import { registro } from '../utilidades/registro.js'
import { anotarError, type ErrorReciente } from '../utilidades/erroresRecientes.js'
import { enviarCorreoDirecto, plantillaCorreo } from './correos.servicio.js'

/**
 * Alertas de errores: además de quedar en el admin (Sistema → Errores
 * recientes), los 500 le llegan a Llano Studio por correo y, si hay, por un
 * webhook de chat. Así nadie se entera de una falla por un cliente molesto.
 *
 * El mismo error no se repite más de una vez cada 15 minutos, y en total no
 * salen más de 20 alertas por hora aunque algo esté fallando en bucle.
 */

const SILENCIO_MS = 15 * 60_000
const MAXIMO_POR_HORA = 20

const ultimaVez = new Map<string, number>()
let ventana = { desde: 0, enviadas: 0 }

/** Firma del error: mismo mensaje en la misma ruta (sin ids) cuenta como el mismo. */
export const firmaError = (error: Pick<ErrorReciente, 'ruta' | 'mensaje'>) =>
  `${error.ruta.replace(/[?#].*$/, '').replace(/[a-z0-9]{20,}|\d+/gi, ':id')}|${error.mensaje.slice(0, 160)}`

/** true si esta alerta debe salir ahora (y la cuenta). */
export function tocaAlertar(firma: string, ahora = Date.now()): boolean {
  const previa = ultimaVez.get(firma)
  if (previa !== undefined && previa > ahora - SILENCIO_MS) return false
  if (ahora - ventana.desde > 3_600_000) ventana = { desde: ahora, enviadas: 0 }
  if (ventana.enviadas >= MAXIMO_POR_HORA) return false
  ventana.enviadas++
  ultimaVez.set(firma, ahora)
  if (ultimaVez.size > 500) ultimaVez.clear()
  return true
}

/** Sólo para los tests. */
export function reiniciarAlertas(): void {
  ultimaVez.clear()
  ventana = { desde: 0, enviadas: 0 }
}

async function avisar(error: ErrorReciente): Promise<void> {
  const destino = entorno.ALERTAS_CORREO || entorno.ADMIN_CORREO
  const titulo = `Error en ${error.origen === 'web' ? 'la web' : 'la API'}: ${error.mensaje.slice(0, 80)}`
  const detalle = `${error.metodo} ${error.ruta}\n${error.mensaje}${error.pila ? `\n\n${error.pila}` : ''}`

  const tareas: Promise<unknown>[] = []
  if (destino) {
    tareas.push(
      enviarCorreoDirecto(
        destino,
        `[Mi Sitio] ${titulo}`,
        plantillaCorreo(titulo, [`${error.hora} · ${error.metodo} ${error.ruta}`, error.mensaje, ...(error.pila ? [error.pila] : [])]),
      ),
    )
  }
  if (entorno.ALERTAS_WEBHOOK) {
    const texto = `🚨 ${titulo}\n\`\`\`${detalle.slice(0, 1500)}\`\`\``
    tareas.push(
      fetch(entorno.ALERTAS_WEBHOOK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Slack y Google Chat leen `text`; Discord, `content`.
        body: JSON.stringify({ text: texto, content: texto }),
        signal: AbortSignal.timeout(5_000),
      }),
    )
  }
  await Promise.all(tareas)
}

/** Anota el error para el admin y, si corresponde, avisa. Nunca lanza. */
export function reportarError(error: ErrorReciente): void {
  anotarError(error)
  if (!entorno.esProduccion) return
  if (!tocaAlertar(firmaError(error))) return
  avisar(error).catch((problema: unknown) => registro.warn({ err: problema }, 'No se pudo enviar la alerta de error'))
}

/** Errores que se escapan de todo (promesas sin catch): se registran y se avisan. */
export function vigilarProceso(nombre: string): void {
  const reportar = (motivo: unknown) => {
    const error = motivo instanceof Error ? motivo : new Error(String(motivo))
    registro.error({ err: error }, `Error sin capturar en ${nombre}`)
    reportarError({
      hora: new Date().toISOString(),
      origen: 'proceso',
      metodo: nombre,
      ruta: '-',
      mensaje: error.message,
      pila: error.stack?.split('\n').slice(0, 6).join('\n'),
    })
  }
  process.on('unhandledRejection', reportar)
}
