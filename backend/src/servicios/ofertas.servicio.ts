import { prisma } from '../config/prisma.js'
import type { Plan } from '../utilidades/planes.js'

export interface Oferta {
  plan: Plan
  precio: number
  /** Precio por un año pagado de una vez; 0 = no se vende anual. */
  precioAnual: number
  resumen: string
  incluye: string[]
  destacado: boolean
}

export const ORDEN: Plan[] = ['GRATIS', 'EMPRENDE', 'NEGOCIO', 'PRO']

/** Oferta inicial de cada plan, hasta que el admin la cambie. */
export const OFERTAS_POR_DEFECTO: Record<Plan, Oferta> = {
  GRATIS: {
    plan: 'GRATIS',
    precio: 0,
    precioAnual: 0,
    resumen: 'Para probar la plataforma y publicar tus primeros productos.',
    incluye: [
      'Hasta 10 productos, 4 fotos cada uno',
      'Subdominio tunegocio.llanostudio.co',
      'Plantillas gratuitas y estilos predefinidos',
      'Hasta 6 secciones',
    ],
    destacado: false,
  },
  EMPRENDE: {
    plan: 'EMPRENDE',
    precio: 39900,
    precioAnual: 399000,
    resumen: 'Para quien ya vende y quiere una tienda con su identidad.',
    incluye: [
      'Hasta 100 productos, 8 fotos cada uno',
      'Colores, letra y esquinas a tu medida',
      'Carrusel de banners, categorías con foto y buscador',
      'Cabecera completa, WhatsApp flotante y pie con contacto',
      'Sin marca de Mi Sitio en el pie',
    ],
    destacado: false,
  },
  NEGOCIO: {
    plan: 'NEGOCIO',
    precio: 89900,
    precioAnual: 899000,
    resumen: 'Para tiendas con volumen y varias personas al frente.',
    incluye: [
      'Productos ilimitados, 10 fotos cada uno',
      'Todas las plantillas y hasta 30 secciones',
      'Hasta 8 banners, 12 categorías y 8 enlaces de menú',
      'Soporte prioritario',
    ],
    destacado: true,
  },
  PRO: {
    plan: 'PRO',
    precio: 179900,
    precioAnual: 1799000,
    resumen: 'Para quien opera más de una marca a la vez.',
    incluye: [
      'Todo lo de Negocio',
      'Acompañamiento en la puesta en marcha',
      'Dominio propio (próximamente)',
      'Facturación electrónica DIAN (próximamente)',
    ],
    destacado: false,
  },
}

/** Las cuatro ofertas en orden, con lo guardado por el admin encima de lo de fábrica. */
export async function listarOfertas(): Promise<Oferta[]> {
  const guardadas = await prisma.ofertaPlan.findMany()
  return ORDEN.map((plan) => {
    const fila = guardadas.find((oferta) => oferta.plan === plan)
    return fila
      ? { plan, precio: fila.precio, precioAnual: fila.precioAnual, resumen: fila.resumen, incluye: fila.incluye, destacado: fila.destacado }
      : OFERTAS_POR_DEFECTO[plan]
  })
}
