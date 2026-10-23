import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { entorno } from '../config/entorno.js'
import type { SesionPanel } from '../middlewares/autenticacion.js'
import { guardarImagen } from '../almacenamiento/index.js'
import { cifrarContrasena, verificarContrasena } from '../utilidades/contrasenas.js'
import { esSubdominioValido } from '../utilidades/dominios.js'
import { ErrorHttp, noAutorizado, noEncontrado, solicitudInvalida } from '../utilidades/errores.js'
import { ETIQUETAS_BLOQUE_PLAN, TEMAS_PREDEFINIDOS, fueraDelPlan, limitesDe } from '../utilidades/planes.js'
import { aplicarVencimientos, estadoSuscripcion } from '../servicios/suscripciones.servicio.js'
import { tokenSiEsAdmin } from '../servicios/admins.servicio.js'
import { cambiarPlan, leerAjuste } from '../servicios/plataforma.servicio.js'
import { enviarCorreo } from '../servicios/correos.servicio.js'

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas
// ─────────────────────────────────────────────────────────────────────────────

const correo = z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160)

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80),
  email: correo,
  contrasena: z.string().min(8, 'Tiene que tener al menos 8 caracteres').max(200),
  tienda: z.string().trim().min(1, 'Escribe el nombre de tu tienda').max(80),
  subdominio: z.string().trim().toLowerCase(),
  /** Código de la tienda que lo invitó (?ref=). */
  ref: z.string().trim().toUpperCase().max(20).optional(),
  /** De dónde llegó (utm_source u otro), para el embudo del admin. */
  origen: z.string().trim().toLowerCase().max(60).optional(),
  /** Qué arma: tienda (por defecto) o página informativa. Enlaces todavía no. */
  tipo: z.enum(['tienda', 'pagina']).default('tienda'),
})

export const esquemaIngreso = z.object({
  email: correo,
  contrasena: z.string().min(1, 'Escribe tu contraseña').max(200),
})

export const esquemaCuenta = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80),
  email: correo,
})

export const esquemaContrasena = z.object({
  actual: z.string().min(1, 'Escribe tu contraseña actual').max(200),
  nueva: z.string().min(8, 'Tiene que tener al menos 8 caracteres').max(200),
})

const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido')

const esquemaTema = z.object({
  colorMarca: colorHex.optional(),
  colorContraste: colorHex.optional(),
  colorFondo: colorHex.optional(),
  colorTexto: colorHex.optional(),
  fuenteTitulos: z.string().max(40).optional(),
  radio: z.string().max(12).optional(),
  // Configuración del tema
  fuenteCuerpo: z.string().max(40).optional(),
  pesoTitulos: z.enum(['normal', 'medio', 'negrita']).optional(),
  titulosMayusculas: z.boolean().optional(),
  anchoPagina: z.enum(['normal', 'amplio', 'completo']).optional(),
  botonForma: z.enum(['recto', 'suave', 'pildora']).optional(),
  botonEstilo: z.enum(['relleno', 'contorno']).optional(),
  botonMayusculas: z.boolean().optional(),
  tarjetaProporcion: z.enum(['cuadrada', 'vertical', 'horizontal']).optional(),
  tarjetaAlineacion: z.enum(['izquierda', 'centro']).optional(),
  tarjetaSegundaFoto: z.boolean().optional(),
  /** Color del precio en las tarjetas de producto (el rojo de un supermercado). */
  colorPrecio: colorHex.optional(),
  animarSecciones: z.boolean().optional(),
  alAgregar: z.enum(['carrito', 'aviso', 'volar']).optional(),
  agregarRapido: z.boolean().optional(),
  esquemas: z
    .array(
      z.object({
        id: z.string().min(1).max(20),
        nombre: z.string().trim().max(30),
        fondo: colorHex,
        texto: colorHex,
        marca: colorHex,
        contraste: colorHex,
      }),
    )
    .max(8)
    .optional(),
})

