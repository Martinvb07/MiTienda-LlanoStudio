import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { GaleriaPlantillas } from '@/componentes/sitio/GaleriaPlantillas'
import { SelectorProducto } from '@/componentes/sitio/SelectorProducto'
import { MENU_PLANTILLAS } from '@/componentes/sitio/productos'
import { PLANTILLAS_PAGINA } from '@/utilidades/plantillasPagina'

export const metadata: Metadata = {
  title: 'Plantillas para tu negocio',
  description:
    'Plantillas de página por oficio: gimnasios, barberías, spas, veterinarias, psicólogos, contadores, inmobiliarias, talleres, hoteles y más. Servicios, equipo, horario y contacto por WhatsApp, editables sin código.',
  alternates: { canonical: '/plantillas/pagina' },
}

export default function PaginaPlantillasNegocio() {
  return (
    <>
      <CabeceraPagina
        rotulo="Plantillas"
        titulo="Listas para hacer tuyas"
        descripcion={`${PLANTILLAS_PAGINA.length} diseños por oficio para la página de tu negocio.`}
      >
        <SelectorProducto opciones={MENU_PLANTILLAS} actual="pagina" />
      </CabeceraPagina>

      <section className="pt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <span className="antetitulo mb-[22px]">Página para tu negocio</span>
              <h2 className="titulo-2 max-w-[14ch]">Sin carrito, con tu WhatsApp</h2>
            </div>
            <p className="bajada md:justify-self-end">Servicios, equipo, horario y contacto.</p>
          </Revelar>
          <GaleriaPlantillas tipo="pagina" />
        </Contenedor>
      </section>

      <LlamadoFinal
        titulo="Tu negocio en internet, hoy"
        hrefEmpezar="/panel/crear-cuenta?producto=pagina"
        hrefPlantillas="/precios/pagina"
        textoPlantillas="Ver precios"
      />
    </>
  )
}
