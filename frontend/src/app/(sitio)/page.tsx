import { Caracteristicas, ComoFunciona } from '@/componentes/sitio/Caracteristicas'
import { Hero } from '@/componentes/sitio/Hero'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Plantillas } from '@/componentes/sitio/Plantillas'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { Testimonios } from '@/componentes/sitio/Testimonios'
import { obtenerContenidoSitio } from '@/servicios/contenido.servicio'

const PREGUNTAS = [
  {
    pregunta: '¿Necesito saber de diseño o de código?',
    respuesta:
      'No. Eliges una plantilla, cambias textos, colores y fotos desde el editor y ves el resultado en vivo. Si sabes usar Instagram, sabes usar Mi Sitio.',
  },
  {
    pregunta: '¿Cuánto cuesta empezar?',
    respuesta:
      'Nada. El plan Gratis no pide tarjeta y no vence. Cuando quieras más productos, más secciones o tus propios colores, pasas a un plan pago.',
  },
  {
    pregunta: '¿Cobran comisión por cada venta?',
    respuesta: 'No. Lo que vendes es tuyo; sólo aplican las tarifas de la pasarela de pago que uses.',
  },
  {
    pregunta: '¿Puedo cambiar de plantilla después?',
    respuesta:
      'Sí, cuando quieras. Tus productos no se tocan: la plantilla sólo cambia el diseño y las secciones de la portada.',
  },
]

/** Portada de Mi Sitio, con el mismo recorrido y ritmo que llanostudio.co. */
export default async function PaginaInicio() {
  const { testimonios } = await obtenerContenidoSitio()
  return (
    <>
      <Hero />
      <Caracteristicas />
      <Plantillas />
      <ComoFunciona />
      <Testimonios testimonios={testimonios} />
      <Preguntas titulo="Lo que más nos preguntan" preguntas={PREGUNTAS} />
      <LlamadoFinal />
    </>
  )
}
