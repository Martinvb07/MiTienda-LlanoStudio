import { Caracteristicas, ComoFunciona } from '@/componentes/sitio/Caracteristicas'
import { CualTeConviene } from '@/componentes/sitio/CualTeConviene'
import { Hero } from '@/componentes/sitio/Hero'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { SeccionEnlaces, SeccionPagina } from '@/componentes/sitio/PaginaYEnlaces'
import { Plantillas } from '@/componentes/sitio/Plantillas'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { PreciosPortada } from '@/componentes/sitio/PreciosPortada'
import { Testimonios } from '@/componentes/sitio/Testimonios'
import { TresProductos } from '@/componentes/sitio/TresProductos'
import { obtenerContenidoSitio } from '@/servicios/contenido.servicio'

/** Los pasos sirven para los tres productos, no sólo para la tienda. */
const PASOS = [
  { titulo: 'Crea tu cuenta', texto: 'Dos minutos, sin tarjeta.' },
  { titulo: 'Elige qué armar', texto: 'Una tienda, una página o tus enlaces. O los tres.' },
  { titulo: 'Escoge una plantilla', texto: 'Por rubro u oficio, y cámbiala a tu gusto.' },
  { titulo: 'Llénala con lo tuyo', texto: 'Productos, servicios, horario o enlaces.' },
  { titulo: 'Publica y comparte', texto: 'Con tu enlace, tu dominio o tu código QR.' },
]

const PREGUNTAS = [
  {
    pregunta: '¿Qué puedo hacer con Mi Sitio?',
    respuesta:
      'Tres cosas, con la misma cuenta: una tienda en línea para vender, una página para tu negocio sin carrito, y tus enlaces para la bio de Instagram y TikTok. Puedes usar una sola o las tres.',
  },
  {
    pregunta: '¿Cuál me conviene?',
    respuesta:
      'Si vendes productos, la tienda. Si ofreces un servicio (abogados, clínicas, restaurantes, gimnasios, talleres), la página. Si todo pasa en tus redes, los enlaces.',
  },
  {
    pregunta: '¿Qué trae la página para mi negocio?',
    respuesta:
      'Tus servicios con precio y horario, tu equipo, cómo llegar, un formulario de contacto y reservas en línea. Hay una plantilla para cada oficio.',
  },
  {
    pregunta: '¿Mis clientes pueden agendar solos?',
    respuesta:
      'Sí. Con la sección de reservas eligen servicio, día y hora libre; la cita llega a tu agenda en el panel y les mandamos un recordatorio el día antes. Funciona en la página y también en la tienda.',
  },
  {
    pregunta: '¿Qué son los enlaces para la bio?',
    respuesta:
      'Una página corta con tu foto, tus redes y botones a tu WhatsApp, tu tienda o lo que quieras. Es el link que pones en la bio, y también trae código QR.',
  },
  {
    pregunta: '¿Necesito saber de diseño o de código?',
    respuesta: 'No. Si sabes usar Instagram, sabes usar Mi Sitio.',
  },
  {
    pregunta: '¿Cómo me pagan en la tienda?',
    respuesta: 'Con tu propia cuenta de Wompi, ePayco o Bold, por WhatsApp o contra entrega.',
  },
  {
    pregunta: '¿Puedo cobrar distinto el envío según la ciudad?',
    respuesta: 'Sí. Armas zonas con sus ciudades y su precio, y si quieres, ofreces recoger en tu local sin costo.',
  },
  {
    pregunta: '¿Cobran comisión por venta?',
    respuesta: 'No. Sólo aplica la tarifa de la pasarela que uses.',
  },
  {
    pregunta: '¿Puedo usar mi propio dominio?',
    respuesta: 'Sí, desde el plan Negocio, en la tienda, la página o los enlaces, con HTTPS incluido.',
  },
  {
    pregunta: '¿Cuánto cuesta empezar?',
    respuesta: 'Nada. Los tres tienen plan Gratis, que no pide tarjeta y no vence.',
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
      <SeccionPagina />
      <SeccionEnlaces />
      <CualTeConviene />
      <Plantillas />
      <PreciosPortada />
      <ComoFunciona titulo="De cero a publicado en una tarde" pasos={PASOS} />
      <Testimonios testimonios={testimonios} />
      <Preguntas titulo="Lo que más nos preguntan" preguntas={PREGUNTAS} />
      <LlamadoFinal />
    </>
  )
}
