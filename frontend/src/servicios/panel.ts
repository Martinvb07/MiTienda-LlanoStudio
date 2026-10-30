'use client'

import { refrescarTienda } from '@/app/panel/acciones'
import { normalizarBloques } from '@/tipos/bloques'
import type { Cupon, DatosCupon, EstadoPedido, Pedido } from '@/tipos/pedidos'
import type { ProductoPanel, Tienda, TipoSitio } from '@/tipos/tienda'
import type { AgendaPanel, Cita, DatosCitaPanel, EstadoCita } from '@/tipos/citas'

/**
 * Cliente del panel en el navegador. Habla con la API por el mismo origen:
 * next.config.ts reenvía /api/* al backend, así que no hay CORS ni URLs que
 * cambien entre entornos. La sesión es un JWT guardado en este navegador.
 */

const CLAVE_SESION = 'mitienda:sesion'

export class ErrorPanel extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
    /** Errores por campo, tal como los devuelve el validador del backend. */
    readonly campos: Record<string, string> = {},
  ) {
    super(mensaje)
    this.name = 'ErrorPanel'
  }
}

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_SESION)
  } catch {
    return null
  }
}

export function guardarToken(token: string) {
  try {
    localStorage.setItem(CLAVE_SESION, token)
  } catch {
    // Navegador sin almacenamiento: la sesión dura lo que dure la pestaña.
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Nada que borrar.
  }
}

/** Lo que se guarda aquí no cambia la tienda pública: no hace falta refrescarla. */
const SIN_TIENDA = /^\/(ingreso|registro|recuperar|cuenta|novedades|soporte|citas|mensajes|clientes|carritos)/

let esperaRefresco: ReturnType<typeof setTimeout> | undefined

/**
 * Después de guardar, la tienda pública se refresca enseguida (si no, tardaba
 * hasta un minuto). Varios cambios seguidos se juntan en un solo refresco.
 */
function refrescarDespues(ruta: string, metodo: string) {
  if (metodo === 'GET' || SIN_TIENDA.test(ruta)) return
  clearTimeout(esperaRefresco)
  esperaRefresco = setTimeout(() => {
    const token = leerToken()
    if (token) void refrescarTienda(token).catch(() => undefined)
  }, 400)
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = leerToken()
  const cabeceras = new Headers(opciones.headers)
  if (token) cabeceras.set('authorization', `Bearer ${token}`)
  if (opciones.body && typeof opciones.body === 'string') cabeceras.set('content-type', 'application/json')

  let respuesta: Response
  try {
    respuesta = await fetch(`/api/panel${ruta}`, { ...opciones, headers: cabeceras })
  } catch {
    throw new ErrorPanel(0, 'No pudimos conectar con el servidor. Revisa tu conexión.')
  }

  if (respuesta.status === 204) return undefined as T

  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    error?: { mensaje?: string; detalles?: { campo: string; mensaje: string }[] }
  } & T

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      cerrarSesion()
      window.location.assign('/panel/ingresar')
    }
    const campos = Object.fromEntries(
      (cuerpo.error?.detalles ?? []).map((detalle) => [detalle.campo, detalle.mensaje]),
    )
    throw new ErrorPanel(
      respuesta.status,
      cuerpo.error?.mensaje ?? `El servidor respondió ${respuesta.status}`,
      campos,
    )
  }

  refrescarDespues(ruta, (opciones.method ?? 'GET').toUpperCase())
  return cuerpo
}

// ── Sesión ──

export interface SesionPanel {
  usuario: { nombre: string; email: string; rol: string }
  tenant: { subdominio: string; plan: string; suscripcion?: EstadoSuscripcion }
  tienda: { nombre: string; logoUrl: string | null; publicada: boolean; tipo?: TipoSitio } | null
}

/** Cómo va el plan pago. `gracia` = ya venció y cuenta los días antes de volver a Gratis. */
export interface EstadoSuscripcion {
  estado: 'sin-vencimiento' | 'activa' | 'por-vencer' | 'gracia'
  venceEn: string | null
  diasRestantes: number | null
  bajaEn: string | null
}

