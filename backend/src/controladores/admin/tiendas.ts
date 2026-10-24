import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { noEncontrado } from '../../utilidades/errores.js'
import { registrarActividad } from '../../servicios/admins.servicio.js'
import { cambiarPlan } from '../../servicios/plataforma.servicio.js'
import { estadoSuscripcion } from '../../servicios/suscripciones.servicio.js'
import { firmarSesion } from '../panel.controlador.js'

const DIA = 86_400_000

/** Qué le falta a una tienda para funcionar bien. */
function saludDe(datos: {
  publicada: boolean
  productos: number
  sinFoto: number
  pedidos30: number
  logo: boolean
  ultimoAcceso: Date | null
}) {
  const problemas: string[] = []
  if (!datos.publicada) problemas.push('Sin publicar')
  if (datos.productos === 0) problemas.push('Sin productos')
  else if (datos.sinFoto > 0) problemas.push(`${datos.sinFoto} sin foto`)
  if (!datos.logo) problemas.push('Sin logo')
  if (datos.publicada && datos.productos > 0 && datos.pedidos30 === 0) problemas.push('Sin pedidos en 30 días')
  if (!datos.ultimoAcceso || datos.ultimoAcceso.getTime() < Date.now() - 21 * DIA) problemas.push('No entra hace 3 semanas')
  const puntaje = Math.max(0, 100 - problemas.length * 18)
  return { puntaje, problemas }
}

/** Ficha completa de una tienda para soporte. */
export async function fichaTienda(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const hace30 = new Date(Date.now() - 30 * DIA)
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAccesoEn: true, creadoEn: true },
        orderBy: { creadoEn: 'asc' },
      },
      tienda: { select: { id: true, nombre: true, logoUrl: true, publicada: true, plantilla: true, ajustes: true } },
      dominios: { select: { dominio: true, verificado: true } },
      pagosSuscripcion: {
        orderBy: { creadoEn: 'desc' },
        take: 30,
        select: { referencia: true, plan: true, periodo: true, monto: true, estado: true, cuponCodigo: true, creadoEn: true },
      },
      notas: { orderBy: { creadoEn: 'desc' } },
      historialPlanes: { orderBy: { creadoEn: 'desc' }, take: 30 },
      tickets: {
        orderBy: { ultimoMensajeEn: 'desc' },
        take: 10,
        select: { id: true, numero: true, asunto: true, estado: true, ultimoMensajeEn: true },
      },
    },
  })
  if (!tenant) throw noEncontrado('Esa tienda no existe')

  const tiendaId = tenant.tienda?.id
  const [productos, sinFoto, pedidos, pedidos30, ventas, visitas, invitadas, padrino, actividad] = await Promise.all([
    tiendaId ? prisma.producto.count({ where: { tiendaId } }) : 0,
    tiendaId ? prisma.producto.count({ where: { tiendaId, fotos: { isEmpty: true } } }) : 0,
    tiendaId ? prisma.pedido.count({ where: { tiendaId } }) : 0,
    tiendaId ? prisma.pedido.count({ where: { tiendaId, creadoEn: { gte: hace30 } } }) : 0,
    tiendaId
      ? prisma.pedido.aggregate({
          where: { tiendaId, estado: { notIn: ['CANCELADO', 'REEMBOLSADO'] } },
          _sum: { total: true },
        })
      : null,
    tiendaId ? prisma.visitaDiaria.aggregate({ where: { tiendaId, fecha: { gte: hace30 } }, _sum: { visitas: true } }) : null,
    prisma.tenant.count({ where: { referidoPorId: id } }),
    tenant.referidoPorId ? prisma.tenant.findUnique({ where: { id: tenant.referidoPorId }, select: { id: true, nombre: true } }) : null,
    prisma.actividadAdmin.findMany({ where: { tenantId: id }, orderBy: { creadoEn: 'desc' }, take: 30 }),
  ])

  const duena = tenant.usuarios.find((usuario) => usuario.rol === 'PROPIETARIO') ?? null
  const ajustes = (tenant.tienda?.ajustes ?? {}) as { whatsapp?: string }

  res.json({
    tienda: {
      id: tenant.id,
      nombre: tenant.nombre,
      subdominio: tenant.subdominio,
      plan: tenant.plan,
      activo: tenant.activo,
      etiquetas: tenant.etiquetas,
      origen: tenant.origen,
      creadoEn: tenant.creadoEn,
      suscripcion: estadoSuscripcion(tenant.planVenceEn),
      logoUrl: tenant.tienda?.logoUrl ?? null,
      publicada: tenant.tienda?.publicada ?? false,
      plantilla: tenant.tienda?.plantilla ?? null,
      whatsapp: ajustes.whatsapp ?? null,
    },
    duena,
    equipo: tenant.usuarios,
    uso: {
      productos,
      sinFoto,
      pedidos,
      pedidos30,
      ventas: ventas?._sum.total?.toString() ?? '0',
      visitas30: visitas?._sum.visitas ?? 0,
    },
    salud: saludDe({
      publicada: tenant.tienda?.publicada ?? false,
      productos,
      sinFoto,
      pedidos30,
      logo: Boolean(tenant.tienda?.logoUrl),
      ultimoAcceso: duena?.ultimoAccesoEn ?? null,
    }),
    dominios: tenant.dominios,
    pagos: tenant.pagosSuscripcion,
    notas: tenant.notas,
    historial: tenant.historialPlanes,
    tickets: tenant.tickets,
    referidos: { invitadas, invitadaPor: padrino },
    actividad,
  })
}

