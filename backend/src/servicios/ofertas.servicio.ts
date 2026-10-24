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

/** De quién es la oferta: la tienda en línea, la página para tu negocio o los enlaces para la bio. */
export type TipoOferta = 'tienda' | 'pagina' | 'enlaces'

/** Lo que llega en ?tipo=: cualquier otra cosa es la tienda. */
export const tipoOferta = (valor: unknown): TipoOferta => (valor === 'pagina' || valor === 'enlaces' ? valor : 'tienda')

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

/** Oferta inicial de la página para tu negocio: sin carrito ni catálogo, cuesta menos. */
export const OFERTAS_PAGINA_POR_DEFECTO: Record<Plan, Oferta> = {
  GRATIS: {
    plan: 'GRATIS',
    precio: 0,
    precioAnual: 0,
    resumen: 'Para tener tu negocio en internet hoy mismo.',
    incluye: ['Subdominio tunegocio.llanostudio.co', 'Servicios, horario y contacto por WhatsApp', 'Plantillas por oficio', 'Hasta 6 secciones'],
    destacado: false,
  },
  EMPRENDE: {
    plan: 'EMPRENDE',
    precio: 24900,
    precioAnual: 249000,
    resumen: 'Para que tu página se vea con tu marca.',
    incluye: ['Colores, letra y esquinas a tu medida', 'Equipo, galería y preguntas frecuentes', 'WhatsApp flotante y pie con contacto', 'Sin marca de Mi Sitio en el pie'],
    destacado: false,
  },
  NEGOCIO: {
    plan: 'NEGOCIO',
    precio: 49900,
    precioAnual: 499000,
    resumen: 'Para negocios con varias sedes o personas al frente.',
    incluye: ['Hasta 30 secciones y diseño libre', 'Opiniones, video, mapa y logos de clientes', 'Dominio propio con HTTPS', 'Soporte prioritario'],
    destacado: true,
  },
  PRO: {
    plan: 'PRO',
    precio: 99900,
    precioAnual: 999000,
    resumen: 'Para quien maneja más de una marca.',
    incluye: ['Todo lo de Negocio', 'Hasta 60 secciones', 'Acompañamiento en la puesta en marcha'],
    destacado: false,
  },
}

/** Oferta inicial de los enlaces para la bio: lo más liviano, cuesta menos que la página. */
export const OFERTAS_ENLACES_POR_DEFECTO: Record<Plan, Oferta> = {
  GRATIS: {
    plan: 'GRATIS',
    precio: 0,
    precioAnual: 0,
    resumen: 'Para tener tu link de la bio hoy mismo.',
    incluye: ['Subdominio tunombre.llanostudio.co', 'Hasta 6 enlaces y tus redes', 'Plantillas gratuitas', 'Código QR para compartir'],
    destacado: false,
  },
  EMPRENDE: {
    plan: 'EMPRENDE',
    precio: 9900,
    precioAnual: 99000,
    resumen: 'Para que tu link se vea con tu marca.',
    incluye: ['Hasta 15 enlaces', 'Colores, letra, fondo degradado o de malla', 'Todas las plantillas', 'Sin marca de Mi Sitio'],
    destacado: true,
  },
  NEGOCIO: {
    plan: 'NEGOCIO',
    precio: 19900,
    precioAnual: 199000,
    resumen: 'Para creadores y negocios que viven de sus redes.',
    incluye: ['Hasta 40 enlaces', 'Opiniones, video y mapa', 'Dominio propio con HTTPS', 'Estadísticas de 90 días'],
    destacado: false,
  },
  PRO: {
    plan: 'PRO',
    precio: 39900,
    precioAnual: 399000,
    resumen: 'Para agencias y quien maneja varias marcas.',
    incluye: ['Todo lo de Negocio', 'Hasta 100 enlaces', 'Cuenta regresiva para lanzamientos', 'Acompañamiento en la puesta en marcha'],
    destacado: false,
  },
}

const DE_FABRICA: Record<TipoOferta, Record<Plan, Oferta>> = {
  tienda: OFERTAS_POR_DEFECTO,
  pagina: OFERTAS_PAGINA_POR_DEFECTO,
  enlaces: OFERTAS_ENLACES_POR_DEFECTO,
}

/** Las cuatro ofertas en orden, con lo guardado por el admin encima de lo de fábrica. */
export async function listarOfertas(tipo: TipoOferta = 'tienda'): Promise<Oferta[]> {
  const guardadas = await prisma.ofertaPlan.findMany({ where: { tipo } })
  return ORDEN.map((plan) => {
    const fila = guardadas.find((oferta) => oferta.plan === plan)
    return fila
      ? { plan, precio: fila.precio, precioAnual: fila.precioAnual, resumen: fila.resumen, incluye: fila.incluye, destacado: fila.destacado }
      : DE_FABRICA[tipo][plan]
  })
}

/** Qué ofertas le tocan a una cuenta: las del tipo de su sitio. */
export async function tipoOfertaDe(tenantId: string): Promise<TipoOferta> {
  const tienda = await prisma.tienda.findUnique({ where: { tenantId }, select: { tipo: true } })
  return tipoOferta(tienda?.tipo)
}
