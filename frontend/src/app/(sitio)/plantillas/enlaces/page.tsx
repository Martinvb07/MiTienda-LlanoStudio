import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { GaleriaPlantillas } from '@/componentes/sitio/GaleriaPlantillas'
import { SelectorProducto } from '@/componentes/sitio/SelectorProducto'
import { MENU_PLANTILLAS } from '@/componentes/sitio/productos'
import { PLANTILLAS_ENLACES } from '@/utilidades/plantillasEnlaces'

export const metadata: Metadata = {
  title: 'Plantillas de enlaces para tu bio',
  description:
    'Plantillas de enlaces para la bio de Instagram y TikTok: creadores, artistas, emprendimientos, restaurantes y más. Editables sin código.',
  alternates: { canonical: '/plantillas/enlaces' },
}

export default function PaginaPlantillasEnlaces() {
  return (
    <>
      <CabeceraPagina
        rotulo="Plantillas"
        titulo="Listas para hacer tuyas"
        descripcion={`${PLANTILLAS_ENLACES.length} diseños para tu link de la bio.`}
      >
        <SelectorProducto opciones={MENU_PLANTILLAS} actual="enlaces" />
      </CabeceraPagina>

      <section className="pt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <span className="antetitulo mb-[22px]">Enlaces para tu bio</span>
              <h2 className="titulo-2 max-w-[14ch]">Todo lo tuyo en un link</h2>
            </div>
            <p className="bajada md:justify-self-end">Perfil, botones y tus redes.</p>
          </Revelar>
          <GaleriaPlantillas tipo="enlaces" />
        </Contenedor>
      </section>

      <LlamadoFinal
        titulo="Tu link de la bio, listo hoy"
        hrefEmpezar="/panel/crear-cuenta?producto=enlaces"
        hrefPlantillas="/precios/enlaces"
        textoPlantillas="Ver precios"
      />
    </>
  )
}