/**
 * El diseño es JSON libre para el resto del sistema; aquí sólo se exige la
 * forma mínima y un tope de tamaño. La tienda pública vuelve a normalizarlo
 * antes de pintar (frontend/src/tipos/bloques.ts).
 */
const esquemaBloque = z.object({
  id: z.string().min(1).max(64),
  tipo: z.string().min(1).max(40),
  props: z.record(z.string(), z.unknown()),
  visible: z.boolean().optional(),
  // La apariencia de la sección: se recorta al plan al pintar, no al guardar,
  // para que bajar de plan no borre lo configurado.
  estilo: z.record(z.string(), z.unknown()).optional(),
})

const urlMedio = z.string().max(600)

const enlace = z.object({ texto: z.string().trim().max(40), enlace: z.string().trim().max(300) })

/** Cabecera, contacto y redes de la tienda. Todo opcional. */
const esquemaAjustes = z.object({
  cabecera: z.enum(['simple', 'completa']).optional(),
  buscador: z.boolean().optional(),
  colorBarra: colorHex.optional(),
  menu: z.array(enlace).max(8).optional(),
  botonDestacado: enlace.optional(),
  whatsapp: z.string().trim().max(20).optional(),
  whatsappFlotante: z.boolean().optional(),
  direccion: z.string().trim().max(160).optional(),
  correo: z.string().trim().max(120).optional(),
  horario: z.string().trim().max(120).optional(),
  instagram: z.string().trim().max(60).optional(),
  facebook: z.string().trim().max(120).optional(),
  tiktok: z.string().trim().max(60).optional(),
  // Ventas y envíos
  costoEnvio: z.coerce.number().min(0).max(10_000_000).optional(),
  envioGratisDesde: z.coerce.number().min(0).max(1_000_000_000).optional(),
  pedidoMinimo: z.coerce.number().min(0).max(1_000_000_000).optional(),
  pagoContraEntrega: z.boolean().optional(),
  pagoTransferencia: z.boolean().optional(),
  datosTransferencia: z.string().trim().max(400).optional(),
  pedidosWhatsapp: z.boolean().optional(),
  // Cabecera
  cabeceraFija: z.boolean().optional(),
  logoCentrado: z.boolean().optional(),
  tamanoLogo: z.enum(['chico', 'medio', 'grande']).optional(),
  // Plantilla de la página de producto
  paginaProducto: z
    .object({
      orden: z.array(z.object({ id: z.string().max(30), visible: z.boolean() })).max(20).optional(),
      galeria: z.enum(['miniaturas', 'cuadricula', 'apiladas']).optional(),
      fijarInfo: z.boolean().optional(),
      textoEnvio: z.string().trim().max(200).optional(),
      acordeones: z
        .array(z.object({ id: z.string().max(20), titulo: z.string().trim().max(60), texto: z.string().trim().max(1000) }))
        .max(8)
        .optional(),
      relacionados: z.boolean().optional(),
      tituloRelacionados: z.string().trim().max(60).optional(),
      beneficios: z
        .array(
          z.object({
            id: z.string().max(20),
            icono: z.enum(['envio', 'garantia', 'pago', 'cambios', 'soporte', 'calidad']),
            texto: z.string().trim().max(80),
          }),
        )
        .max(6)
        .optional(),
      zoomFoto: z.boolean().optional(),
      animarEntrada: z.boolean().optional(),
      barraFija: z.boolean().optional(),
    })
    .optional(),
})

export const esquemaTienda = z.object({
  nombre: z.string().trim().min(1, 'La tienda necesita un nombre').max(80),
  descripcion: z.string().trim().max(300).nullable(),
  logoUrl: urlMedio.nullable(),
  plantilla: z.string().max(40),
  tema: esquemaTema,
  configuracionBloques: z.array(esquemaBloque).max(60),
  ajustes: esquemaAjustes.default({}),
  publicada: z.boolean(),
})

