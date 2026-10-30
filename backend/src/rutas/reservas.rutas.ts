import { Router } from 'express'
import {
  cancelarCitaPublica,
  crearReservaPublica,
  esquemaDisponibilidad,
  esquemaReserva,
  obtenerCitaPublica,
  obtenerDisponibilidad,
} from '../controladores/reservas.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'
import { limites } from '../middlewares/limiteIntentos.js'

const enrutador = Router()

enrutador.get('/disponibilidad', exigirTenant, validar(esquemaDisponibilidad, 'query'), obtenerDisponibilidad)
enrutador.post('/', limites.formularioPublico, exigirTenant, validar(esquemaReserva), crearReservaPublica)
enrutador.get('/:codigo', exigirTenant, obtenerCitaPublica)
enrutador.post('/:codigo/cancelar', exigirTenant, cancelarCitaPublica)

export default enrutador