export const esquemaExtender = z.object({
  dias: z.coerce.number().int().min(1).max(730),
  plan: z.enum(['EMPRENDE', 'NEGOCIO', 'PRO']).optional(),
  motivo: z.string().trim().max(160).optional(),
})

/** Regala o suma días de plan. Sin plan, extiende el que tiene (o Emprende si está en Gratis). */
export async function extenderPlan(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const { dias, plan, motivo } = req.body as z.infer<typeof esquemaExtender>
  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { plan: true, planVenceEn: true } })
  if (!tenant) throw noEncontrado('Esa tienda no existe')

  const nuevoPlan = plan ?? (tenant.plan === 'GRATIS' ? 'EMPRENDE' : tenant.plan)
  const ahora = new Date()
  const base = nuevoPlan === tenant.plan && tenant.planVenceEn && tenant.planVenceEn > ahora ? tenant.planVenceEn : ahora
  const venceEn = new Date(base.getTime() + dias * DIA)
  await prisma.$transaction((tx) =>
    cambiarPlan(tx, id, { plan: nuevoPlan, venceEn, motivo: 'EXTENSION', detalle: `${dias} días${motivo ? ` · ${motivo}` : ''}` }),
  )
  registrarActividad(req, 'Extendió el plan', `${dias} días de ${nuevoPlan}${motivo ? ` · ${motivo}` : ''}`, id)
  res.json({ plan: nuevoPlan, planVenceEn: venceEn })
}

export const esquemaNota = z.object({ texto: z.string().trim().min(1).max(2000) })

export async function agregarNota(req: Request, res: Response): Promise<void> {
  const tenantId = req.params.id as string
  const { texto } = req.body as z.infer<typeof esquemaNota>
  const nota = await prisma.notaTienda.create({ data: { tenantId, texto, autor: req.admin!.nombre } })
  res.status(201).json({ nota })
}

export async function quitarNota(req: Request, res: Response): Promise<void> {
  await prisma.notaTienda.deleteMany({ where: { id: req.params.nota as string, tenantId: req.params.id as string } })
  res.status(204).end()
}

export const esquemaEtiquetas = z.object({
  etiquetas: z.array(z.string().trim().toLowerCase().min(1).max(24)).max(10),
})

export async function cambiarEtiquetas(req: Request, res: Response): Promise<void> {
  const { etiquetas } = req.body as z.infer<typeof esquemaEtiquetas>
  const tenant = await prisma.tenant.update({
    where: { id: req.params.id as string },
    data: { etiquetas: [...new Set(etiquetas)] },
    select: { etiquetas: true },
  })
  res.json(tenant)
}

/**
 * Sesión de 2 horas como la dueña de la tienda, para ver su panel tal como lo
 * ve ella. Queda en la actividad.
 */
export async function entrarComoTienda(req: Request, res: Response): Promise<void> {
  const tenantId = req.params.id as string
  const duena = await prisma.usuario.findFirst({
    where: { tenantId, rol: 'PROPIETARIO' },
    select: { id: true, email: true, rol: true },
  })
  if (!duena) throw noEncontrado('Esa tienda no tiene dueña registrada')
  registrarActividad(req, 'Entró al panel de la tienda', undefined, tenantId)
  res.json({ token: firmarSesion({ usuarioId: duena.id, tenantId, email: duena.email, rol: duena.rol }, '2h') })
}