const precio = z.coerce.number().min(0, 'El precio no puede ser negativo').max(9_999_999_999)

export const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, 'El producto necesita un nombre').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Usa sólo letras, números y guiones')
    .max(80),
  descripcion: z.string().trim().max(4000).nullable(),
  precio,
  precioComparacion: precio.nullable(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  fotos: z.array(urlMedio).max(10),
  categoria: z.string().trim().max(60).nullable().optional(),
  presentacion: z.string().trim().max(60).nullable().optional(),
  activo: z.boolean(),
  // Opcionales a propósito: quien no los manda (ocultar, duplicar) no los borra.
  destacado: z.boolean().optional(),
  opciones: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(30),
        valores: z.array(z.string().trim().min(1).max(30)).min(1).max(20),
      }),
    )
    .max(3)
    .optional(),
  variantes: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        nombre: z.string().trim().min(1).max(100),
        valores: z.record(z.string(), z.string()),
        precio: precio.nullable().optional(),
        stock: z.coerce.number().int().min(0).max(1_000_000),
      }),
    )
    .max(150)
    .optional(),
})

/** Con variantes, el stock del producto es la suma de las suyas. */
function conStockDeVariantes<T extends { stock: number; variantes?: { stock: number }[] }>(datos: T): T {
  if (!datos.variantes || datos.variantes.length === 0) return datos
  return { ...datos, stock: datos.variantes.reduce((suma, variante) => suma + variante.stock, 0) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sesión
// ─────────────────────────────────────────────────────────────────────────────

export function firmarSesion(sesion: SesionPanel, duracion: jwt.SignOptions['expiresIn'] = '7d'): string {
  return jwt.sign(sesion, entorno.JWT_SECRETO, { expiresIn: duracion })
}

/**
 * Lo que trae un sitio recién creado. La página informativa arranca con
 * portada, servicios y contacto, todo dentro del plan Gratis; el panel le
 * ofrece después las plantillas por tipo de negocio.
 */
export function bloquesIniciales(nombreTienda: string, tipo: 'tienda' | 'pagina' = 'tienda') {
  if (tipo === 'pagina') {
    return [
      {
        id: 'hero-inicial',
        tipo: 'hero',
        props: {
          titulo: nombreTienda,
          subtitulo: 'Cuenta en una línea qué haces y para quién.',
          textoBoton: 'Contáctanos',
          enlaceBoton: '#contacto',
          alineacion: 'izquierda',
        },
      },
      {
        id: 'servicios-inicial',
        tipo: 'servicios',
        props: {
          titulo: 'Servicios',
          textoBoton: 'Agendar',
          items: [
            { id: 's1', nombre: 'Tu primer servicio', descripcion: 'Qué incluye, en una frase.', precio: 'Desde $50.000', duracion: '30 min' },
            { id: 's2', nombre: 'Tu segundo servicio', descripcion: 'Qué incluye, en una frase.', precio: 'Desde $80.000', duracion: '1 hora' },
          ],
        },
      },
      {
        id: 'horario-inicial',
        tipo: 'horario',
        props: {
          titulo: 'Horario y contacto',
          dias: [
            { id: 'd1', dia: 'Lunes a viernes', horas: '8:00 a. m. a 6:00 p. m.' },
            { id: 'd2', dia: 'Sábados', horas: '9:00 a. m. a 1:00 p. m.' },
          ],
        },
      },
      {
        id: 'pie-inicial',
        tipo: 'pie',
        props: { texto: `© ${new Date().getFullYear()} ${nombreTienda}`, mostrarRedes: true },
      },
    ]
  }
  return [
    {
      id: 'hero-inicial',
      tipo: 'hero',
      props: {
        titulo: nombreTienda,
        subtitulo: 'Bienvenido a nuestra tienda',
        textoBoton: 'Ver productos',
        enlaceBoton: '#productos',
      },
    },
    {
      id: 'productos-inicial',
      tipo: 'grilla-productos',
      props: { titulo: 'Nuestros productos', limite: 8, columnas: 3 },
    },
    {
      id: 'pie-inicial',
      tipo: 'pie',
      props: { texto: `© ${new Date().getFullYear()} ${nombreTienda}`, mostrarRedes: true },
    },
  ]
}

/** Crea cuenta, tenant y tienda en una sola transacción y abre sesión. */
export async function registrar(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaRegistro>

  const mantenimiento = await leerAjuste('mantenimiento')
  if (mantenimiento.registrosCerrados) throw new ErrorHttp(503, mantenimiento.mensaje, 'REGISTROS_CERRADOS')

  const bloqueado = await prisma.subdominioBloqueado.findUnique({ where: { subdominio: datos.subdominio } })
  if (!esSubdominioValido(datos.subdominio) || bloqueado) {
    throw solicitudInvalida('Esa dirección no está disponible', [
      { campo: 'subdominio', mensaje: 'Esa dirección no está disponible. Prueba con otra.' },
    ])
  }

  const [correoUsado, subdominioUsado] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: datos.email }, select: { id: true } }),
    prisma.tenant.findUnique({ where: { subdominio: datos.subdominio }, select: { id: true } }),
  ])
  if (correoUsado) {
    throw new ErrorHttp(409, 'Ya existe una cuenta con ese correo', 'CORREO_EN_USO', [
      { campo: 'email', mensaje: 'Ya existe una cuenta con ese correo' },
    ])
  }
  if (subdominioUsado) {
    throw new ErrorHttp(409, 'Esa dirección ya la tiene otra tienda', 'SUBDOMINIO_EN_USO', [
      { campo: 'subdominio', mensaje: 'Esa dirección ya la tiene otra tienda' },
    ])
  }

  const contrasenaHash = await cifrarContrasena(datos.contrasena)
  const [prueba, padrino] = await Promise.all([
    leerAjuste('prueba'),
    datos.ref ? prisma.tenant.findUnique({ where: { codigoReferido: datos.ref }, select: { id: true } }) : null,
  ])

  const tenant = await prisma.tenant.create({
    data: {
      nombre: datos.tienda,
      subdominio: datos.subdominio,
      origen: padrino ? 'referido' : (datos.origen ?? null),
      referidoPorId: padrino?.id ?? null,
      usuarios: { create: { email: datos.email, nombre: datos.nombre, contrasenaHash } },
      tienda: {
        create: {
          nombre: datos.tienda,
          tipo: datos.tipo,
          configuracionBloques: bloquesIniciales(datos.tienda, datos.tipo),
        },
      },
    },
    select: { id: true, usuarios: { select: { id: true, rol: true } } },
  })

  // Prueba gratis de un plan pago, si el admin la tiene activa.
  if (prueba.activa && prueba.dias > 0) {
    await prisma.$transaction((tx) =>
      cambiarPlan(tx, tenant.id, {
        plan: prueba.plan,
        venceEn: new Date(Date.now() + prueba.dias * 86_400_000),
        motivo: 'PRUEBA',
        detalle: `${prueba.dias} días`,
      }),
    )
  }
  void enviarCorreo('bienvenida', tenant.id).catch(() => undefined)

  const usuario = tenant.usuarios[0]!
  const token = firmarSesion({
    usuarioId: usuario.id,
    tenantId: tenant.id,
    email: datos.email,
    rol: usuario.rol,
  })

  res.status(201).json({ token })
}

