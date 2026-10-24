import { Caracteristicas, ComoFunciona } from '@/componentes/sitio/Caracteristicas'
import { Hero } from '@/componentes/sitio/Hero'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Plantillas } from '@/componentes/sitio/Plantillas'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { Testimonios } from '@/componentes/sitio/Testimonios'
import { TresProductos } from '@/componentes/sitio/TresProductos'
import { obtenerContenidoSitio } from '@/servicios/contenido.servicio'

const PREGUNTAS = [
  {
    pregunta: '¿Qué puedo hacer con Mi Sitio?',
    respuesta:
      'Una tienda en línea, una página para tu negocio sin carrito, o tus enlaces para la bio de Instagram y TikTok.',
  },
  {
    pregunta: '¿Qué son los enlaces para la bio?',
    respuesta: 'Una página corta con tu foto, tus redes y botones a tu WhatsApp, tu tienda o lo que quieras. Es el link que pones en la bio.',
  },
  {
    pregunta: '¿Necesito saber de diseño o de código?',
    respuesta: 'No. Si sabes usar Instagram, sabes usar Mi Sitio.',
  },
  {
    pregunta: '¿Cómo me pagan mis clientes?',
    respuesta: 'Con tu propia cuenta de Wompi, ePayco o Bold, por WhatsApp o contra entrega.',
  },
  {
    pregunta: '¿Cobran comisión por venta?',
    respuesta: 'No. Sólo aplica la tarifa de la pasarela que uses.',
  },
  {
    pregunta: '¿Puedo usar mi propio dominio?',
    respuesta: 'Sí, desde el plan Negocio, con HTTPS incluido.',
  },
  {
    pregunta: '¿Cuánto cuesta empezar?',
    respuesta: 'Nada. El plan Gratis no pide tarjeta y no vence.',
  },
]

/** Portada de Mi Sitio, con el mismo recorrido y ritmo que llanostudio.co. */
export default async function PaginaInicio() {
  const { testimonios } = await obtenerContenidoSitio()
  return (
    <>
      <Hero />
      <TresProductos />
      <Caracteristicas />
      <Plantillas />
      <ComoFunciona />
      <Testimonios testimonios={testimonios} />
      <Preguntas titulo="Lo que más nos preguntan" preguntas={PREGUNTAS} />
      <LlamadoFinal />
    </>
  )
}
