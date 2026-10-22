import { Router } from 'express'
import { PLANES } from '../utilidades/planes.js'
import { listarOfertas } from '../servicios/ofertas.servicio.js'

const enrutador = Router()

/** Oferta pública de los planes: la consume la página de precios. */
enrutador.get('/', async (_req, res) => {
  const ofertas = await listarOfertas()
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ planes: ofertas.map((oferta) => ({ ...oferta, nombre: PLANES[oferta.plan].nombre })) })
})

export default enrutador
