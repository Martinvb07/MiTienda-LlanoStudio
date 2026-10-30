import { Router } from 'express'
import { crearResenaPublica, esquemaResena, listarResenasPublicas } from '../controladores/resenas.controlador.js'
import { exigirTenant } from '../middlewares/resolverTenant.js'
import { validar } from '../middlewares/validacion.js'
import { limites } from '../middlewares/limiteIntentos.js'

const enrutador = Router()

enrutador.get('/', exigirTenant, listarResenasPublicas)
enrutador.post('/', limites.formularioPublico, exigirTenant, validar(esquemaResena), crearResenaPublica)

export default enrutador
