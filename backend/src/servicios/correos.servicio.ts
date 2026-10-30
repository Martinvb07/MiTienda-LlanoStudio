import nodemailer, { type Transporter } from 'nodemailer'
import { entorno } from '../config/entorno.js'
import { prisma } from '../config/prisma.js'
import { PLANES } from '../utilidades/planes.js'
import { registro } from '../utilidades/registro.js'
import { leerAjuste } from './plataforma.servicio.js'
import { urlPanel } from './suscripciones.servicio.js'

/**
 * Correos automáticos a las dueñas de tienda. Cada envío queda en
 * correos_enviados con una clave, para no mandar dos veces lo mismo.
 */

export type TipoCorreo = 'bienvenida' | 'vencePronto' | 'teExtranamos'

export const smtpConfigurado = () => Boolean(entorno.SMTP_HOST && entorno.SMTP_USUARIO)

let transporte: Transporter | null = null
function transportador() {
  transporte ??= nodemailer.createTransport({
    host: entorno.SMTP_HOST,
    port: entorno.SMTP_PUERTO,
    secure: entorno.SMTP_PUERTO === 465,
    auth: { user: entorno.SMTP_USUARIO, pass: entorno.SMTP_CLAVE },
  })
  return transporte
}

const escapar = (texto: string) =>
  texto.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/**
 * Plantilla común: sobria, blanco y negro como la web. `marca` es lo que va
 * arriba: Mi Sitio para las dueñas, el nombre de la tienda para sus clientes.
 */
export function plantillaCorreo(titulo: string, parrafos: string[], boton?: { texto: string; url: string }, marca = 'Mi Sitio') {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f3;font-family:Helvetica,Arial,sans-serif;color:#0b0b0c">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e6e6e3;border-radius:14px">
<tr><td style="padding:36px 32px">
<p style="margin:0 0 24px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8a8e">${escapar(marca)}</p>
<h1 style="margin:0 0 16px;font-size:26px;font-weight:400;letter-spacing:-.03em">${escapar(titulo)}</h1>
${parrafos.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4f4f52">${escapar(p)}</p>`).join('')}
${boton ? `<a href="${boton.url}" style="display:inline-block;margin-top:12px;background:#0b0b0c;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.09em;text-transform:uppercase;padding:14px 22px;border-radius:3px">${escapar(boton.texto)}</a>` : ''}
</td></tr></table>
<p style="margin:20px 0 0;font-size:12px;color:#8a8a8e">${marca === 'Mi Sitio' ? 'Llano Studio · Hecho en Colombia' : `Tienda creada con Mi Sitio`}</p>
</td></tr></table></body></html>`
}

export async function enviarCorreoDirecto(para: string, asunto: string, html: string) {
  if (!smtpConfigurado()) return false
  await transportador().sendMail({ from: entorno.CORREO_REMITENTE, to: para, subject: asunto, html })
  return true
}

/**
 * Envía un correo automático a la dueña de la tienda si está activado en el
 * admin y no se mandó antes con la misma clave.
 */
export async function enviarCorreo(tipo: TipoCorreo, tenantId: string, clave = 'unico') {
  if (!smtpConfigurado()) return false
  const ajustes = await leerAjuste('correos')
  if (!ajustes[tipo]) return false

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      nombre: true,
      plan: true,
      planVenceEn: true,
      usuarios: { where: { rol: 'PROPIETARIO' }, take: 1, select: { nombre: true, email: true } },
    },
  })
  const duena = tenant?.usuarios[0]
  if (!tenant || !duena) return false

  // Se reserva primero: si dos procesos coinciden, sólo uno lo envía.
  try {
    await prisma.correoEnviado.create({ data: { tenantId, tipo, clave } })
  } catch {
    return false
  }

  const nombre = duena.nombre.split(' ')[0]!
  const panel = urlPanel()
  const plan = PLANES[tenant.plan as keyof typeof PLANES]?.nombre ?? tenant.plan
  const contenido = {
    bienvenida: {
      asunto: `Bienvenido a Mi Sitio, ${nombre}`,
      html: plantillaCorreo(
        `Tu tienda ${tenant.nombre} ya existe`,
        [
          `Hola ${nombre}, gracias por crear tu tienda con nosotros.`,
          'Lo siguiente: sube tu logo, agrega tus primeros productos y publícala. Toma menos de lo que crees.',
        ],
        { texto: 'Abrir mi panel', url: `${panel}/panel` },
      ),
    },
    vencePronto: {
      asunto: `Tu plan ${plan} vence pronto`,
      html: plantillaCorreo(
        `Tu plan ${plan} vence pronto`,
        [
          `Hola ${nombre}, el plan de ${tenant.nombre} vence el ${tenant.planVenceEn?.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) ?? 'pronto'}.`,
          'Si no lo renuevas, tienes 5 días más y luego tu tienda pasa al plan Gratis, sin borrar nada.',
        ],
        { texto: 'Renovar mi plan', url: `${panel}/panel/plan` },
      ),
    },
    teExtranamos: {
      asunto: `${nombre}, tu tienda te está esperando`,
      html: plantillaCorreo(
        'Hace rato no pasas por tu tienda',
        [
          `Hola ${nombre}, ${tenant.nombre} sigue ahí.`,
          'Una foto nueva o un producto más puede ser lo que alguien estaba buscando. ¿Le damos una vuelta?',
        ],
        { texto: 'Volver a mi panel', url: `${panel}/panel` },
      ),
    },
  }[tipo]

  try {
    await enviarCorreoDirecto(duena.email, contenido.asunto, contenido.html)
    return true
  } catch (error) {
    registro.warn({ err: error, tipo, tenantId }, 'No se pudo enviar el correo')
    await prisma.correoEnviado.deleteMany({ where: { tenantId, tipo, clave } })
    return false
  }
}

/** Revisión periódica: planes que vencen en 3 días y dueñas que no entran hace 21. */
export async function revisarCorreosProgramados() {
  if (!smtpConfigurado()) return
  const ahora = Date.now()
  const porVencer = await prisma.tenant.findMany({
    where: { planVenceEn: { gt: new Date(ahora), lt: new Date(ahora + 3 * 86_400_000) }, plan: { not: 'GRATIS' } },
    select: { id: true, planVenceEn: true },
  })
  for (const tenant of porVencer) {
    await enviarCorreo('vencePronto', tenant.id, tenant.planVenceEn!.toISOString().slice(0, 10))
  }

  const ausentes = await prisma.usuario.findMany({
    where: { rol: 'PROPIETARIO', activo: true, ultimoAccesoEn: { lt: new Date(ahora - 21 * 86_400_000) } },
    select: { tenantId: true },
    take: 200,
  })
  // Una vez por trimestre como mucho.
  const trimestre = `${new Date().getFullYear()}-T${Math.floor(new Date().getMonth() / 3) + 1}`
  for (const usuario of ausentes) await enviarCorreo('teExtranamos', usuario.tenantId, trimestre)
}