export async function ingresar(req: Request, res: Response): Promise<void> {
  const { email, contrasena } = req.body as z.infer<typeof esquemaIngreso>

  // Con los datos del admin de la plataforma, el mismo login abre el admin.
  const tokenAdmin = await tokenSiEsAdmin(email, contrasena)
  if (tokenAdmin) {
    res.json({ token: tokenAdmin, admin: true })
    return
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, tenantId: true, rol: true, activo: true, contrasenaHash: true, tenant: { select: { activo: true } } },
  })

  // Mismo mensaje para correo inexistente y contraseña errada: no confirma
  // qué correos tienen cuenta.
  const valida = usuario ? await verificarContrasena(contrasena, usuario.contrasenaHash) : false
  if (!usuario || !valida) throw noAutorizado('Correo o contraseña incorrectos')
  if (!usuario.activo || !usuario.tenant.activo) throw noAutorizado('Esta cuenta está desactivada')

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAccesoEn: new Date() } })

  res.json({
    token: firmarSesion({ usuarioId: usuario.id, tenantId: usuario.tenantId, email, rol: usuario.rol }),
  })
}

/** Quién es y qué tienda administra: lo primero que pide el panel al cargar. */
export async function obtenerSesion(req: Request, res: Response): Promise<void> {
  const { usuarioId, tenantId } = req.sesion!
  await aplicarVencimientos(tenantId)

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId, activo: true },
    select: {
      nombre: true,
      email: true,
      rol: true,
      tenant: { select: { subdominio: true, plan: true, planVenceEn: true, tienda: { select: { nombre: true, logoUrl: true, publicada: true, tipo: true } } } },
    },
  })
  if (!usuario) throw noAutorizado('La sesión ya no es válida')

  res.json({
    usuario: { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    tenant: {
      subdominio: usuario.tenant.subdominio,
      plan: usuario.tenant.plan,
      suscripcion: estadoSuscripcion(usuario.tenant.planVenceEn),
    },
    tienda: usuario.tenant.tienda,
  })
}

