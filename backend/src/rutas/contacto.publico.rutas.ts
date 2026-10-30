import { Router } from 'express'
import { esquemaMensaje, recibirMensaje } from '../controladores/contacto.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'
import { limites } from '../middlewares/limiteIntentos.js'

const enrutador = Router()

enrutador.post('/', limites.formularioPublico, exigirTenant, validar(esquemaMensaje), recibirMensaje)

export default enrutador
