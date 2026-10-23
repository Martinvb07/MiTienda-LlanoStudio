import { prisma } from '../config/prisma.js'
import type { Prisma } from '../generado/prisma/client.js'
import type { Plan } from '../utilidades/planes.js'

/**
 * Ajustes de la plataforma que edita el admin, guardados como JSON por clave.
 * Cada clave tiene su valor por defecto: si nunca se guardó, se usa ese.
 */

export interface PreguntaFrecuente {
  pregunta: string
  respuesta: string
}

export interface Testimonio {
  nombre: string
  tienda: string
  texto: string
  foto?: string
}

export interface PlantillaWhatsapp {
  titulo: string
  texto: string
}

export interface OpcionSoporte {
  pregunta: string
  respuesta: string
  enlace?: string
}

export interface Ajustes {
  prueba: { activa: boolean; plan: Exclude<Plan, 'GRATIS'>; dias: number }
  referidos: { activa: boolean; dias: number }
  mantenimiento: { registrosCerrados: boolean; mensaje: string }
  correos: { bienvenida: boolean; vencePronto: boolean; teExtranamos: boolean }
  preguntasPrecios: PreguntaFrecuente[]
  testimonios: Testimonio[]
  plantillasWhatsapp: PlantillaWhatsapp[]
  opcionesSoporte: OpcionSoporte[]
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  prueba: { activa: false, plan: 'EMPRENDE', dias: 14 },
  referidos: { activa: false, dias: 30 },
  mantenimiento: {
    registrosCerrados: false,
    mensaje: 'Estamos haciendo mejoras. Vuelve a intentarlo en un rato.',
  },
  correos: { bienvenida: true, vencePronto: true, teExtranamos: true },
  preguntasPrecios: [],
  testimonios: [],
  plantillasWhatsapp: [
    {
      titulo: 'Plan por vencer',
      texto: 'Hola {nombre}, te escribo de Mi Sitio. Tu plan {plan} de {tienda} vence pronto; lo puedes renovar desde tu panel en Plan y pagos. ¿Te ayudo con algo?',
    },
    {
      titulo: 'Bienvenida',
      texto: 'Hola {nombre}, bienvenido a Mi Sitio. Vi que creaste {tienda}. Si quieres, te ayudo a dejarla lista para vender.',
    },
    {
      titulo: 'Pago sin terminar',
      texto: 'Hola {nombre}, vi que empezaste a pagar el plan {plan} para {tienda} pero no se completó. ¿Tuviste algún problema con el pago?',
    },
  ],
  opcionesSoporte: [
    {
      pregunta: '¿Cómo publico mi tienda?',
      respuesta: 'Entra al panel, abre Diseño y en la sección Publicación activa "Tienda publicada". Desde ese momento cualquiera la puede ver en tu dirección.',
    },
    {
      pregunta: '¿Cómo pago o renuevo mi plan?',
      respuesta: 'En el panel, en Plan y pagos, eliges el plan y pagas con Bold: tarjeta, PSE, Nequi o Botón Bancolombia. Se activa apenas se aprueba el pago.',
    },
    {
      pregunta: '¿Cómo agrego productos?',
      respuesta: 'En el panel, en Productos, toca "Nuevo producto": nombre, fotos, precio y stock. Puedes dejarlo oculto mientras lo terminas.',
    },
    {
      pregunta: '¿Cobran comisión por venta?',
      respuesta: 'No. Mi Sitio no cobra comisión sobre tus ventas: sólo pagas tu plan.',
    },
  ],
}

export type ClaveAjuste = keyof Ajustes

export async function leerAjuste<C extends ClaveAjuste>(clave: C): Promise<Ajustes[C]> {
  const fila = await prisma.configuracionPlataforma.findUnique({ where: { clave } })
  if (!fila) return AJUSTES_POR_DEFECTO[clave]
  const valor = fila.valor as unknown
  // Los objetos se mezclan con el defecto para que una clave nueva no llegue vacía.
  const defecto = AJUSTES_POR_DEFECTO[clave]
  if (Array.isArray(defecto)) return valor as Ajustes[C]
  return { ...defecto, ...(valor as object) } as Ajustes[C]
}

export async function guardarAjuste<C extends ClaveAjuste>(clave: C, valor: Ajustes[C]) {
  const json = valor as unknown as Prisma.InputJsonValue
  await prisma.configuracionPlataforma.upsert({
    where: { clave },
    create: { clave, valor: json },
    update: { valor: json },
  })
  return valor
}

type Transaccion = Prisma.TransactionClient

/**
 * Único lugar donde cambia el plan de una tienda: deja la fila en el
 * historial (pago, admin, vencimiento, prueba, referido, extensión).
 */
export async function cambiarPlan(
  tx: Transaccion,
  tenantId: string,
  datos: { plan: Plan; venceEn: Date | null; motivo: string; detalle?: string },
) {
  const actual = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { plan: true } })
  await tx.tenant.update({ where: { id: tenantId }, data: { plan: datos.plan, planVenceEn: datos.venceEn } })
  await tx.historialPlan.create({
    data: {
      tenantId,
      planAnterior: actual.plan,
      planNuevo: datos.plan,
      motivo: datos.motivo,
      detalle: datos.detalle,
    },
  })
}
