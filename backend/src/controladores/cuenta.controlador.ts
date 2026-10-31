import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { entorno } from '../config/entorno.js'
import type { SesionPanel } from '../middlewares/autenticacion.js'
import { cifrarContrasena, verificarContrasena } from '../utilidades/contrasenas.js'
import { esSubdominioValido } from '../utilidades/dominios.js'
import { ErrorHttp, noAutorizado, solicitudInvalida } from '../utilidades/errores.js'
import { aplicarVencimientos, estadoSuscripcion } from '../servicios/suscripciones.servicio.js'
import { tokenSiEsAdmin } from '../servicios/admins.servicio.js'
import { cambiarPlan, leerAjuste } from '../servicios/plataforma.servicio.js'
import { enviarCorreo } from '../servicios/correos.servicio.js'
import type { esquemaContrasena, esquemaCuenta, esquemaIngreso, esquemaRegistro } from './panel.esquemas.js'

/** Cuenta del panel: registro, ingreso, sesión y contraseña. */

export function firmarSesion(sesion: SesionPanel, duracion: jwt.SignOptions['expiresIn'] = '7d'): string {
  return jwt.sign(sesion, entorno.JWT_SECRETO, { expiresIn: duracion })
}

/**
 * Lo que trae un sitio recién creado. La página informativa arranca con
 * portada, servicios y contacto; los enlaces para la bio, con el perfil y
 * tres botones. Todo dentro del plan Gratis; el panel le ofrece después las
 * plantillas de su tipo.
 */
export function bloquesIniciales(nombreTienda: string, tipo: 'tienda' | 'pagina' | 'enlaces' = 'tienda') {
  if (tipo === 'enlaces') {
    return [
      {
        id: 'perfil-inicial',
        tipo: 'perfil',
        props: { bio: 'Cuenta en una línea quién eres y qué haces.', forma: 'circulo', mostrarRedes: true },
      },
      {
        id: 'enlaces-inicial',
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            { id: 'l1', texto: 'Escríbeme por WhatsApp', url: '', icono: 'whatsapp', destacado: true },
            { id: 'l2', texto: 'Mi Instagram', url: '', icono: 'instagram' },
            { id: 'l3', texto: 'Mi sitio web', url: '', icono: 'web' },
          ],
        },
      },
    ]
  }
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
        subtitulo: 'Descubre lo nuevo y compra en línea, fácil y seguro.',
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