/**
 * Cambia el nombre y el correo de quien tiene la sesión. El correo va dentro
 * del token, así que se devuelve uno nuevo.
 */
export async function actualizarCuenta(req: Request, res: Response): Promise<void> {
  const sesion = req.sesion!
  const datos = req.body as z.infer<typeof esquemaCuenta>

  const otro = await prisma.usuario.findUnique({ where: { email: datos.email }, select: { id: true } })
  if (otro && otro.id !== sesion.usuarioId) {
    throw new ErrorHttp(409, 'Ya existe una cuenta con ese correo', 'CORREO_EN_USO', [
      { campo: 'email', mensaje: 'Ya existe una cuenta con ese correo' },
    ])
  }

  const { count } = await prisma.usuario.updateMany({
    where: { id: sesion.usuarioId, tenantId: sesion.tenantId, activo: true },
    data: { nombre: datos.nombre, email: datos.email },
  })
  if (count === 0) throw noAutorizado('La sesión ya no es válida')

  res.json({ token: firmarSesion({ ...sesion, email: datos.email }) })
}

/** Cambia la contraseña pidiendo la actual: una sesión olvidada abierta no basta. */
export async function cambiarContrasena(req: Request, res: Response): Promise<void> {
  const { usuarioId, tenantId } = req.sesion!
  const { actual, nueva } = req.body as z.infer<typeof esquemaContrasena>

  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId, activo: true },
    select: { contrasenaHash: true },
  })
  if (!usuario) throw noAutorizado('La sesión ya no es válida')
  if (!(await verificarContrasena(actual, usuario.contrasenaHash))) {
    throw solicitudInvalida('La contraseña actual no coincide', [
      { campo: 'actual', mensaje: 'La contraseña actual no coincide' },
    ])
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { contrasenaHash: await cifrarContrasena(nueva) } })
  res.status(204).end()
}

// ─────────────────────────────────────────────────────────────────────────────
// Tienda
// ─────────────────────────────────────────────────────────────────────────────

const camposTienda = {
  id: true,
  tipo: true,
  nombre: true,
  descripcion: true,
  logoUrl: true,
  faviconUrl: true,
  plantilla: true,
  tema: true,
  configuracionBloques: true,
  ajustes: true,
  moneda: true,
  publicada: true,
} as const

