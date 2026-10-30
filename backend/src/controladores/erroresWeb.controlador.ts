import type { Request, Response } from 'express'
import { z } from 'zod'
import { reportarError } from '../servicios/alertas.servicio.js'

/**
 * Errores que le pasan a alguien en el navegador (la tienda o el panel se
 * rompen en pantalla). Los manda el límite de errores de Next.
 */
export const esquemaErrorWeb = z.object({
  mensaje: z.string().trim().min(1).max(500),
  ruta: z.string().trim().max(300),
  pila: z.string().max(3000).optional(),
  digest: z.string().max(80).optional(),
})

export function recibirErrorWeb(req: Request, res: Response): void {
  const datos = req.body as z.infer<typeof esquemaErrorWeb>
  reportarError({
    hora: new Date().toISOString(),
    origen: 'web',
    metodo: 'NAVEGADOR',
    ruta: datos.ruta,
    mensaje: datos.digest ? `${datos.mensaje} (digest ${datos.digest})` : datos.mensaje,
    pila: datos.pila?.split('\n').slice(0, 6).join('\n'),
  })
  res.status(204).end()
}
