import { Router } from 'express'
import { PLANES } from '../utilidades/planes.js'
import { listarOfertas, tipoOferta } from '../servicios/ofertas.servicio.js'

const enrutador = Router()

/** Oferta pública de los planes (?tipo=pagina para la página de negocio): la consume la página de precios. */
enrutador.get('/', async (req, res) => {
  const tipo = tipoOferta(req.query.tipo)
  const ofertas = await listarOfertas(tipo)
  res.set('Cache-Control', 'public, max-age=60')
  // Devuelve de qué producto son: la web descarta una respuesta que no sea del que pidió.
  res.json({ tipo, planes: ofertas.map((oferta) => ({ ...oferta, nombre: PLANES[oferta.plan].nombre })) })
})

export default enrutador
