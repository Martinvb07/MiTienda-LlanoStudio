import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'

interface Props {
  rotulo: string
  titulo: string
  descripcion?: string
  children?: React.ReactNode
}

/**
 * Encabezado común de las páginas interiores.
 *
 * Repite la trama de puntos del hero para que al salir de la portada se note
 * que se sigue en el mismo sitio, pero con menos altura: aquí lo que importa
 * es el contenido que viene debajo.
 */
export function CabeceraPagina({ rotulo, titulo, descripcion, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-sitio-borde">
      <div
        aria-hidden="true"
        className="trama-puntos pointer-events-none absolute inset-0 text-sitio-borde-fuerte [mask-image:radial-gradient(60%_70%_at_50%_0%,black,transparent)]"
      />

      <Contenedor className="relative py-16 lg:py-20">
        <Revelar className="max-w-3xl">
          <Rotulo indice="—">{rotulo}</Rotulo>

          <h1 className="mt-5 font-display text-4xl leading-[1.06] font-bold tracking-[-0.035em] text-balance text-sitio-tinta sm:text-5xl lg:text-[3.5rem]">
            {titulo}
          </h1>

          {descripcion && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-sitio-suave">
              {descripcion}
            </p>
          )}

          {children && <div className="mt-8">{children}</div>}
        </Revelar>
      </Contenedor>
    </section>
  )
}
