import { Router } from 'express'
import { exigirSesion } from '../middlewares/autenticacion.js'

const enrutador = Router()

/**
 * Rutas del panel de administración. Todas exigen sesión y deben filtrar
 * siempre por `req.sesion.tenantId`, nunca por un id que venga del cliente.
 *
 * Pendiente en la fase del panel: tiendas (editor de bloques), productos,
 * pedidos, medios y dominios propios.
 */
enrutador.get('/sesion', exigirSesion, (req, res) => {
  res.json({ sesion: req.sesion })
})

export default enrutador