export async function registrar(datos: {
  nombre: string
  email: string
  contrasena: string
  tienda: string
  subdominio: string
  ref?: string
  origen?: string
  /** Tienda (por defecto) o página informativa. */
  tipo?: TipoSitio
}) {
  const { token } = await pedir<{ token: string }>('/registro', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
  guardarToken(token)
}

/** Devuelve el token y si es del admin de la plataforma (que entra por el mismo login). */
export async function ingresar(email: string, contrasena: string) {
  const { token, admin } = await pedir<{ token: string; admin?: boolean }>('/ingreso', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  })
  if (!admin) guardarToken(token)
  return { token, admin: Boolean(admin) }
}

export const obtenerSesion = () => pedir<SesionPanel>('/sesion')

// ── Tienda ──

export type DatosTienda = Pick<
  Tienda,
  'nombre' | 'descripcion' | 'logoUrl' | 'plantilla' | 'tema' | 'configuracionBloques' | 'ajustes' | 'publicada'
>

export async function obtenerTienda(): Promise<{ tienda: Tienda; subdominio: string }> {
  const { tienda, subdominio } = await pedir<{ tienda: Tienda; subdominio: string }>('/tienda')
  return {
    subdominio,
    tienda: {
      ...tienda,
      tema: tienda.tema ?? {},
      ajustes: tienda.ajustes ?? {},
      configuracionBloques: normalizarBloques(tienda.configuracionBloques),
    },
  }
}

export async function guardarTienda(datos: DatosTienda): Promise<Tienda> {
  const { tienda } = await pedir<{ tienda: Tienda }>('/tienda', {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
  return {
    ...tienda,
    ajustes: tienda.ajustes ?? {},
    configuracionBloques: normalizarBloques(tienda.configuracionBloques),
  }
}

// ── Cuenta ──

export async function actualizarCuenta(datos: { nombre: string; email: string }) {
  const { token } = await pedir<{ token: string }>('/cuenta', { method: 'PUT', body: JSON.stringify(datos) })
  guardarToken(token)
}

export const cambiarContrasena = (actual: string, nueva: string) =>
  pedir<void>('/cuenta/contrasena', { method: 'PUT', body: JSON.stringify({ actual, nueva }) })

// ── Productos ──

export type DatosProducto = Omit<ProductoPanel, 'id' | 'actualizadoEn'>

export const listarProductos = () =>
  pedir<{ productos: ProductoPanel[] }>('/productos').then((respuesta) => respuesta.productos)

export const crearProducto = (datos: DatosProducto) =>
  pedir<{ producto: ProductoPanel }>('/productos', {
    method: 'POST',
    body: JSON.stringify(datos),
  }).then((respuesta) => respuesta.producto)

export const actualizarProducto = (id: string, datos: DatosProducto) =>
  pedir<{ producto: ProductoPanel }>(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  }).then((respuesta) => respuesta.producto)

export const eliminarProducto = (id: string) =>
  pedir<void>(`/productos/${id}`, { method: 'DELETE' })

// ── Pedidos ──

export const listarPedidos = () =>
  pedir<{ pedidos: Pedido[] }>('/pedidos').then((respuesta) => respuesta.pedidos)

export interface CambiosPedido {
  estado?: EstadoPedido
  notaInterna?: string | null
  transportadora?: string | null
  guia?: string | null
}

export const actualizarPedido = (id: string, cambios: CambiosPedido) =>
  pedir<{ pedido: Pedido }>(`/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }).then(
    (respuesta) => respuesta.pedido,
  )

// ── Estadísticas ──

export interface DiaMetricas {
  fecha: string
  visitas: number
  visitantes: number
  pedidos: number
  ventas: number
}

export interface Metricas {
  dias: number
  maximoDias: number
  serie: DiaMetricas[]
  totales: {
    visitas: number
    visitantes: number
    pedidos: number
    ventas: number
    visitasAntes: number
    pedidosAntes: number
    ventasAntes: number
  }
  avanzadas: {
    masVistos: { slug: string; nombre: string; foto: string | null; vistas: number }[]
    masVendidos: { nombre: string; unidades: number; ventas: number }[]
    clicsWhatsapp: number
    conversion: number
  } | null
}

export const obtenerMetricas = (dias: number) => pedir<Metricas>(`/metricas?dias=${dias}`)

export interface Avisos {
  pedidosNuevos: number
  ultimos: { id: string; numero: number; clienteNombre: string; total: string; creadoEn: string }[]
  agotados: number
  stockBajo: { id: string; nombre: string; stock: number }[]
  cuponesPorVencer: { id: string; codigo: string; venceEn: string }[]
  mensajesNuevos?: number
  citasPorConfirmar?: number
  resenasPendientes?: number
  carritosAbandonados?: number
}

export const obtenerAvisos = () => pedir<Avisos>('/avisos')

// ── Equipo ──

export type RolPanel = 'PROPIETARIO' | 'ADMINISTRADOR' | 'EDITOR'

export interface Miembro {
  id: string
  nombre: string
  email: string
  rol: RolPanel
  activo: boolean
  ultimoAccesoEn: string | null
  creadoEn: string
}

export const listarEquipo = () => pedir<{ usuarios: Miembro[] }>('/equipo').then((respuesta) => respuesta.usuarios)

export const agregarMiembro = (datos: { nombre: string; email: string; rol: 'ADMINISTRADOR' | 'EDITOR'; contrasena: string }) =>
  pedir<{ usuario: Miembro }>('/equipo', { method: 'POST', body: JSON.stringify(datos) }).then((respuesta) => respuesta.usuario)

export const cambiarMiembro = (id: string, cambios: { rol?: 'ADMINISTRADOR' | 'EDITOR'; activo?: boolean }) =>
  pedir<{ usuario: Miembro }>(`/equipo/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }).then((respuesta) => respuesta.usuario)

