/* eslint-disable @next/next/no-img-element -- fotos que pega el admin */
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'

interface Testimonio {
  nombre: string
  tienda: string
  texto: string
  foto?: string
}

/** Lo que dicen las tiendas, editado desde el admin. Sin testimonios no se muestra. */
export function Testimonios({ testimonios }: { testimonios: Testimonio[] }) {
  if (testimonios.length === 0) return null
  return (
    <section className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar>
          <span className="antetitulo mb-[22px]">Tiendas reales</span>
          <h2 className="titulo-2 max-w-[16ch]">Lo que dicen quienes ya venden</h2>
        </Revelar>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[8px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {testimonios.map((testimonio, indice) => (
            <Revelar key={`${testimonio.nombre}-${indice}`} retardo={Math.min(indice, 5) * 0.06} className="flex flex-col bg-black p-8">
              <p className="flex-1 text-[17px] leading-relaxed tracking-[-0.01em] text-white/85">“{testimonio.texto}”</p>
              <div className="mt-8 flex items-center gap-3">
                {testimonio.foto ? (
                  <img src={testimonio.foto} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
                    {testimonio.nombre.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="block text-[14px]">{testimonio.nombre}</span>
                  <span className="text-[12.5px] text-white/50">{testimonio.tienda}</span>
                </span>
              </div>
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
