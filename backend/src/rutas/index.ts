import { Router } from 'express'
import { resolverTenant } from '../middlewares/resolverTenant.js'
import rutasSalud from './salud.rutas.js'
import rutasTiendas from './tiendas.rutas.js'
import rutasProductos from './productos.rutas.js'
import rutasPedidos from './pedidos.rutas.js'
import rutasVisitas from './visitas.rutas.js'
import rutasReservas from './reservas.rutas.js'
import rutasMensajes from './contacto.publico.rutas.js'
import rutasResenas from './resenas.rutas.js'
import rutasCarritos from './carritos.rutas.js'
import rutasPanel from './panel.rutas.js'
import rutasAdmin from './admin.rutas.js'
import rutasPlanes from './planes.rutas.js'
import { webhookBold } from '../controladores/suscripcion.controlador.js'
import rutasContenido from './contenido.rutas.js'
import rutasSoporte from './soporte.rutas.js'
import { recibirAviso } from '../controladores/pasarelas.controlador.js'
import { dominiosParaServidor } from '../controladores/dominios.controlador.js'

const enrutador = Router()

// Antes de resolver tenant: la sonda de salud no tiene un Host de tenant.
enrutador.use('/salud', rutasSalud)

// El panel no depende del Host: qué tienda toca lo dice el token de sesión. Va
// antes de resolver tenant para que funcione también detrás del proxy de Next,
// que reenvía con el Host de la API.
enrutador.use('/panel', rutasPanel)
enrutador.use('/admin', rutasAdmin)
enrutador.use('/planes', rutasPlanes)
enrutador.post('/bold/webhook', webhookBold)
enrutador.use('/contenido', rutasContenido)
enrutador.use('/soporte', rutasSoporte)
// Avisos de Wompi, ePayco y Bold de las tiendas (sin Host de tienda: la referencia dice cuál).
enrutador.all('/pagos/aviso/:proveedor', recibirAviso)
enrutador.get('/plataforma/dominios', dominiosParaServidor)

// A partir de aquí, toda petición pasa por la resolución de tenant por Host.
enrutador.use(resolverTenant)

enrutador.use('/tienda', rutasTiendas)
enrutador.use('/productos', rutasProductos)
enrutador.use('/pedidos', rutasPedidos)
enrutador.use('/visitas', rutasVisitas)
enrutador.use('/reservas', rutasReservas)
enrutador.use('/mensajes', rutasMensajes)
enrutador.use('/resenas', rutasResenas)
enrutador.use('/carritos', rutasCarritos)

export default enrutador
