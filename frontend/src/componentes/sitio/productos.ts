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
    disponible: false,
  },
]
