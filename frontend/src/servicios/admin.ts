'use client'

import { ErrorPanel } from './panel'

/**
 * Cliente del panel de la plataforma (Llano Studio). Token aparte del de los
 * dueños de tienda; se obtiene en el login normal del panel y vence a las 12 h.
 */

const CLAVE = 'mitienda:admin'

export const leerTokenAdmin = () => {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function cerrarSesionAdmin() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // Nada que borrar.
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = leerTokenAdmin()
  const cabeceras = new Headers(opciones.headers)
  if (token) cabeceras.set('authorization', `Bearer ${token}`)
  if (opciones.body) cabeceras.set('content-type', 'application/json')

  const respuesta = await fetch(`/api/admin${ruta}`, { ...opciones, headers: cabeceras }).catch(() => {
    throw new ErrorPanel(0, 'No pudimos conectar con el servidor.')
  })
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: { mensaje?: string } } & T
  if (!respuesta.ok) {
    if (respuesta.status === 401) cerrarSesionAdmin()
    throw new ErrorPanel(respuesta.status, cuerpo.error?.mensaje ?? `El servidor respondió ${respuesta.status}`)
  }
  return cuerpo
}

export function guardarTokenAdmin(token: string) {
  try {
    localStorage.setItem(CLAVE, token)
  } catch {
    // Sin almacenamiento la sesión no sobrevive a recargar.
  }
}

export interface ResumenAdmin {
  tiendas: number
  publicadas: number
  suspendidas: number
  productos: number
  nuevasEstaSemana: number
  porPlan: Record<string, number>
  /** Sólo en ?tipo=enlaces: botones guardados en todas las bios. */
  enlaces?: number
}

export interface TiendaAdmin {
  id: string
  etiquetas: string[]
  origen: string | null
  nombre: string
  subdominio: string
  plan: string
  /** Hasta cuándo está pago; null = no vence. */
  planVenceEn: string | null
  activo: boolean
  creadoEn: string
  tipo: TipoSitioAdmin
  publicada: boolean
  logoUrl: string | null
  productos: number
  /** Sólo en la lista de enlaces: cuántos botones tiene su bio. */
  enlaces?: number
  propietario: { nombre: string; email: string; ultimoAccesoEn: string | null } | null
}

/** Los tres productos de Mi Sitio; cada cuenta es de uno. */
export type TipoSitioAdmin = 'tienda' | 'pagina' | 'enlaces'

export const obtenerResumen = (tipo?: TipoSitioAdmin) => pedir<ResumenAdmin>(`/resumen${tipo ? `?tipo=${tipo}` : ''}`)

export const listarTiendas = (buscar = '', tipo?: TipoSitioAdmin) =>
  pedir<{ tiendas: TiendaAdmin[] }>(
    `/tiendas?${new URLSearchParams({ ...(buscar ? { buscar } : {}), ...(tipo ? { tipo } : {}) }).toString()}`,
  ).then(
    (respuesta) => respuesta.tiendas,
  )

export const cambiarTienda = (id: string, cambios: { plan?: string; activo?: boolean }) =>
  pedir<{ tenant: { id: string; plan: string; activo: boolean; planVenceEn: string | null } }>(`/tiendas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  }).then((respuesta) => respuesta.tenant)

export const cambiarContrasena = (id: string, contrasena: string) =>
  pedir<{ email: string }>(`/tiendas/${id}/contrasena`, {
    method: 'PUT',
    body: JSON.stringify({ contrasena }),
  }).then((respuesta) => respuesta.email)

export interface OfertaPlan {
  plan: 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'
  precio: number
  /** Precio por un año; 0 = no se vende anual. */
  precioAnual: number
  resumen: string
  incluye: string[]
  destacado: boolean
}

/** La tienda en línea y la página para tu negocio tienen precios propios. */
export type TipoOferta = 'tienda' | 'pagina' | 'enlaces'

export const listarPlanes = (tipo: TipoOferta = 'tienda') =>
  pedir<{ planes: OfertaPlan[] }>(`/planes?tipo=${tipo}`).then((respuesta) => respuesta.planes)

export const guardarPlan = ({ plan, ...datos }: OfertaPlan, tipo: TipoOferta = 'tienda') =>
  pedir<{ planes: OfertaPlan[] }>(`/planes/${plan}?tipo=${tipo}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  }).then((respuesta) => respuesta.planes)