export const quitarMiembro = (id: string) => pedir<void>(`/equipo/${id}`, { method: 'DELETE' })

// ── Dominio propio ──

export interface DominioPropio {
  id: string
  dominio: string
  verificado: boolean
  esPrincipal: boolean
  creadoEn: string
}

export const listarDominios = () =>
  pedir<{ dominios: DominioPropio[]; instrucciones: { cname: string; ip: string | null } }>('/dominios')

export const agregarDominio = (dominio: string) =>
  pedir<{ dominio: DominioPropio }>('/dominios', { method: 'POST', body: JSON.stringify({ dominio }) }).then((respuesta) => respuesta.dominio)

export const verificarDominio = (id: string) =>
  pedir<{ dominio: DominioPropio }>(`/dominios/${id}/verificar`, { method: 'POST' }).then((respuesta) => respuesta.dominio)

export const quitarDominio = (id: string) => pedir<void>(`/dominios/${id}`, { method: 'DELETE' })

// ── Agenda ──

export const listarCitas = (desde?: string, hasta?: string) => {
  const parametros = new URLSearchParams({ ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) })
  return pedir<AgendaPanel>(`/citas${parametros.size ? `?${parametros}` : ''}`)
}

export const crearCita = (datos: DatosCitaPanel) =>
  pedir<{ cita: Cita }>('/citas', { method: 'POST', body: JSON.stringify(datos) }).then((respuesta) => respuesta.cita)

export const actualizarCita = (id: string, cambios: { estado?: EstadoCita; notaInterna?: string | null }) =>
  pedir<{ cita: Cita }>(`/citas/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }).then((respuesta) => respuesta.cita)

// ── Mensajes del formulario de contacto ──

export interface MensajeContacto {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  motivo: string | null
  mensaje: string
  pagina: string | null
  leido: boolean
  archivado: boolean
  creadoEn: string
}

export const listarMensajes = () => pedir<{ mensajes: MensajeContacto[] }>('/mensajes').then((respuesta) => respuesta.mensajes)

export const actualizarMensaje = (id: string, cambios: { leido?: boolean; archivado?: boolean }) =>
  pedir<{ mensaje: MensajeContacto }>(`/mensajes/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }).then((respuesta) => respuesta.mensaje)

export const eliminarMensaje = (id: string) => pedir<void>(`/mensajes/${id}`, { method: 'DELETE' })

export const marcarMensajesLeidos = () => pedir<void>('/mensajes/leidos', { method: 'POST' })

// ── Opiniones de productos ──

export type EstadoResena = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface ResenaPanel {
  id: string
  nombre: string
  email: string
  ciudad: string | null
  estrellas: number
  texto: string
  verificada: boolean
  respuesta: string | null
  estado: EstadoResena
  creadoEn: string
  producto: { id: string; nombre: string; slug: string; foto: string | null }
}

export const listarResenas = () => pedir<{ resenas: ResenaPanel[] }>('/resenas').then((respuesta) => respuesta.resenas)

