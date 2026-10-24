import { Router } from 'express'
import { PLANES } from '../utilidades/planes.js'
import { listarOfertas, tipoOferta } from '../servicios/ofertas.servicio.js'

const enrutador = Router()

/** Oferta pública de los planes (?tipo=pagina para la página de negocio): la consume la página de precios. */
enrutador.get('/', async (req, res) => {
  const ofertas = await listarOfertas(tipoOferta(req.query.tipo))
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ planes: ofertas.map((oferta) => ({ ...oferta, nombre: PLANES[oferta.plan].nombre })) })
})

export default enrutador