// ── Sesión y equipo ──

export type RolAdmin = 'DUENO' | 'SOPORTE' | 'LECTURA'
export interface SesionAdmin {
  email: string
  nombre: string
  rol: RolAdmin
}
export interface AdminPlataforma extends SesionAdmin {
  id: string
  activo: boolean
  ultimoAccesoEn: string | null
  creadoEn: string
}

const json = (cuerpo: unknown) => JSON.stringify(cuerpo)
const enviar = <T>(ruta: string, metodo: string, cuerpo?: unknown) =>
  pedir<T>(ruta, { method: metodo, ...(cuerpo === undefined ? {} : { body: json(cuerpo) }) })

export const quienSoy = () => pedir<{ admin: SesionAdmin }>('/yo').then((r) => r.admin)
export const cambiarMiContrasena = async (actual: string, nueva: string) => {
  const { token } = await enviar<{ token: string }>('/yo/contrasena', 'PUT', { actual, nueva })
  guardarTokenAdmin(token)
}
export const listarAdmins = () => pedir<{ admins: AdminPlataforma[]; delEntorno: string | null }>('/equipo')
export const crearAdmin = (datos: { nombre: string; email: string; rol: RolAdmin; contrasena: string }) =>
  enviar<{ admin: AdminPlataforma }>('/equipo', 'POST', datos).then((r) => r.admin)
export const cambiarAdmin = (id: string, datos: Partial<{ nombre: string; rol: RolAdmin; activo: boolean; contrasena: string }>) =>
  enviar<{ admin: AdminPlataforma }>(`/equipo/${id}`, 'PATCH', datos).then((r) => r.admin)

export interface Actividad {
  id: string
  admin: string
  accion: string
  detalle: string | null
  tenantId: string | null
  tienda: string | null
  creadoEn: string
}
export const listarActividad = (tenantId?: string) =>
  pedir<{ actividad: Actividad[] }>(`/actividad${tenantId ? `?tenantId=${tenantId}` : ''}`).then((r) => r.actividad)

// ── Dinero ──

export type PlanClave = 'GRATIS' | 'EMPRENDE' | 'NEGOCIO' | 'PRO'
export type PlanPagoClave = Exclude<PlanClave, 'GRATIS'>
export interface Duena {
  nombre: string
  email: string
}
export interface TiendaCorta {
  id: string
  nombre: string
  subdominio: string
  plan?: PlanClave
  planVenceEn?: string | null
  duena?: Duena | null
}
export interface PagoAdmin {
  referencia: string
  plan: PlanPagoClave
  periodo: 'MENSUAL' | 'ANUAL'
  monto: number
  montoOriginal?: number | null
  cuponCodigo?: string | null
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR'
  idBold?: string | null
  cubreHasta?: string | null
  creadoEn: string
  tenant: { id: string; nombre: string; subdominio?: string }
}
export interface TableroDinero {
  ingresoMes: number
  ingresoMesAnterior: number
  recurrente: number
  pagadoras: number
  meses: { mes: string; total: number; cantidad: number }[]
  vencenPronto: TiendaCorta[]
  enGracia: (TiendaCorta & { bajaEn: string })[]
  bajaron: { creadoEn: string; planAnterior: PlanClave; tenant: TiendaCorta }[]
  abandonos: { referencia: string; plan: PlanPagoClave; periodo: string; monto: number; creadoEn: string; tenant: TiendaCorta }[]
  ultimos: PagoAdmin[]
}
export const obtenerDinero = () => pedir<TableroDinero>('/dinero')
export const buscarPagos = (buscar = '', estado = '') => {
  const consulta = new URLSearchParams({ ...(buscar ? { buscar } : {}), ...(estado ? { estado } : {}) }).toString()
  return pedir<{ pagos: PagoAdmin[] }>(`/pagos${consulta ? `?${consulta}` : ''}`).then((r) => r.pagos)
}
export const detallePago = (referencia: string) =>
  pedir<{ pago: PagoAdmin & { datosBold: unknown } }>(`/pagos/${referencia}`).then((r) => r.pago)
export const reembolsarPago = (referencia: string, quitarTiempo: boolean) =>
  enviar<{ ok: true }>(`/pagos/${referencia}/reembolso`, 'POST', { quitarTiempo })

