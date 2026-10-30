import { Router } from 'express'
import {
  listarProductosPublicos,
  obtenerProductoPublico,
} from '../controladores/productos.controlador.js'
import { esquemaAvisame, pedirAvisoPublico } from '../controladores/avisos.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { limites } from '../middlewares/limiteIntentos.js'
import { validar } from '../middlewares/validacion.js'

const enrutador = Router()

enrutador.get('/', exigirTenant, listarProductosPublicos)
enrutador.get('/:slug', exigirTenant, obtenerProductoPublico)
enrutador.post('/:id/avisame', limites.formularioPublico, exigirTenant, validar(esquemaAvisame), pedirAvisoPublico)

export default enrutador
