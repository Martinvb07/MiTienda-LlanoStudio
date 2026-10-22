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
  agregarDominio,
  esquemaDominio,
  listarDominios,
  quitarDominio,
  verificarDominio,
} from '../controladores/dominios.controlador.js'
import {
  agregarMiembro,
  cambiarMiembro,
  esquemaCambioMiembro,
  esquemaMiembro,
  exigirRolActual,
  listarEquipo,
  quitarMiembro,
} from '../controladores/equipo.controlador.js'
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
import {
  crearCheckout,
  esquemaCheckout,
  obtenerReferidos,
  obtenerSuscripcion,
  probarCupon,
  verificarPago,
} from '../controladores/suscripcion.controlador.js'
import { marcarNovedadesVistas, obtenerComunicados } from '../controladores/comunicados.controlador.js'

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

// Lo de dinero y personas, sólo para dueña y administradores.
const gestion = exigirRolActual('PROPIETARIO', 'ADMINISTRADOR')

enrutador.get('/metricas', gestion, obtenerMetricas)
enrutador.get('/avisos', obtenerAvisos)
enrutador.get('/comunicados', obtenerComunicados)
enrutador.post('/novedades/vistas', marcarNovedadesVistas)

enrutador.get('/cupones', gestion, listarCupones)
enrutador.post('/cupones', gestion, validar(esquemaCupon), crearCupon)
enrutador.put('/cupones/:id', gestion, validar(esquemaCupon), actualizarCupon)
enrutador.delete('/cupones/:id', gestion, eliminarCupon)

enrutador.get('/dominios', gestion, listarDominios)
enrutador.post('/dominios', gestion, validar(esquemaDominio), agregarDominio)
enrutador.post('/dominios/:id/verificar', gestion, verificarDominio)
enrutador.delete('/dominios/:id', gestion, quitarDominio)

enrutador.get('/suscripcion', gestion, obtenerSuscripcion)
enrutador.post('/suscripcion/checkout', gestion, validar(esquemaCheckout), crearCheckout)
enrutador.post('/suscripcion/pagos/:referencia/verificar', gestion, verificarPago)
enrutador.post('/suscripcion/cupon', gestion, validar(esquemaCheckout), probarCupon)
enrutador.get('/referidos', gestion, obtenerReferidos)

enrutador.get('/equipo', gestion, listarEquipo)
enrutador.post('/equipo', gestion, validar(esquemaMiembro), agregarMiembro)
enrutador.patch('/equipo/:id', gestion, validar(esquemaCambioMiembro), cambiarMiembro)
enrutador.delete('/equipo/:id', gestion, quitarMiembro)

enrutador.get('/pedidos', listarPedidosPanel)
enrutador.patch('/pedidos/:id', validar(esquemaActualizarPedido), actualizarPedidoPanel)

// La imagen llega como cuerpo binario: sin multipart no hace falta otra dependencia.
enrutador.post(
  '/medios',
  express.raw({ type: Object.keys(TIPOS_IMAGEN), limit: '8mb' }),
  subirMedioPanel,
)

export default enrutador