export interface CuponSuscripcion {
  id: string
  codigo: string
  porcentaje: number
  planes: PlanPagoClave[]
  usosMaximos: number | null
  usos: number
  venceEn: string | null
  activo: boolean
}
export type DatosCuponSuscripcion = Omit<CuponSuscripcion, 'id' | 'usos'>
export const listarCuponesSuscripcion = () => pedir<{ cupones: CuponSuscripcion[] }>('/cupones').then((r) => r.cupones)
export const guardarCuponSuscripcion = (datos: DatosCuponSuscripcion, id?: string) =>
  enviar<{ cupon: CuponSuscripcion }>(id ? `/cupones/${id}` : '/cupones', id ? 'PUT' : 'POST', datos).then((r) => r.cupon)
export const eliminarCuponSuscripcion = (id: string) => enviar<void>(`/cupones/${id}`, 'DELETE')

export interface Promos {
  prueba: { activa: boolean; plan: PlanPagoClave; dias: number }
  referidos: { activa: boolean; dias: number }
  topReferidos?: { tienda: { id: string; nombre: string; subdominio: string } | null; invitadas: number }[]
}
export const leerPromos = () => pedir<Promos>('/promos')
export const guardarPromos = (datos: Pick<Promos, 'prueba' | 'referidos'>) => enviar<Promos>('/promos', 'PUT', datos)

// ── Tiendas ──

export interface FichaTienda {
  tienda: {
    id: string
    nombre: string
    subdominio: string
    plan: PlanClave
    activo: boolean
    etiquetas: string[]
    origen: string | null
    creadoEn: string
    suscripcion: { estado: string; venceEn: string | null; diasRestantes: number | null }
    logoUrl: string | null
    publicada: boolean
    plantilla: string | null
    whatsapp: string | null
  }
  duena: { id: string; nombre: string; email: string; ultimoAccesoEn: string | null } | null
  equipo: { id: string; nombre: string; email: string; rol: string; activo: boolean; ultimoAccesoEn: string | null }[]
  uso: { productos: number; sinFoto: number; pedidos: number; pedidos30: number; ventas: string; visitas30: number }
  salud: { puntaje: number; problemas: string[] }
  dominios: { dominio: string; verificado: boolean }[]
  pagos: PagoAdmin[]
  notas: { id: string; autor: string; texto: string; creadoEn: string }[]
  historial: { id: string; planAnterior: PlanClave; planNuevo: PlanClave; motivo: string; detalle: string | null; creadoEn: string }[]
  tickets: { id: string; numero: number; asunto: string | null; estado: string; ultimoMensajeEn: string }[]
  referidos: { invitadas: number; invitadaPor: { id: string; nombre: string } | null }
  actividad: Omit<Actividad, 'tienda'>[]
}
export const obtenerFicha = (id: string) => pedir<FichaTienda>(`/tiendas/${id}`)
export const extenderPlan = (id: string, datos: { dias: number; plan?: PlanPagoClave; motivo?: string }) =>
  enviar<{ plan: PlanClave; planVenceEn: string }>(`/tiendas/${id}/extender`, 'POST', datos)
export const agregarNota = (id: string, texto: string) =>
  enviar<{ nota: FichaTienda['notas'][number] }>(`/tiendas/${id}/notas`, 'POST', { texto }).then((r) => r.nota)
export const quitarNota = (id: string, nota: string) => enviar<void>(`/tiendas/${id}/notas/${nota}`, 'DELETE')
export const cambiarEtiquetas = (id: string, etiquetas: string[]) =>
  enviar<{ etiquetas: string[] }>(`/tiendas/${id}/etiquetas`, 'PUT', { etiquetas }).then((r) => r.etiquetas)
export const tokenParaEntrar = (id: string) => enviar<{ token: string }>(`/tiendas/${id}/entrar`, 'POST').then((r) => r.token)

export interface TiendaGaleria {
  id: string
  nombre: string
  subdominio: string
  plan: PlanClave
  etiquetas: string[]
  logoUrl: string | null
  plantilla: string
  fotos: string[]
  productos: number
  pedidos: number
}
export const obtenerGaleria = () => pedir<{ tiendas: TiendaGaleria[] }>('/galeria').then((r) => r.tiendas)

