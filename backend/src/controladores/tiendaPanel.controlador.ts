import type { Request, Response } from 'express'
import type { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { guardarImagen } from '../almacenamiento/index.js'
import { noEncontrado, solicitudInvalida } from '../utilidades/errores.js'
import { ETIQUETAS_BLOQUE_PLAN, TEMAS_PREDEFINIDOS, fueraDelPlan, limitesDe, type LimitesPlan } from '../utilidades/planes.js'
import type { esquemaBloque, esquemaTienda } from './panel.esquemas.js'

/** La tienda de la sesión (diseño, tema, ajustes) y la subida de imágenes. */

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
export async function tiendaDeLaSesion(req: Request) {
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

export async function planDeLaSesion(req: Request) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.sesion!.tenantId },
    select: { plan: true },
  })
  return limitesDe(tenant?.plan ?? 'GRATIS')
}

type BloqueGuardado = z.infer<typeof esquemaBloque>

/** Las secciones de una página tienen que caber en el plan: cuántas y de qué tipo. */
function validarBloques(bloques: BloqueGuardado[], plan: LimitesPlan, donde = '') {
  if (bloques.length > plan.secciones) {
    throw fueraDelPlan(`Tu plan ${plan.nombre} admite hasta ${plan.secciones} secciones${donde}`)
  }
  const fuera = bloques.find((bloque) => !plan.bloques.includes(bloque.tipo))
  if (fuera) {
    throw fueraDelPlan(
      `La sección "${ETIQUETAS_BLOQUE_PLAN[fuera.tipo] ?? fuera.tipo}"${donde} no está incluida en tu plan ${plan.nombre}`,
    )
  }
}

/** Quitar "Hecho con Mi Sitio" del pie es de los planes pagos. */
const conMarca = (bloques: BloqueGuardado[], plan: LimitesPlan) =>
  plan.quitarMarca
    ? bloques
    : bloques.map((bloque) => (bloque.tipo === 'pie' ? { ...bloque, props: { ...bloque.props, ocultarMarca: false } } : bloque))

export async function actualizarTiendaPanel(req: Request, res: Response): Promise<void> {
  const datos = req.body as z.infer<typeof esquemaTienda>
  const plan = await planDeLaSesion(req)

  validarBloques(datos.configuracionBloques, plan)
  // Las páginas extra no se rechazan por cantidad: si el plan baja, se guardan
  // igual y sólo se publican las que el plan incluye. Sus secciones sí cuentan.
  for (const pagina of datos.ajustes.paginas ?? []) validarBloques(pagina.bloques, plan, ` (página ${pagina.titulo})`)
  const ajustes = datos.ajustes.paginas
    ? { ...datos.ajustes, paginas: datos.ajustes.paginas.map((pagina) => ({ ...pagina, bloques: conMarca(pagina.bloques, plan) })) }
    : datos.ajustes

  // Sin tema libre, el tema es siempre el del estilo predefinido elegido: lo
  // que llegue en el cuerpo se ignora.
  const plantilla = plan.temaLibre || datos.plantilla in TEMAS_PREDEFINIDOS ? datos.plantilla : 'clasica'
  const tema = plan.temaLibre ? datos.tema : TEMAS_PREDEFINIDOS[plantilla]!

  const bloques = conMarca(datos.configuracionBloques, plan)

  const tienda = await prisma.tienda.update({
    where: { tenantId: req.sesion!.tenantId },
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      logoUrl: datos.logoUrl || null,
      plantilla,
      tema,
      configuracionBloques: bloques as object[],
      // Mismo trato que configuracionBloques: JSON libre ya validado arriba.
      ajustes: ajustes as object,
      publicada: datos.publicada,
    },
    select: camposTienda,
  })

  res.json({ tienda })
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
