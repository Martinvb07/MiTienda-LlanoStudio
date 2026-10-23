import type { Metadata } from 'next'
import { PaginaProxima } from '@/componentes/sitio/PaginaProxima'
import { PRODUCTOS } from '@/componentes/sitio/productos'
import { MaquetaEnlaces } from '@/componentes/sitio/TresProductos'

export const metadata: Metadata = {
  title: 'Enlaces para tu bio',
  description:
    'Próximamente en Mi Sitio: una página con todos tus enlaces para la bio de Instagram, en tu misma dirección y con la misma cuenta que tu tienda.',
  alternates: { canonical: '/enlaces' },
}

export default function PaginaEnlaces() {
  return (
    <PaginaProxima
      producto={PRODUCTOS.find((producto) => producto.clave === 'enlaces')!}
      titulo="Un solo enlace para tu bio"
      descripcion="Tu tienda, tu WhatsApp y tus redes en una página corta. Estamos construyéndola."
      maqueta={<MaquetaEnlaces />}
      para={['Creadores y marcas personales', 'Emprendimientos de Instagram', 'Negocios con varios canales']}
      mientras={[
        { titulo: 'Pon tu tienda en la bio', texto: 'Tu dirección ya sirve como enlace de Instagram.' },
        { titulo: 'WhatsApp a la mano', texto: 'Botón flotante y pedidos por chat, desde Emprende.' },
        { titulo: 'Código QR', texto: 'Para imprimir en el mostrador o en las bolsas.' },
      ]}
    />
  )
}
