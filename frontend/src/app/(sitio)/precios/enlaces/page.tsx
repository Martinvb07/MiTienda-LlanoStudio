import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { ComparativaPlanes } from '@/componentes/sitio/ComparativaPlanes'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Preguntas } from '@/componentes/sitio/Preguntas'
import { TablaPrecios } from '@/componentes/sitio/TablaPrecios'
import { SelectorProducto } from '@/componentes/sitio/SelectorProducto'
import { MENU_PRECIOS } from '@/componentes/sitio/productos'

export const metadata: Metadata = {
  title: 'Precios de los enlaces para tu bio',
  description:
    'Planes de los enlaces para tu bio desde $0: tu WhatsApp, tus redes y tu tienda en un solo link. Mensual o anual, sin permanencia.',
  alternates: { canonical: '/precios/enlaces' },
}

const PREGUNTAS = [
  {
    pregunta: '¿Por qué cuesta tan poco?',
    respuesta:
      'Porque es una sola página corta: tu perfil, tus botones y lo justo para que te escriban. No lleva carrito, catálogo ni pedidos.',
  },
  {
    pregunta: '¿Necesito tarjeta de crédito para empezar?',
    respuesta:
      'No. El plan Gratis no pide datos de pago y no vence. Si pasas a un plan pago, lo pagas desde tu panel con Bold: tarjeta, PSE, Nequi o Botón Bancolombia, mes a mes o por un año con descuento.',
  },
  {
    pregunta: '¿Puedo enlazar mi tienda de Mi Sitio?',
    respuesta: 'Sí, y cualquier otra dirección: tu tienda, tu WhatsApp, un formulario, una guía en PDF o tus redes.',
  },
  {
    pregunta: '¿Qué pasa si bajo de plan con más enlaces de los que permite?',
    respuesta: 'No se borra nada: se muestran los primeros que el plan incluye y los demás vuelven cuando subas otra vez.',
  },
  {
    pregunta: '¿Puedo usar mi propio dominio?',
    respuesta: 'Sí, desde el plan Negocio, con HTTPS incluido. El dominio lo compras aparte, con el proveedor que prefieras.',
  },
]

export default function PaginaPreciosEnlaces() {
  return (
    <>
      <CabeceraPagina
        rotulo="Precios"
        titulo="Tu link de la bio, desde $0."
        descripcion="Mensual o anual, sin permanencia. El plan Gratis no vence."
      >
        <SelectorProducto opciones={MENU_PRECIOS} actual="enlaces" />
      </CabeceraPagina>

      <TablaPrecios tipo="enlaces" />

      <ComparativaPlanes tipo="enlaces" />

      <Preguntas titulo="Lo que más nos preguntan" preguntas={PREGUNTAS} />

      <LlamadoFinal
        titulo="Tu link de la bio, listo hoy"
        hrefEmpezar="/panel/crear-cuenta?producto=enlaces"
        hrefPlantillas="/plantillas/enlaces"
      />
    </>
  )
}
