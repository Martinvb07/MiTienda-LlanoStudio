'use client'

import { useState } from 'react'
import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { GaleriaPlantillas } from './GaleriaPlantillas'
import { MENU_PLANTILLAS, type OpcionMenu } from './productos'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'
import { PLANTILLAS_ENLACES } from '@/utilidades/plantillasEnlaces'
import { PLANTILLAS_PAGINA } from '@/utilidades/plantillasPagina'

/** En el celular no caben los nombres completos. */
const CORTOS: Record<OpcionMenu['clave'], string> = { tienda: 'Tienda', pagina: 'Página', enlaces: 'Enlaces' }

const TEXTOS: Record<OpcionMenu['clave'], { titulo: string; texto: string }> = {
  tienda: {
    titulo: 'Empieza con una tienda que ya vende',
    texto: `${PLANTILLAS_TIENDA.length} tiendas de ejemplo, cuatro de ellas pro. Abre una para verla completa.`,
  },
  pagina: {
    titulo: 'Una página hecha para tu oficio',
    texto: `${PLANTILLAS_PAGINA.length} páginas por oficio: abogados, salud, comida, belleza y más.`,
  },
  enlaces: {
    titulo: 'Un link de la bio con tu estilo',
    texto: `${PLANTILLAS_ENLACES.length} plantillas para creadores, artistas y negocios que viven en redes.`,
  },
}

/**
 * Adelanto en la portada: tres plantillas con su captura real, con pestañas
 * para ver las de la tienda, la página o los enlaces sin salir del inicio.
 */
export function Plantillas() {
  const [actual, setActual] = useState<OpcionMenu['clave']>('tienda')
  const opcion = MENU_PLANTILLAS.find((otra) => otra.clave === actual)!

  return (
    <section id="plantillas" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="antetitulo mb-[22px]">Plantillas</span>
            <h2 className="titulo-2 max-w-[13ch]">{TEXTOS[actual].titulo}</h2>
          </div>
          <div className="md:max-w-[34ch]">
            <p className="bajada">{TEXTOS[actual].texto}</p>
            <Boton href={opcion.href} variante="secundario" tamano="normal" flecha className="mt-6">
              Ver todas
            </Boton>
          </div>
        </Revelar>

        <Revelar className="mb-10">
          <div role="tablist" aria-label="Producto" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/12 bg-white/[0.03] p-1">
            {MENU_PLANTILLAS.map((otra) => {
              const elegido = otra.clave === actual
              return (
                <button
                  key={otra.clave}
                  type="button"
                  role="tab"
                  aria-selected={elegido}
                  onClick={() => setActual(otra.clave)}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[13px] tracking-[-0.005em] transition-colors duration-300 sm:px-4',
                    elegido ? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.06] hover:text-white',
                  )}
                >
                  <otra.icono aria-hidden="true" strokeWidth={1.6} className="h-[15px] w-[15px] shrink-0" />
                  <span className="whitespace-nowrap sm:hidden">{CORTOS[otra.clave]}</span>
                  <span className="hidden whitespace-nowrap sm:inline">{otra.nombre}</span>
                </button>
              )
            })}
          </div>
        </Revelar>

        {/* La key vuelve a montar la galería, así cada pestaña entra con su animación. */}
        <GaleriaPlantillas key={actual} limite={3} tipo={actual} pro={actual === 'tienda' ? true : undefined} />
      </Contenedor>
    </section>
  )
}