/** Tiendas publicadas para la galería, con lo que sirve para elegir ejemplos. */
export async function galeria(req: Request, res: Response): Promise<void> {
  // ?tipo= muestra sólo las de ese producto (la pestaña elegida); sin él, todas.
  const tipo = z.enum(['tienda', 'pagina', 'enlaces']).safeParse(req.query.tipo).data
  const tiendas = await prisma.tienda.findMany({
    where: { publicada: true, tenant: { activo: true }, ...(tipo ? { tipo } : {}) },
    orderBy: { actualizadoEn: 'desc' },
    take: 120,
    select: {
      tipo: true,
      nombre: true,
      logoUrl: true,
      plantilla: true,
      tema: true,
      actualizadoEn: true,
      tenant: { select: { id: true, subdominio: true, plan: true, etiquetas: true } },
      productos: { where: { activo: true }, take: 4, select: { fotos: true } },
      _count: { select: { productos: true, pedidos: true } },
    },
  })
  res.json({
    tiendas: tiendas.map(({ productos, tenant, _count, ...tienda }) => ({
      ...tienda,
      ...tenant,
      fotos: productos.map((producto) => producto.fotos[0]).filter(Boolean),
      productos: _count.productos,
      pedidos: _count.pedidos,
    })),
  })
}

const celda = (valor: unknown) => {
  const texto = valor instanceof Date ? valor.toISOString() : String(valor ?? '')
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}
const csv = (filas: unknown[][]) => '﻿' + filas.map((fila) => fila.map(celda).join(',')).join('\n')

/** Descarga en CSV (abre en Excel): tiendas, pagos o correos de las dueñas. */
export async function exportar(req: Request, res: Response): Promise<void> {
  const tipo = req.params.tipo as string
  let filas: unknown[][]

  if (tipo === 'pagos') {
    const pagos = await prisma.pagoSuscripcion.findMany({
      orderBy: { creadoEn: 'desc' },
      include: { tenant: { select: { nombre: true, subdominio: true } } },
    })
    filas = [
      ['Fecha', 'Referencia', 'Tienda', 'Subdominio', 'Plan', 'Periodo', 'Monto', 'Cupón', 'Estado', 'Id Bold'],
      ...pagos.map((pago) => [
        pago.creadoEn,
        pago.referencia,
        pago.tenant.nombre,
        pago.tenant.subdominio,
        pago.plan,
        pago.periodo,
        pago.monto,
        pago.cuponCodigo,
        pago.estado,
        pago.idBold,
      ]),
    ]
  } else {
    const tenants = await prisma.tenant.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        usuarios: { where: { rol: 'PROPIETARIO' }, take: 1, select: { nombre: true, email: true, ultimoAccesoEn: true } },
        tienda: { select: { publicada: true, _count: { select: { productos: true, pedidos: true } } } },
      },
    })
    filas =
      tipo === 'correos'
        ? [
            ['Nombre', 'Correo', 'Tienda', 'Plan'],
            ...tenants.filter((t) => t.usuarios[0]).map((t) => [t.usuarios[0]!.nombre, t.usuarios[0]!.email, t.nombre, t.plan]),
          ]
        : [
            ['Creada', 'Tienda', 'Subdominio', 'Plan', 'Vence', 'Activa', 'Publicada', 'Productos', 'Pedidos', 'Dueña', 'Correo', 'Último acceso', 'Origen', 'Etiquetas'],
            ...tenants.map((t) => [
              t.creadoEn,
              t.nombre,
              t.subdominio,
              t.plan,
              t.planVenceEn,
              t.activo ? 'sí' : 'no',
              t.tienda?.publicada ? 'sí' : 'no',
              t.tienda?._count.productos ?? 0,
              t.tienda?._count.pedidos ?? 0,
              t.usuarios[0]?.nombre,
              t.usuarios[0]?.email,
              t.usuarios[0]?.ultimoAccesoEn,
              t.origen,
              t.etiquetas.join(' '),
            ]),
          ]
  }

  registrarActividad(req, 'Exportó a CSV', tipo)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="mitienda-${tipo}-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send(csv(filas))
}
