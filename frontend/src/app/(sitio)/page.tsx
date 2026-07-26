import { Caracteristicas } from '@/componentes/sitio/Caracteristicas'
import { Hero } from '@/componentes/sitio/Hero'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Marquesina } from '@/componentes/sitio/Marquesina'
import { Plantillas } from '@/componentes/sitio/Plantillas'
import { Testimonios } from '@/componentes/sitio/Testimonios'

/**
 * Portada de Llano Studio.
 *
 * El recorrido alterna fondo blanco y crema para marcar el ritmo entre
 * secciones sin recurrir a líneas separadoras en cada corte.
 */
export default function PaginaInicio() {
  return (
    <>
      <Hero />
      <Marquesina />
      <Caracteristicas />
      <Plantillas />
      <Testimonios />
      <LlamadoFinal />
    </>
  )
}
