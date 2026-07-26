import { Router } from 'express'
import { obtenerTiendaPublica } from '../controladores/tiendas.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'

const enrutador = Router()

enrutador.get('/', exigirTenant, obtenerTiendaPublica)

export default enrutador
