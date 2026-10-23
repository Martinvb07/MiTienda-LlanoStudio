import type { Metadata } from 'next'
import { PaginaProxima } from '@/componentes/sitio/PaginaProxima'
import { PRODUCTOS } from '@/componentes/sitio/productos'
import { MaquetaPagina } from '@/componentes/sitio/Maquetas'

export const metadata: Metadata = {
  title: 'Página para tu negocio',
  description:
    'Próximamente en Mi Sitio: una página informativa para abogados, clínicas, restaurantes y servicios, en la misma cuenta y dirección que tu tienda.',
  alternates: { canonical: '/para-negocios' },
}

export default function PaginaParaNegocios() {
  return (
    <PaginaProxima
      producto={PRODUCTOS.find((producto) => producto.clave === 'pagina')!}
      titulo="La página de tu negocio, sin carrito"
      descripcion="Quiénes son, qué hacen y cómo contactarlos. Estamos construyéndola."
      maqueta={<MaquetaPagina grande />}
      para={['Abogados y consultorios', 'Clínicas y odontólogos', 'Restaurantes y cafés', 'Servicios y oficios']}
      mientras={[
        { titulo: 'Reserva tu dirección', texto: 'tunegocio.llanostudio.co queda a tu nombre desde hoy.' },
        { titulo: 'Arma una portada', texto: 'Con las secciones de la tienda: texto, fotos, mapa y WhatsApp.' },
        { titulo: 'Conecta tu dominio', texto: 'Desde el plan Negocio, con HTTPS incluido.' },
      ]}
    />
  )
}
