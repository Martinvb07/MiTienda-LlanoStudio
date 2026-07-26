import { prisma } from '../config/prisma.js'

/**
 * Datos mínimos que `resolverTenant` cuelga de la petición. Todo lo que venga
 * después (controladores, servicios) debe filtrar por estos identificadores.
 */
export interface ContextoTenant {
  tenantId: string
  tiendaId: string
  subdominio: string
  nombreTienda: string
  plan: string
  publicada: boolean
}

const seleccion = {
  id: true,
  nombre: true,
  publicada: true,
  tenant: {
    select: { id: true, subdominio: true, plan: true, activo: true },
  },
} as const

type TiendaConTenant = {
  id: string
  nombre: string
  publicada: boolean
  tenant: { id: string; subdominio: string; plan: string; activo: boolean }
}

function aContexto(tienda: TiendaConTenant | null): ContextoTenant | null {
  if (!tienda || !tienda.tenant.activo) return null
  return {
    tenantId: tienda.tenant.id,
    tiendaId: tienda.id,
    subdominio: tienda.tenant.subdominio,
    nombreTienda: tienda.nombre,
    plan: tienda.tenant.plan,
    publicada: tienda.publicada,
  }
}

/** Resuelve la tienda servida en <subdominio>.llanostudio.co */
export async function buscarPorSubdominio(subdominio: string): Promise<ContextoTenant | null> {
  const tienda = await prisma.tienda.findFirst({
    where: { tenant: { subdominio } },
    select: seleccion,
  })
  return aContexto(tienda)
}

/**
 * Resuelve la tienda servida en un dominio propio. Sólo se sirven dominios ya
 * verificados: si no, cualquiera podría apuntar su DNS a la plataforma y
 * quedarse con el escaparate de otro.
 */
export async function buscarPorDominioPropio(dominio: string): Promise<ContextoTenant | null> {
  const registroDominio = await prisma.dominioPropio.findUnique({
    where: { dominio },
    select: {
      verificado: true,
      tenant: { select: { tienda: { select: seleccion } } },
    },
  })

  if (!registroDominio?.verificado) return null
  return aContexto(registroDominio.tenant.tienda)
}
