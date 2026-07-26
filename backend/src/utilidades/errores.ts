/** Error con código HTTP, para que el manejador central sepa qué responder. */
export class ErrorHttp extends Error {
  readonly estado: number
  readonly codigo: string
  readonly detalles?: unknown

  constructor(estado: number, mensaje: string, codigo = 'ERROR', detalles?: unknown) {
    super(mensaje)
    this.name = 'ErrorHttp'
    this.estado = estado
    this.codigo = codigo
    this.detalles = detalles
  }
}

export const noEncontrado = (mensaje = 'Recurso no encontrado') =>
  new ErrorHttp(404, mensaje, 'NO_ENCONTRADO')

export const noAutorizado = (mensaje = 'Credenciales inválidas o ausentes') =>
  new ErrorHttp(401, mensaje, 'NO_AUTORIZADO')

export const prohibido = (mensaje = 'No tienes permiso sobre este recurso') =>
  new ErrorHttp(403, mensaje, 'PROHIBIDO')

export const solicitudInvalida = (mensaje = 'Solicitud inválida', detalles?: unknown) =>
  new ErrorHttp(400, mensaje, 'SOLICITUD_INVALIDA', detalles)
