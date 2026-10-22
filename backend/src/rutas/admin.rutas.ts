import { Router } from 'express'
import { validar } from '../middlewares/validacion.js'
import {
  cambiarContrasenaAdmin,
  cambiarTiendaAdmin,
  esquemaBusqueda,
  esquemaCambioTienda,
  esquemaContrasena,
  esquemaIngresoAdmin,
  esquemaOferta,
  guardarOfertaAdmin,
  ingresarAdmin,
  listarOfertasAdmin,
  listarTiendasAdmin,
  resumenAdmin,
} from '../controladores/admin.controlador.js'
import * as equipo from '../controladores/admin/equipo.js'
import * as dinero from '../controladores/admin/dinero.js'
import * as tiendas from '../controladores/admin/tiendas.js'
import * as crecimiento from '../controladores/admin/crecimiento.js'
import * as comunicacion from '../controladores/admin/comunicacion.js'
import * as sistema from '../controladores/admin/sistema.js'
import * as contenido from '../controladores/admin/contenido.js'
import * as soporte from '../controladores/admin/soporte.js'
import { exigirAdmin, puedeEscribir, soloDueno } from '../servicios/admins.servicio.js'

/**
 * Admin de la plataforma. Roles: LECTURA ve todo y no cambia nada; SOPORTE
 * atiende el chat, anota y entra a las tiendas; DUENO además maneja dinero,
 * planes, admins y el servidor.
 */
const enrutador = Router()

enrutador.post('/ingreso', validar(esquemaIngresoAdmin), ingresarAdmin)

enrutador.use(exigirAdmin)

// Cuenta y equipo
enrutador.get('/yo', equipo.yo)
enrutador.put('/yo/contrasena', validar(equipo.esquemaMiContrasena), equipo.cambiarMiContrasena)
enrutador.get('/equipo', soloDueno, equipo.listarAdmins)
enrutador.post('/equipo', soloDueno, validar(equipo.esquemaNuevoAdmin), equipo.crearAdmin)
enrutador.patch('/equipo/:id', soloDueno, validar(equipo.esquemaCambioAdmin), equipo.cambiarAdmin)
enrutador.get('/actividad', validar(equipo.esquemaFiltroActividad, 'query'), equipo.listarActividad)

// Tiendas
enrutador.get('/resumen', resumenAdmin)
enrutador.get('/tiendas', validar(esquemaBusqueda, 'query'), listarTiendasAdmin)
enrutador.get('/tiendas/:id', tiendas.fichaTienda)
enrutador.patch('/tiendas/:id', soloDueno, validar(esquemaCambioTienda), cambiarTiendaAdmin)
enrutador.put('/tiendas/:id/contrasena', puedeEscribir, validar(esquemaContrasena), cambiarContrasenaAdmin)
enrutador.post('/tiendas/:id/extender', soloDueno, validar(tiendas.esquemaExtender), tiendas.extenderPlan)
enrutador.post('/tiendas/:id/notas', puedeEscribir, validar(tiendas.esquemaNota), tiendas.agregarNota)
enrutador.delete('/tiendas/:id/notas/:nota', puedeEscribir, tiendas.quitarNota)
enrutador.put('/tiendas/:id/etiquetas', puedeEscribir, validar(tiendas.esquemaEtiquetas), tiendas.cambiarEtiquetas)
enrutador.post('/tiendas/:id/entrar', puedeEscribir, tiendas.entrarComoTienda)
enrutador.get('/galeria', tiendas.galeria)
enrutador.get('/exportar/:tipo', soloDueno, tiendas.exportar)

