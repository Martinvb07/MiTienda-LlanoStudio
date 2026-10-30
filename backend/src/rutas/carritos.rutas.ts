import { Router } from 'express'
import { esquemaCarrito, guardarCarrito } from '../controladores/clientes.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'
import { limites } from '../middlewares/limiteIntentos.js'

const enrutador = Router()

enrutador.post('/', limites.carrito, exigirTenant, validar(esquemaCarrito), guardarCarrito)

export default enrutador