/** Descarga un archivo del admin (CSV o respaldo) con el token puesto. */
export async function descargar(ruta: string, nombre: string) {
  const respuesta = await fetch(`/api/admin${ruta}`, { headers: { authorization: `Bearer ${leerTokenAdmin() ?? ''}` } })
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: { mensaje?: string } }
    throw new ErrorPanel(respuesta.status, cuerpo.error?.mensaje ?? 'No se pudo descargar')
  }
  const url = URL.createObjectURL(await respuesta.blob())
  const enlace = Object.assign(document.createElement('a'), { href: url, download: nombre })
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ── Crecimiento ──

export interface TableroCrecimiento {
  embudo: { paso: string; cantidad: number }[]
  registrosPorDia: { dia: string; registros: number }[]
  plantillas: { nombre: string; cantidad: number }[]
  bloques: { nombre: string; cantidad: number }[]
  bajas: { planAnterior: PlanClave; planNuevo: PlanClave; motivo: string; creadoEn: string; tenant: { id: string; nombre: string } }[]
  subidas: number
  origenes: { nombre: string; cantidad: number }[]
}
export const obtenerCrecimiento = () => pedir<TableroCrecimiento>('/crecimiento')

// ── Comunicación ──

export interface Anuncio {
  id: string
  titulo: string
  cuerpo: string
  tipo: 'CAMPANA' | 'BARRA'
  planes: PlanClave[]
  activo: boolean
  desde: string
  hasta: string | null
}
export type DatosAnuncio = Omit<Anuncio, 'id' | 'desde'> & { desde?: string }
export const listarAnuncios = () => pedir<{ anuncios: Anuncio[] }>('/anuncios').then((r) => r.anuncios)
export const guardarAnuncio = (datos: DatosAnuncio, id?: string) =>
  enviar<{ anuncio: Anuncio }>(id ? `/anuncios/${id}` : '/anuncios', id ? 'PUT' : 'POST', datos).then((r) => r.anuncio)
export const eliminarAnuncio = (id: string) => enviar<void>(`/anuncios/${id}`, 'DELETE')

export interface Novedad {
  id: string
  titulo: string
  cuerpo: string
  etiqueta: string | null
  publicadaEn: string
}
export const listarNovedades = () => pedir<{ novedades: Novedad[] }>('/novedades').then((r) => r.novedades)
export const guardarNovedad = (datos: Omit<Novedad, 'id' | 'publicadaEn'>, id?: string) =>
  enviar<{ novedad: Novedad }>(id ? `/novedades/${id}` : '/novedades', id ? 'PUT' : 'POST', datos).then((r) => r.novedad)
export const eliminarNovedad = (id: string) => enviar<void>(`/novedades/${id}`, 'DELETE')

export interface PlantillaWhatsapp {
  titulo: string
  texto: string
}
export const leerPlantillasWhatsapp = () =>
  pedir<{ plantillas: PlantillaWhatsapp[] }>('/plantillas-whatsapp').then((r) => r.plantillas)
export const guardarPlantillasWhatsapp = (plantillas: PlantillaWhatsapp[]) =>
  enviar<{ plantillas: PlantillaWhatsapp[] }>('/plantillas-whatsapp', 'PUT', { plantillas }).then((r) => r.plantillas)

export interface AjustesCorreos {
  bienvenida: boolean
  vencePronto: boolean
  teExtranamos: boolean
}
export const leerCorreos = () =>
  pedir<{ configurado: boolean; ajustes: AjustesCorreos; enviados: Record<string, number> }>('/correos')
export const guardarCorreos = (ajustes: AjustesCorreos) => enviar<{ ajustes: AjustesCorreos }>('/correos', 'PUT', ajustes)
export const probarCorreo = () => enviar<{ ok: true }>('/correos/prueba', 'POST')

// ── Contenido ──

export interface SeccionArticulo {
  titulo?: string
  parrafos: string[]
  lista?: string[]
}
export interface ArticuloAdmin {
  id: string
  slug: string
  titulo: string
  categoria: string
  resumen: string
  portada: string
  minutos: number
  secciones: SeccionArticulo[]
  publicado: boolean
  fecha: string
}
export type DatosArticulo = Omit<ArticuloAdmin, 'id'>
export const listarArticulos = () => pedir<{ articulos: ArticuloAdmin[] }>('/articulos').then((r) => r.articulos)
export const guardarArticulo = (datos: DatosArticulo, id?: string) =>
  enviar<{ articulo: ArticuloAdmin }>(id ? `/articulos/${id}` : '/articulos', id ? 'PUT' : 'POST', datos).then((r) => r.articulo)
