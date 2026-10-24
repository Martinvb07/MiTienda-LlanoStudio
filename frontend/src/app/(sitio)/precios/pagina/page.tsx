import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { ComparativaPlanes } from '@/componentes/sitio/ComparativaPlanes'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { TablaPrecios } from '@/componentes/sitio/TablaPrecios'
import { SelectorProducto } from '@/componentes/sitio/SelectorProducto'
import { MENU_PRECIOS } from '@/componentes/sitio/productos'

export const metadata: Metadata = {
  title: 'Precios de la página para tu negocio',
  description:
    'Planes de la página para tu negocio desde $0: servicios, horario y contacto por WhatsApp. Sin permanencia.',
  alternates: { canonical: '/precios/pagina' },
}

const PREGUNTAS = [
  {
    pregunta: '¿Por qué cuesta menos que la tienda?',
    respuesta:
      'Porque no lleva carrito, pagos en línea ni pedidos: es la página de tu negocio, con tus servicios, tu equipo, tu horario y un botón a tu WhatsApp.',
  },
  {
    pregunta: '¿Necesito tarjeta de crédito para empezar?',
    respuesta:
      'No. El plan Gratis no pide datos de pago y no vence. Si pasas a un plan pago, lo pagas desde tu panel con Bold: tarjeta, PSE, Nequi o Botón Bancolombia.',
  },
  {
    pregunta: '¿Cómo me agendan una cita?',
    respuesta:
      'Cada servicio tiene un botón que abre tu WhatsApp con el nombre del servicio ya escrito. No hay calendario de citas dentro de Mi Sitio.',
  },
  {
    pregunta: '¿Puedo cambiar de plan más adelante?',
    respuesta:
      'Sí, cuando quieras y en las dos direcciones. Al bajar, tu página sigue ahí; sólo dejas de usar lo que ese plan no incluye.',
  },
  {
    pregunta: '¿El dominio propio está incluido?',
    respuesta: 'La conexión sí, desde el plan Negocio, con HTTPS incluido. El dominio lo compras aparte, con el proveedor que prefieras.',
  },
]

export default function PaginaPreciosNegocio() {
  return (
    <>
      <CabeceraPagina
        rotulo="Precios"
        titulo="Tu negocio en internet, desde $0."
        descripcion="Sin carrito, con tu WhatsApp. Sin permanencia; el plan Gratis no vence."
      >
        <SelectorProducto opciones={MENU_PRECIOS} actual="pagina" />
      </CabeceraPagina>

      <TablaPrecios tipo="pagina" />

      <ComparativaPlanes tipo="pagina" />

      <Preguntas titulo="Lo que más nos preguntan" preguntas={PREGUNTAS} />

      <LlamadoFinal
        titulo="Tu negocio en internet, hoy"
        hrefEmpezar="/panel/crear-cuenta?producto=pagina"
        hrefPlantillas="/plantillas/pagina"
      />
    </>
  )
}
