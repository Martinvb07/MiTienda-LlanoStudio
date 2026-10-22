import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { ComparativaPlanes } from '@/componentes/sitio/ComparativaPlanes'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { TablaPrecios } from '@/componentes/sitio/TablaPrecios'

export const metadata: Metadata = {
  title: 'Precios',
  description:
    'Planes desde $0 para vender en línea en Colombia. Empieza gratis y pasa a un plan pago cuando tu tienda lo pida.',
}

const PREGUNTAS = [
  {
    pregunta: '¿Necesito tarjeta de crédito para empezar?',
    respuesta:
      'No. El plan Gratis no pide datos de pago: creas tu cuenta, armas la tienda y la publicas. Sólo se te piden si decides pasar a un plan pago.',
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
      'La conexión sí, desde el plan Emprende. La compra del dominio se hace aparte, con el proveedor que prefieras, y nosotros te indicamos qué apuntar.',
  },
  {
    pregunta: '¿Cobran comisión por cada venta?',
    respuesta:
      'No cobramos comisión sobre tus ventas. Lo que sí aplica son las tarifas de la pasarela de pago que elijas, que cobra Wompi o PSE directamente y no pasan por nosotros.',
  },
  {
    pregunta: '¿Qué pasa con mi tienda si dejo de pagar?',
    respuesta:
      'La tienda deja de estar publicada, pero tus datos no se borran. Puedes reactivarla volviendo a un plan pago o quedarte en el plan Gratis con sus límites.',
  },
]

export default function PaginaPrecios() {
  return (
    <>
      <CabeceraPagina
        rotulo="Precios"
        titulo="Empieza gratis. Paga cuando tu tienda lo pida."
        descripcion="Sin comisiones sobre tus ventas y sin permanencia. El plan Gratis no vence: si te alcanza, te puedes quedar ahí."
      />

      <TablaPrecios />

      <ComparativaPlanes />

      <Preguntas titulo="Lo que más nos preguntan sobre los planes" preguntas={PREGUNTAS} />

      <LlamadoFinal />
    </>
  )
}
