import { Router } from 'express'
import { resolverTenant } from '../middlewares/resolverTenant.js'
import rutasSalud from './salud.rutas.js'
import rutasTiendas from './tiendas.rutas.js'
import rutasProductos from './productos.rutas.js'
import rutasPanel from './panel.rutas.js'
import rutasAdmin from './admin.rutas.js'
import rutasPlanes from './planes.rutas.js'

const enrutador = Router()

// Antes de resolver tenant: la sonda de salud no tiene un Host de tenant.
enrutador.use('/salud', rutasSalud)

// El panel no depende del Host: qué tienda toca lo dice el token de sesión. Va
// antes de resolver tenant para que funcione también detrás del proxy de Next,
// que reenvía con el Host de la API.
enrutador.use('/panel', rutasPanel)
enrutador.use('/admin', rutasAdmin)
enrutador.use('/planes', rutasPlanes)

// A partir de aquí, toda petición pasa por la resolución de tenant por Host.
enrutador.use(resolverTenant)

enrutador.use('/tienda', rutasTiendas)
enrutador.use('/productos', rutasProductos)

export default enrutador