export const moderarResena = (id: string, cambios: { estado?: EstadoResena; respuesta?: string | null }) =>
  pedir<{ resena: ResenaPanel }>(`/resenas/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }).then((respuesta) => respuesta.resena)

export const eliminarResena = (id: string) => pedir<void>(`/resenas/${id}`, { method: 'DELETE' })

// ── Clientes y carritos abandonados ──

export interface ClientePanel {
  clave: string
  nombre: string
  email: string | null
  telefono: string | null
  ciudad: string | null
  pedidos: number
  citas: number
  gastado: number
  primeraVez: string
  ultimaVez: string
  historial: { tipo: 'pedido' | 'cita'; id: string; titulo: string; estado: string; total: string | null; fecha: string }[]
}

export interface CarritoPanel {
  id: string
  nombre: string | null
  email: string | null
  telefono: string | null
  items: { productoId: string; nombre: string; variante: string | null; cantidad: number; precio: number; foto: string | null; slug: string }[]
  subtotal: string
  estado: 'ABIERTO' | 'RECUPERADO' | 'DESCARTADO'
  contactadoEn: string | null
  recordatorioEnviado: boolean
  actualizadoEn: string
}

export const listarClientes = () => pedir<{ clientes: ClientePanel[] }>('/clientes').then((respuesta) => respuesta.clientes)

export const listarCarritos = () => pedir<{ carritos: CarritoPanel[] }>('/carritos').then((respuesta) => respuesta.carritos)

export const actualizarCarrito = (id: string, cambios: { estado?: CarritoPanel['estado']; contactado?: boolean }) =>
  pedir<void>(`/carritos/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) })

// ── Cupones ──

export const listarCupones = () => pedir<{ cupones: Cupon[] }>('/cupones').then((respuesta) => respuesta.cupones)

export const guardarCupon = (datos: DatosCupon, id?: string) =>
  pedir<{ cupon: Cupon }>(id ? `/cupones/${id}` : '/cupones', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(datos),
  }).then((respuesta) => respuesta.cupon)

export const eliminarCupon = (id: string) => pedir<void>(`/cupones/${id}`, { method: 'DELETE' })

// ── Catálogo en grupo ──

export type AccionLote = 'mostrar' | 'ocultar' | 'destacar' | 'quitar-destacado' | 'categoria' | 'eliminar'

export const loteProductos = (ids: string[], accion: AccionLote, categoria?: string | null) =>
  pedir<{ afectados: number }>('/productos/lote', { method: 'POST', body: JSON.stringify({ ids, accion, categoria }) })

export interface FilaImportada {
  nombre: string
  precio: number
  precioComparacion?: number | null
  stock?: number
  categoria?: string | null
  presentacion?: string | null
  descripcion?: string | null
  fotos?: string[]
}

export const importarProductos = (productos: FilaImportada[]) =>
  pedir<{ creados: number }>('/productos/importar', { method: 'POST', body: JSON.stringify({ productos }) })

export const renombrarCategoria = (de: string, a: string | null) =>
  pedir<{ afectados: number }>('/categorias', { method: 'PUT', body: JSON.stringify({ de, a }) })

// ── Medios ──

export const FORMATOS_IMAGEN = 'image/png,image/jpeg,image/webp,image/avif,image/gif'

/** Sube una imagen y devuelve su URL pública. */
export async function subirImagen(archivo: File): Promise<string> {
  if (archivo.size > 8 * 1024 * 1024) {
    throw new ErrorPanel(413, `${archivo.name} pesa más de 8 MB`)
  }
  const { url } = await pedir<{ url: string }>('/medios', {
    method: 'POST',
    headers: { 'content-type': archivo.type },
    body: archivo,
  })
  return url
}

// ── Suscripción (Bold) ──

export type PlanPago = 'EMPRENDE' | 'NEGOCIO' | 'PRO'
export type PeriodoPago = 'MENSUAL' | 'ANUAL'

export interface PagoSuscripcion {
  referencia: string
  plan: PlanPago
  periodo: PeriodoPago
  monto: number
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR'
  cubreHasta: string | null
  creadoEn: string
}

export interface Suscripcion extends EstadoSuscripcion {
  plan: string
  pagosHabilitados: boolean
  planes: {
    plan: 'GRATIS' | PlanPago
    nombre: string
    precio: number
    precioAnual: number
    resumen: string
    incluye: string[]
    destacado: boolean
  }[]
  pagos: PagoSuscripcion[]
}