/** La tienda de la sesión. Siempre por tenantId del token, nunca por parámetro. */
async function tiendaDeLaSesion(req: Request) {
  const tienda = await prisma.tienda.findUnique({
    where: { tenantId: req.sesion!.tenantId },
    select: { id: true },
  })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene tienda')
  return tienda.id
}

export async function obtenerTiendaPanel(req: Request, res: Response): Promise<void> {
  const tienda = await prisma.tienda.findUnique({
    where: { tenantId: req.sesion!.tenantId },
    select: { ...camposTienda, tenant: { select: { subdominio: true } } },
  })
  if (!tienda) throw noEncontrado('Esta cuenta no tiene tienda')

  const { tenant, ...resto } = tienda
  res.json({ tienda: resto, subdominio: tenant.subdominio })
}

async function planDeLaSesion(req: Request) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.sesion!.tenantId },
    select: { plan: true },
  })
  return limitesDe(tenant?.plan ?? 'GRATIS')
}

export async function actualizarTiendaPanel(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaTienda>
  const plan = await planDeLaSesion(req)

  if (datos.configuracionBloques.length > plan.secciones) {
    throw fueraDelPlan(`Tu plan ${plan.nombre} admite hasta ${plan.secciones} secciones`)
  }
  const fuera = datos.configuracionBloques.find((bloque) => !plan.bloques.includes(bloque.tipo))
  if (fuera) {
    throw fueraDelPlan(
      `La sección "${ETIQUETAS_BLOQUE_PLAN[fuera.tipo] ?? fuera.tipo}" no está incluida en tu plan ${plan.nombre}`,
    )
  }

  // Sin tema libre, el tema es siempre el del estilo predefinido elegido: lo
  // que llegue en el cuerpo se ignora.
  const plantilla = plan.temaLibre || datos.plantilla in TEMAS_PREDEFINIDOS ? datos.plantilla : 'clasica'
  const tema = plan.temaLibre ? datos.tema : TEMAS_PREDEFINIDOS[plantilla]!

  // Quitar "Hecho con Mi Sitio" del pie es de los planes pagos.
  const bloques = plan.quitarMarca
    ? datos.configuracionBloques
    : datos.configuracionBloques.map((bloque) =>
        bloque.tipo === 'pie' ? { ...bloque, props: { ...bloque.props, ocultarMarca: false } } : bloque,
      )

  const tienda = await prisma.tienda.update({
    where: { tenantId: req.sesion!.tenantId },
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      logoUrl: datos.logoUrl || null,
      plantilla,
      tema,
      configuracionBloques: bloques as object[],
      ajustes: datos.ajustes,
      publicada: datos.publicada,
    },
    select: camposTienda,
  })

  res.json({ tienda })
}

// ─────────────────────────────────────────────────────────────────────────────
// Productos
// ─────────────────────────────────────────────────────────────────────────────

const camposProducto = {
  id: true,
  nombre: true,
  slug: true,
  descripcion: true,
  precio: true,
  precioComparacion: true,
  stock: true,
  fotos: true,
  categoria: true,
  presentacion: true,
  activo: true,
  destacado: true,
  opciones: true,
  variantes: true,
  actualizadoEn: true,
} as const

type ProductoBd = {
  precio: { toString(): string }
  precioComparacion: { toString(): string } | null
}

function serializar<T extends ProductoBd>(producto: T) {
  return {
    ...producto,
    precio: producto.precio.toString(),
    precioComparacion: producto.precioComparacion?.toString() ?? null,
  }
}

export async function listarProductosPanel(req: Request, res: Response): Promise<void> {
  const tiendaId = await tiendaDeLaSesion(req)
  const productos = await prisma.producto.findMany({
    where: { tiendaId },
    select: camposProducto,
    orderBy: [{ destacado: 'desc' }, { creadoEn: 'desc' }],
  })
  res.json({ productos: productos.map(serializar) })
}

