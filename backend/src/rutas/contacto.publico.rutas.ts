import { Router } from 'express'
import { esquemaMensaje, recibirMensaje } from '../controladores/contacto.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'

const enrutador = Router()

enrutador.post('/', exigirTenant, validar(esquemaMensaje), recibirMensaje)

export default enrutador
