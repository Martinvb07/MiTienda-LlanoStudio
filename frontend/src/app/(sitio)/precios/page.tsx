import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { ComparativaPlanes } from '@/componentes/sitio/ComparativaPlanes'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { TablaPrecios } from '@/componentes/sitio/TablaPrecios'
import { obtenerContenidoSitio } from '@/servicios/contenido.servicio'

export const metadata: Metadata = {
  title: 'Precios',
  description:
    'Planes de Mi Sitio desde $0 para vender en línea en Colombia. Sin comisión por venta y sin permanencia.',
  alternates: { canonical: '/precios' },
}

const PREGUNTAS = [
  {
    pregunta: '¿Necesito tarjeta de crédito para empezar?',
    respuesta:
      'No. El plan Gratis no pide datos de pago: creas tu cuenta, armas la tienda y la publicas. Si pasas a un plan pago, lo pagas desde tu panel con Bold: tarjeta, PSE, Nequi o Botón Bancolombia, mes a mes o por un año con descuento.',
  },
  {
    pregunta: '¿Los planes incluyen la página y los enlaces?',
    respuesta:
      'La página para tu negocio usa los mismos planes que la tienda: arranca gratis y los planes pagos suman secciones como equipo, opiniones y mapa. Los enlaces para la bio están en construcción; su precio aún no está definido.',
  },
  {
    pregunta: '¿Puedo cambiar de plan más adelante?',
    respuesta:
      'Sí, en cualquier momento y en las dos direcciones. Al subir de plan, las funciones nuevas quedan disponibles enseguida; al bajar, tu tienda y tus productos siguen ahí, sólo dejas de usar lo que ese plan no incluye.',
  },
  {
    pregunta: '¿Qué pasa si supero el límite de productos?',
    respuesta:
      'Nada se borra. Los productos que pasen del límite dejan de mostrarse en la tienda hasta que subas de plan o des de baja algunos, pero la información queda guardada.',
  },
  {
    pregunta: '¿El dominio propio está incluido en el precio?',
    respuesta:
      'La conexión sí, desde el plan Negocio, con HTTPS incluido. El dominio lo compras aparte, con el proveedor que prefieras.',
  },
  {
    pregunta: '¿Cobran comisión por cada venta?',
    respuesta:
      'No. Sólo aplica la tarifa de la pasarela que conectes (Wompi, ePayco o Bold), que la cobra ella directamente.',
  },
  {
    pregunta: '¿Qué pasa con mi tienda si dejo de pagar?',
    respuesta:
      'No hay cobros automáticos: cuando tu plan está por vencer te avisamos en el panel. Si vence, tienes 5 días para pagar; después tu tienda pasa al plan Gratis, sin borrar nada, y vuelves a tu plan apenas pagues.',
  },
]

export default async function PaginaPrecios() {
  // Las del admin reemplazan a estas si hay alguna guardada.
  const { preguntasPrecios } = await obtenerContenidoSitio()
  return (
    <>
      <CabeceraPagina
        rotulo="Precios"
        titulo="Empieza gratis. Paga cuando tu tienda lo pida."
        descripcion="Sin comisión por venta y sin permanencia. El plan Gratis no vence."
      />

      <p className="mx-auto mt-8 max-w-[60ch] px-5 text-center text-[13.5px] text-white/50">
        Sirven para tu tienda y para la página de tu negocio. Enlaces para tu bio: próximamente, sin precio definido.
      </p>

      <TablaPrecios />

      <ComparativaPlanes />

      <Preguntas titulo="Lo que más nos preguntan sobre los planes" preguntas={preguntasPrecios.length ? preguntasPrecios : PREGUNTAS} />

      <LlamadoFinal />
    </>
  )
}