export interface CheckoutBold {
  referencia: string
  monto: number
  moneda: string
  llave: string
  firma: string
  descripcion: string
  redireccion: string
  correo: string
}

export const obtenerSuscripcion = () => pedir<Suscripcion>('/suscripcion')

export const crearCheckout = (plan: PlanPago, periodo: PeriodoPago, cupon?: string) =>
  pedir<CheckoutBold>('/suscripcion/checkout', { method: 'POST', body: JSON.stringify({ plan, periodo, ...(cupon ? { cupon } : {}) }) })

export const verificarPago = (referencia: string) =>
  pedir<{ pago: PagoSuscripcion }>(`/suscripcion/pagos/${encodeURIComponent(referencia)}/verificar`, { method: 'POST' })

// ── Comunicados de la plataforma ──

export interface AnuncioPanel {
  id: string
  titulo: string
  cuerpo: string
  tipo: 'CAMPANA' | 'BARRA'
  desde: string
}
export interface NovedadPanel {
  id: string
  titulo: string
  cuerpo: string
  etiqueta: string | null
  publicadaEn: string
}
export interface Comunicados {
  barra: AnuncioPanel[]
  campana: AnuncioPanel[]
  novedades: NovedadPanel[]
  novedadesSinVer: number
}
export const obtenerComunicados = () => pedir<Comunicados>('/comunicados')
export const marcarNovedadesVistas = () => pedir<void>('/novedades/vistas', { method: 'POST' })

// ── Referidos y cupones de suscripción ──

export interface Referidos {
  activa: boolean
  dias: number
  codigo: string | null
  enlace: string
  invitadas: number
}
export const obtenerReferidos = () => pedir<Referidos>('/referidos')
export const probarCupon = (plan: PlanPago, periodo: PeriodoPago, cupon: string) =>
  pedir<{ montoOriginal: number; monto: number; cupon: { codigo: string; porcentaje: number } | null }>('/suscripcion/cupon', {
    method: 'POST',
    body: JSON.stringify({ plan, periodo, cupon }),
  })

// ── Pasarelas de pago de la tienda ──

export type ProveedorPago = 'WOMPI' | 'EPAYCO' | 'BOLD'
export interface PasarelaTienda {
  proveedor: ProveedorPago
  activa: boolean
  modoPrueba: boolean
  llavePublica: string
  secretosPuestos: Record<string, boolean>
  urlAviso: string
}
export const listarPasarelas = () => pedir<{ pasarelas: PasarelaTienda[] }>('/pasarelas').then((r) => r.pasarelas)
export const guardarPasarela = (
  proveedor: ProveedorPago,
  datos: { activa: boolean; modoPrueba: boolean; llavePublica: string; secretos: Record<string, string> },
) =>
  pedir<{ pasarelas: PasarelaTienda[] }>(`/pasarelas/${proveedor}`, { method: 'PUT', body: JSON.stringify(datos) }).then((r) => r.pasarelas)

// ── Avisos push (panel instalado como app) ──

export const llavePush = () => pedir<{ llave: string | null }>('/push/llave').then((respuesta) => respuesta.llave)

export const guardarSuscripcionPush = (suscripcion: PushSubscriptionJSON) =>
  pedir<void>('/push', { method: 'POST', body: JSON.stringify({ endpoint: suscripcion.endpoint, keys: suscripcion.keys }) })

export const borrarSuscripcionPush = (endpoint: string) =>
  pedir<void>('/push/baja', { method: 'POST', body: JSON.stringify({ endpoint }) })

// ── Factura electrónica (Alegra) ──

export interface FacturacionTienda {
  proveedor: 'alegra'
  activa: boolean
  automatica: boolean
  usuario: string
  tokenPuesto: boolean
}

export const obtenerFacturacion = () => pedir<{ facturacion: FacturacionTienda }>('/facturacion').then((r) => r.facturacion)

export const guardarFacturacion = (datos: { activa: boolean; automatica: boolean; usuario: string; token?: string }) =>
  pedir<{ facturacion: FacturacionTienda }>('/facturacion', { method: 'PUT', body: JSON.stringify(datos) }).then((r) => r.facturacion)

export const facturarPedido = (id: string) =>
  pedir<{ facturaEstado: 'PENDIENTE' }>(`/pedidos/${id}/factura`, { method: 'POST' }).then((r) => r.facturaEstado)
