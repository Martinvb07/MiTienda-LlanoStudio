import { Router } from 'express'
import { validar } from '../middlewares/validacion.js'
import {
  cambiarContrasenaAdmin,
  cambiarTiendaAdmin,
  esquemaContrasena,
  esquemaOferta,
  guardarOfertaAdmin,
  listarOfertasAdmin,
  esquemaBusqueda,
  esquemaCambioTienda,
  esquemaIngresoAdmin,
  exigirAdmin,
  ingresarAdmin,
  listarTiendasAdmin,
  resumenAdmin,
} from '../controladores/admin.controlador.js'

const enrutador = Router()

enrutador.post('/ingreso', validar(esquemaIngresoAdmin), ingresarAdmin)

enrutador.use(exigirAdmin)

enrutador.get('/resumen', resumenAdmin)
enrutador.get('/tiendas', validar(esquemaBusqueda, 'query'), listarTiendasAdmin)
enrutador.patch('/tiendas/:id', validar(esquemaCambioTienda), cambiarTiendaAdmin)
enrutador.put('/tiendas/:id/contrasena', validar(esquemaContrasena), cambiarContrasenaAdmin)

enrutador.get('/planes', listarOfertasAdmin)
enrutador.put('/planes/:plan', validar(esquemaOferta), guardarOfertaAdmin)

export default enrutador