// Dinero
enrutador.get('/dinero', dinero.tableroDinero)
enrutador.get('/pagos', validar(dinero.esquemaBuscarPagos, 'query'), dinero.listarPagos)
enrutador.get('/pagos/:referencia', dinero.detallePago)
enrutador.post('/pagos/:referencia/reembolso', soloDueno, validar(dinero.esquemaReembolso), dinero.reembolsarPago)
enrutador.get('/cupones', dinero.listarCuponesSuscripcion)
enrutador.post('/cupones', soloDueno, validar(dinero.esquemaCuponSuscripcion), dinero.guardarCuponSuscripcion)
enrutador.put('/cupones/:id', soloDueno, validar(dinero.esquemaCuponSuscripcion), dinero.guardarCuponSuscripcion)
enrutador.delete('/cupones/:id', soloDueno, dinero.eliminarCuponSuscripcion)
enrutador.get('/promos', dinero.leerPromos)
enrutador.put('/promos', soloDueno, validar(dinero.esquemaPromos), dinero.guardarPromos)
enrutador.get('/planes', listarOfertasAdmin)
enrutador.put('/planes/:plan', soloDueno, validar(esquemaOferta), guardarOfertaAdmin)

// Crecimiento
enrutador.get('/crecimiento', crecimiento.tableroCrecimiento)

// Comunicación
enrutador.get('/anuncios', comunicacion.listarAnuncios)
enrutador.post('/anuncios', puedeEscribir, validar(comunicacion.esquemaAnuncio), comunicacion.guardarAnuncio)
enrutador.put('/anuncios/:id', puedeEscribir, validar(comunicacion.esquemaAnuncio), comunicacion.guardarAnuncio)
enrutador.delete('/anuncios/:id', puedeEscribir, comunicacion.eliminarAnuncio)
enrutador.get('/novedades', comunicacion.listarNovedades)
enrutador.post('/novedades', puedeEscribir, validar(comunicacion.esquemaNovedad), comunicacion.guardarNovedad)
enrutador.put('/novedades/:id', puedeEscribir, validar(comunicacion.esquemaNovedad), comunicacion.guardarNovedad)
enrutador.delete('/novedades/:id', puedeEscribir, comunicacion.eliminarNovedad)
enrutador.get('/plantillas-whatsapp', comunicacion.leerPlantillasWhatsapp)
enrutador.put('/plantillas-whatsapp', puedeEscribir, validar(comunicacion.esquemaPlantillas), comunicacion.guardarPlantillasWhatsapp)
enrutador.get('/correos', comunicacion.leerCorreos)
enrutador.put('/correos', soloDueno, validar(comunicacion.esquemaCorreos), comunicacion.guardarCorreos)
enrutador.post('/correos/prueba', soloDueno, comunicacion.probarCorreo)

// Contenido de la web
enrutador.get('/articulos', contenido.listarArticulosAdmin)
enrutador.post('/articulos', puedeEscribir, validar(contenido.esquemaArticulo), contenido.guardarArticulo)
enrutador.put('/articulos/:id', puedeEscribir, validar(contenido.esquemaArticulo), contenido.guardarArticulo)
enrutador.delete('/articulos/:id', puedeEscribir, contenido.eliminarArticulo)
enrutador.get('/textos', contenido.leerTextos)
enrutador.put('/textos', puedeEscribir, validar(contenido.esquemaTextos), contenido.guardarTextos)

// Sistema
enrutador.get('/sistema', sistema.estadoSistema)
enrutador.get('/errores', sistema.listarErrores)
enrutador.get('/respaldo', soloDueno, sistema.descargarRespaldo)
enrutador.get('/subdominios', sistema.listarBloqueados)
enrutador.post('/subdominios', soloDueno, validar(sistema.esquemaBloqueo), sistema.bloquearSubdominio)
enrutador.delete('/subdominios/:subdominio', soloDueno, sistema.desbloquearSubdominio)
enrutador.get('/dominios', sistema.listarTodosLosDominios)
enrutador.delete('/dominios/:id', soloDueno, sistema.quitarDominioAdmin)
enrutador.get('/mantenimiento', sistema.leerMantenimiento)
enrutador.put('/mantenimiento', soloDueno, validar(sistema.esquemaMantenimiento), sistema.guardarMantenimiento)

// Soporte
enrutador.get('/tickets', soporte.listarTickets)
enrutador.get('/tickets/:id', soporte.verTicket)
enrutador.patch('/tickets/:id', puedeEscribir, validar(soporte.esquemaCambioTicket), soporte.cambiarTicket)

export default enrutador
