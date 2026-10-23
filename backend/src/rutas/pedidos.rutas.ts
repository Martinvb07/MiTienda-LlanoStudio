import { Router } from 'express'
import { crearPedidoPublico, esquemaPedidoPublico } from '../controladores/pedidos.controlador.js'
import { esquemaValidarCupon, validarCuponPublico } from '../controladores/cupones.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { estadoPago } from '../controladores/pasarelas.controlador.js'
import { validar } from '../middlewares/validacion.js'

const enrutador = Router()

enrutador.post('/', exigirTenant, validar(esquemaPedidoPublico), crearPedidoPublico)
enrutador.post('/cupon', exigirTenant, validar(esquemaValidarCupon), validarCuponPublico)
enrutador.get('/pagos/:referencia', exigirTenant, estadoPago)

export default enrutador
