import { Router } from 'express'
import { esquemaCarrito, guardarCarrito, recuperarCarritoPublico } from '../controladores/clientes.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'
import { limites } from '../middlewares/limiteIntentos.js'

const enrutador = Router()

enrutador.post('/', limites.carrito, exigirTenant, validar(esquemaCarrito), guardarCarrito)
enrutador.get('/:id', limites.carrito, exigirTenant, recuperarCarritoPublico)

export default enrutador
