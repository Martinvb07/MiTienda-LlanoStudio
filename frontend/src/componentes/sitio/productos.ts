import { Link2, Store, type LucideIcon, LayoutTemplate } from 'lucide-react'

export interface ProductoSitio {
  clave: 'tienda' | 'pagina' | 'enlaces'
  nombre: string
  resumen: string
  href: string
  icono: LucideIcon
  /** Lo que todavía no se puede usar se anuncia, pero no se vende. */
  disponible: boolean
}

/**
 * Las tres formas de usar Mi Sitio. El menú, la portada y el pie salen de aquí,
 * así un producto que se lanza cambia en un solo lugar.
 */
export const PRODUCTOS: readonly ProductoSitio[] = [
  {
    clave: 'tienda',
    nombre: 'Tienda en línea',
    resumen: 'Vende con carrito, pagos y pedidos.',
    href: '/caracteristicas',
    icono: Store,
    disponible: true,
  },
  {
    clave: 'pagina',
    nombre: 'Página para tu negocio',
    resumen: 'Para abogados, clínicas, restaurantes y servicios.',
    href: '/para-negocios',
    icono: LayoutTemplate,
    disponible: true,
  },
  {
    clave: 'enlaces',
    nombre: 'Enlaces para tu bio',
    resumen: 'Todos tus enlaces, para la bio de Instagram.',
    href: '/enlaces',
    icono: Link2,
    disponible: true,
  },
]

/** Una opción de los menús que bajan: Productos, Plantillas y Precios. */
export type OpcionMenu = ProductoSitio

const producto = (clave: ProductoSitio['clave']) => PRODUCTOS.find((otro) => otro.clave === clave)!

/** Plantillas de cada producto. */
export const MENU_PLANTILLAS: readonly OpcionMenu[] = [
  { ...producto('tienda'), resumen: 'Diseños para vender, por rubro.', href: '/plantillas' },
  { ...producto('pagina'), resumen: 'Por oficio: abogados, salud, comida y servicios.', href: '/plantillas/pagina' },
  { ...producto('enlaces'), resumen: 'Para creadores, artistas y negocios.', href: '/plantillas/enlaces' },
]

/** Precios de cada producto: la página cuesta menos que la tienda, y los enlaces menos que la página. */
export const MENU_PRECIOS: readonly OpcionMenu[] = [
  { ...producto('tienda'), resumen: 'Carrito, pagos y pedidos. Desde $0.', href: '/precios' },
  { ...producto('pagina'), resumen: 'Sin carrito, más livianos. Desde $0.', href: '/precios/pagina' },
  { ...producto('enlaces'), resumen: 'Lo más liviano. Desde $0.', href: '/precios/enlaces' },
]
