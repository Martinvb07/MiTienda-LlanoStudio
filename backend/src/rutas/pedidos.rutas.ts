import { Router } from 'express'
import { crearPedidoPublico, esquemaPedidoPublico } from '../controladores/pedidos.controlador.js'
import { esquemaValidarCupon, validarCuponPublico } from '../controladores/cupones.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'

const enrutador = Router()

enrutador.post('/', exigirTenant, validar(esquemaPedidoPublico), crearPedidoPublico)
enrutador.post('/cupon', exigirTenant, validar(esquemaValidarCupon), validarCuponPublico)

export default enrutador