async function slugLibre(tiendaId: string, slug: string, excepto?: string): Promise<void> {
  const existente = await prisma.producto.findFirst({
    where: { tiendaId, slug, ...(excepto ? { id: { not: excepto } } : {}) },
    select: { id: true },
  })
  if (existente) {
    throw new ErrorHttp(409, 'Ya tienes un producto con esa dirección', 'SLUG_EN_USO', [
      { campo: 'slug', mensaje: 'Ya tienes un producto con esa dirección' },
    ])
  }
}

function revisarVariantes(datos: z.infer<typeof esquemaProducto>, plan: ReturnType<typeof limitesDe>) {
  const usadas = datos.opciones?.length ?? 0
  if (usadas > plan.opcionesVariantes) {
    throw fueraDelPlan(
      plan.opcionesVariantes === 0
        ? `Las variantes (tallas, colores…) no están incluidas en tu plan ${plan.nombre}`
        : `Tu plan ${plan.nombre} admite ${plan.opcionesVariantes} ${plan.opcionesVariantes === 1 ? 'opción' : 'opciones'} de variante por producto`,
    )
  }
}

function revisarFotos(fotos: string[], plan: ReturnType<typeof limitesDe>) {
  if (fotos.length > plan.fotosPorProducto) {
    throw fueraDelPlan(`Tu plan ${plan.nombre} admite hasta ${plan.fotosPorProducto} fotos por producto`)
  }
}

export async function crearProductoPanel(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaProducto>
  const [tiendaId, plan] = await Promise.all([tiendaDeLaSesion(req), planDeLaSesion(req)])
  revisarFotos(datos.fotos, plan)
  revisarVariantes(datos, plan)
  if (plan.productos !== null) {
    const total = await prisma.producto.count({ where: { tiendaId } })
    if (total >= plan.productos) {
      throw fueraDelPlan(`Tu plan ${plan.nombre} admite hasta ${plan.productos} productos`)
    }
  }
  await slugLibre(tiendaId, datos.slug)

  const producto = await prisma.producto.create({
    data: {
      ...conStockDeVariantes(datos),
      categoria: datos.categoria || null,
      presentacion: datos.presentacion || null,
      tiendaId,
    },
    select: camposProducto,
  })
  res.status(201).json({ producto: serializar(producto) })
}

/** Busca el producto dentro de la tienda de la sesión: un id ajeno da 404. */
async function productoPropio(req: Request) {
  const tiendaId = await tiendaDeLaSesion(req)
  const id = req.params.id as string
  const producto = await prisma.producto.findFirst({ where: { id, tiendaId }, select: { id: true } })
  if (!producto) throw noEncontrado('Ese producto no existe')
  return { tiendaId, id }
}

export async function actualizarProductoPanel(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaProducto>
  const { tiendaId, id } = await productoPropio(req)
  const plan = await planDeLaSesion(req)
  revisarFotos(datos.fotos, plan)
  revisarVariantes(datos, plan)
  await slugLibre(tiendaId, datos.slug, id)

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      ...conStockDeVariantes(datos),
      categoria: datos.categoria || null,
      presentacion: datos.presentacion || null,
    },
    select: camposProducto,
  })
  res.json({ producto: serializar(producto) })
}

export async function eliminarProductoPanel(req: Request, res: Response): Promise<void> {
  const { id } = await productoPropio(req)
  await prisma.producto.delete({ where: { id } })
  res.status(204).end()
}

// ─────────────────────────────────────────────────────────────────────────────
// Medios
// ─────────────────────────────────────────────────────────────────────────────

/** Recibe la imagen como cuerpo binario (Content-Type: image/*) y devuelve su URL. */
export async function subirMedioPanel(req: Request, res: Response): Promise<void> {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw solicitudInvalida('No llegó ninguna imagen')
  }

  const tiendaId = await tiendaDeLaSesion(req)
  const tipo = (req.headers['content-type'] ?? '').split(';')[0]!.trim()
  const url = await guardarImagen(req.sesion!.tenantId, tiendaId, req.body, tipo)

  res.status(201).json({ url })
}
