import { Boton } from './Boton'
import { CabeceraPagina } from './CabeceraPagina'
import { Contenedor } from './Contenedor'
import { LlamadoFinal } from './LlamadoFinal'
import { Revelar } from './Revelar'
import type { ProductoSitio } from './productos'

interface Props {
  producto: ProductoSitio
  titulo: string
  descripcion: string
  /** Maqueta: muestra la idea, no finge ser una captura. */
  maqueta: React.ReactNode
  /** Para quién es, en filas cortas. */
  para: string[]
  /** Lo que ya se puede hacer hoy con Mi Sitio mientras llega. */
  mientras: { titulo: string; texto: string }[]
}

/**
 * Página de un producto que todavía no está: dice qué será y qué se puede hacer
 * hoy, sin prometer fechas ni funciones que no existen.
 */
export function PaginaProxima({ producto, titulo, descripcion, maqueta, para, mientras }: Props) {
  return (
    <>
      <CabeceraPagina rotulo={`${producto.nombre} · Próximamente`} titulo={titulo} descripcion={descripcion}>
        <Boton href={`/panel/crear-cuenta?producto=${producto.clave}`} flecha>
          Reservar mi dirección
        </Boton>
      </CabeceraPagina>

      <section className="pt-20 pb-[110px] md:pt-24 md:pb-[150px]">
        <Contenedor>
          <Revelar>
            <div aria-hidden="true" className="baldosa relative h-[420px] overflow-hidden md:h-[520px]">
              {maqueta}
            </div>
          </Revelar>
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Revelar>
            <span className="antetitulo mb-[22px]">Para quién</span>
            <h2 className="titulo-2 max-w-[11ch]">Pensada para</h2>
          </Revelar>
          <Revelar retardo={0.1} className="border-b border-white/12">
            {para.map((fila, indice) => (
              <div key={fila} className="grid grid-cols-[56px_1fr] items-center gap-6 border-t border-white/12 py-6 md:grid-cols-[80px_1fr]">
                <span className="font-mono text-[13px] text-white/40">{String(indice + 1).padStart(2, '0')}</span>
                <h3 className="text-[clamp(20px,2vw,26px)] tracking-[-0.03em]">{fila}</h3>
              </div>
            ))}
          </Revelar>
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Mientras tanto</span>
            <h2 className="titulo-2 max-w-[14ch]">Lo que ya puedes hacer hoy</h2>
          </Revelar>
          <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {mientras.map((detalle, indice) => (
              <Revelar key={detalle.titulo} retardo={(indice % 3) * 0.08}>
                <div className="border-t border-white/12 py-7">
                  <span className="font-mono text-[12px] text-white/35">{String(indice + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-[19px] tracking-[-0.02em]">{detalle.titulo}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{detalle.texto}</p>
                </div>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>

      <LlamadoFinal titulo="Empieza hoy con tu dirección" texto="Crea tu cuenta y la activas cuando esté lista." />
    </>
  )
}
