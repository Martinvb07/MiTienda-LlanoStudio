import { Router } from 'express'
import { esquemaVisita, registrarVisita } from '../controladores/metricas.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'

const enrutador = Router()

enrutador.post('/', exigirTenant, validar(esquemaVisita), registrarVisita)

export default enrutador
