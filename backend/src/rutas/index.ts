import { Router } from 'express'
import { resolverTenant } from '../middlewares/resolverTenant.js'
import rutasSalud from './salud.rutas.js'
import rutasTiendas from './tiendas.rutas.js'
import rutasProductos from './productos.rutas.js'
import rutasPanel from './panel.rutas.js'

const enrutador = Router()

// Antes de resolver tenant: la sonda de salud no tiene un Host de tenant.
enrutador.use('/salud', rutasSalud)

// A partir de aquí, toda petición pasa por la resolución de tenant por Host.
enrutador.use(resolverTenant)

enrutador.use('/tienda', rutasTiendas)
enrutador.use('/productos', rutasProductos)
enrutador.use('/panel', rutasPanel)

export default enrutador
