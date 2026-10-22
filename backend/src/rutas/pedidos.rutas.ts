import { Router } from 'express'
import { crearPedidoPublico, esquemaPedidoPublico } from '../controladores/pedidos.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'

const enrutador = Router()

enrutador.post('/', exigirTenant, validar(esquemaPedidoPublico), crearPedidoPublico)

export default enrutador
