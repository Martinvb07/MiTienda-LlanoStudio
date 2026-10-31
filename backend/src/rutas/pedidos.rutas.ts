import { Router } from 'express'
import { crearPedidoPublico, esquemaPedidoPublico, seguimientoPedido } from '../controladores/pedidos.controlador.js'
import { esquemaValidarCupon, validarCuponPublico } from '../controladores/cupones.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { estadoPago } from '../controladores/pasarelas.controlador.js'
import { validar } from '../middlewares/validacion.js'
import { limites } from '../middlewares/limiteIntentos.js'

const enrutador = Router()

enrutador.post('/', limites.pedido, exigirTenant, validar(esquemaPedidoPublico), crearPedidoPublico)
enrutador.post('/cupon', limites.cupon, exigirTenant, validar(esquemaValidarCupon), validarCuponPublico)
enrutador.get('/pagos/:referencia', exigirTenant, estadoPago)
enrutador.get('/seguimiento/:id', limites.carrito, exigirTenant, seguimientoPedido)

export default enrutador
