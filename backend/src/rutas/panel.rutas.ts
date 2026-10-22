import express, { Router } from 'express'
import { exigirSesion } from '../middlewares/autenticacion.js'
import { validar } from '../middlewares/validacion.js'
import { TIPOS_IMAGEN } from '../almacenamiento/index.js'
import {
  actualizarCuenta,
  actualizarProductoPanel,
  actualizarTiendaPanel,
  cambiarContrasena,
  crearProductoPanel,
  eliminarProductoPanel,
  esquemaContrasena,
  esquemaCuenta,
  esquemaIngreso,
  esquemaProducto,
  esquemaRegistro,
  esquemaTienda,
  ingresar,
  listarProductosPanel,
  obtenerSesion,
  obtenerTiendaPanel,
  registrar,
  subirMedioPanel,
} from '../controladores/panel.controlador.js'
import { obtenerAvisos, obtenerMetricas } from '../controladores/metricas.controlador.js'
import {
  actualizarCupon,
  crearCupon,
  eliminarCupon,
  esquemaCupon,
  listarCupones,
} from '../controladores/cupones.controlador.js'
import {
  esquemaCategoria,
  esquemaImportar,
  esquemaLote,
  importarProductos,
  loteProductos,
  renombrarCategoria,
} from '../controladores/catalogo.controlador.js'
import {
  actualizarPedidoPanel,
  esquemaActualizarPedido,
  listarPedidosPanel,
} from '../controladores/pedidos.controlador.js'

const enrutador = Router()

/**
 * Rutas del panel de administración. Las que exigen sesión filtran siempre por
 * `req.sesion.tenantId`, nunca por un id que venga del cliente.
 *
 * Pendiente: pedidos y dominios propios.
 */
enrutador.post('/registro', validar(esquemaRegistro), registrar)
enrutador.post('/ingreso', validar(esquemaIngreso), ingresar)

enrutador.use(exigirSesion)

enrutador.get('/sesion', obtenerSesion)
enrutador.put('/cuenta', validar(esquemaCuenta), actualizarCuenta)
enrutador.put('/cuenta/contrasena', validar(esquemaContrasena), cambiarContrasena)

enrutador.get('/tienda', obtenerTiendaPanel)
enrutador.put('/tienda', validar(esquemaTienda), actualizarTiendaPanel)

enrutador.get('/productos', listarProductosPanel)
enrutador.post('/productos', validar(esquemaProducto), crearProductoPanel)
// Antes de /productos/:id, para que "lote" e "importar" no se lean como ids.
enrutador.post('/productos/lote', validar(esquemaLote), loteProductos)
enrutador.post('/productos/importar', validar(esquemaImportar), importarProductos)
enrutador.put('/categorias', validar(esquemaCategoria), renombrarCategoria)
enrutador.put('/productos/:id', validar(esquemaProducto), actualizarProductoPanel)
enrutador.delete('/productos/:id', eliminarProductoPanel)

enrutador.get('/metricas', obtenerMetricas)
enrutador.get('/avisos', obtenerAvisos)

enrutador.get('/cupones', listarCupones)
enrutador.post('/cupones', validar(esquemaCupon), crearCupon)
enrutador.put('/cupones/:id', validar(esquemaCupon), actualizarCupon)
enrutador.delete('/cupones/:id', eliminarCupon)

enrutador.get('/pedidos', listarPedidosPanel)
enrutador.patch('/pedidos/:id', validar(esquemaActualizarPedido), actualizarPedidoPanel)

// La imagen llega como cuerpo binario: sin multipart no hace falta otra dependencia.
enrutador.post(
  '/medios',
  express.raw({ type: Object.keys(TIPOS_IMAGEN), limit: '8mb' }),
  subirMedioPanel,
)

export default enrutador
