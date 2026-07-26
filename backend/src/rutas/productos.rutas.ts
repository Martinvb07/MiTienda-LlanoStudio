import { Router } from 'express'
import {
  listarProductosPublicos,
  obtenerProductoPublico,
} from '../controladores/productos.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'

const enrutador = Router()

enrutador.get('/', exigirTenant, listarProductosPublicos)
enrutador.get('/:slug', exigirTenant, obtenerProductoPublico)

export default enrutador