export const eliminarArticulo = (id: string) => enviar<void>(`/articulos/${id}`, 'DELETE')

export interface TextosWeb {
  preguntasPrecios: { pregunta: string; respuesta: string }[]
  testimonios: { nombre: string; tienda: string; texto: string; foto?: string }[]
  opcionesSoporte: { pregunta: string; respuesta: string; enlace?: string }[]
}
export const leerTextos = () => pedir<TextosWeb>('/textos')
export const guardarTextos = (datos: TextosWeb) => enviar<TextosWeb>('/textos', 'PUT', datos)

// ── Sistema ──

export interface EstadoSistema {
  postgres: { ok: boolean; ms: number; error?: string }
  redis: { ok: boolean; ms: number; error?: string }
  disco: { total: number; libre: number } | null
  memoria: { total: number; libre: number; proceso: number }
  carga: number[]
  activoDesde: string
  node: string
  version: { sha: string; mensaje: string; fecha: string } | null
  servicios: { bold: boolean; correo: boolean; r2: boolean }
  errores: number
}
export const obtenerSistema = () => pedir<EstadoSistema>('/sistema')
export const listarErrores = () =>
  pedir<{ errores: { hora: string; metodo: string; ruta: string; mensaje: string; pila?: string }[] }>('/errores').then(
    (r) => r.errores,
  )
export const listarBloqueados = () =>
  pedir<{ bloqueados: { subdominio: string; motivo: string | null; creadoEn: string }[] }>('/subdominios').then((r) => r.bloqueados)
export const bloquearSubdominio = (subdominio: string, motivo?: string) =>
  enviar<{ aviso: string | null }>('/subdominios', 'POST', { subdominio, motivo })
export const desbloquearSubdominio = (subdominio: string) => enviar<void>(`/subdominios/${subdominio}`, 'DELETE')
export const listarTodosLosDominios = () =>
  pedir<{
    dominios: { id: string; dominio: string; verificado: boolean; creadoEn: string; tenant: { id: string; nombre: string; subdominio: string } }[]
  }>('/dominios').then((r) => r.dominios)
export const quitarDominio = (id: string) => enviar<void>(`/dominios/${id}`, 'DELETE')
export interface Mantenimiento {
  registrosCerrados: boolean
  mensaje: string
}
export const leerMantenimiento = () => pedir<Mantenimiento>('/mantenimiento')
export const guardarMantenimiento = (datos: Mantenimiento) => enviar<Mantenimiento>('/mantenimiento', 'PUT', datos)

// ── Soporte ──

export type EstadoTicket = 'ABIERTO' | 'EN_CURSO' | 'RESUELTO'
export interface TicketBandeja {
  id: string
  numero: number
  origen: 'LANDING' | 'PANEL'
  nombre: string
  email: string
  asunto: string | null
  estado: EstadoTicket
  asignadoA: string | null
  calificacion: number | null
  noLeidosAsesor: number
  ultimoMensajeEn: string
  creadoEn: string
  tenant: { id: string; nombre: string; subdominio: string; plan: PlanClave } | null
  ultimoMensaje: { texto: string; autor: string } | null
}
export interface MensajeSoporte {
  id: string
  autor: 'CLIENTE' | 'ASESOR' | 'SISTEMA'
  nombreAutor: string
  texto: string
  creadoEn: string
}
export const listarTickets = (estado = '', buscar = '') => {
  const consulta = new URLSearchParams({ ...(estado ? { estado } : {}), ...(buscar ? { buscar } : {}) }).toString()
  return pedir<{ tickets: TicketBandeja[]; conteo: { abiertos: number; enCurso: number } }>(
    `/tickets${consulta ? `?${consulta}` : ''}`,
  )
}
export const verTicket = (id: string) =>
  pedir<{ ticket: TicketBandeja & { mensajes: MensajeSoporte[] } }>(`/tickets/${id}`).then((r) => r.ticket)
export const cambiarTicket = (id: string, datos: { estado?: EstadoTicket; asignadoA?: string | null }) =>
  enviar<{ ticket: TicketBandeja }>(`/tickets/${id}`, 'PATCH', datos).then((r) => r.ticket)
