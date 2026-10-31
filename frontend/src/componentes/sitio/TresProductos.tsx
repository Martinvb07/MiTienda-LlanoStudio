'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { moverLuz } from './Caracteristicas'
import { MaquetaEnlaces } from './Maquetas'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'
import { PRODUCTOS } from './productos'

const [TIENDA, PAGINA, ENLACES] = PRODUCTOS as [(typeof PRODUCTOS)[number], (typeof PRODUCTOS)[number], (typeof PRODUCTOS)[number]]

function Estado({ disponible }: { disponible: boolean }) {
  return (
    <span className="estado estado-chico" data-tono={disponible ? 'verde' : 'azul'}>
      <span className="estado-punto" data-vivo={disponible ? '' : undefined} />
      {disponible ? 'Disponible hoy' : 'Próximamente'}
    </span>
  )
}

/** Captura real de una página armada con la plantilla de consultorio. */
function CapturaPagina() {
  return (
    <div className="absolute inset-x-7 top-0 -bottom-6 overflow-hidden rounded-t-[8px] bg-black shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2 md:inset-x-8">
      <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-sitio-elevado px-3">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="ml-3 truncate font-mono text-[10px] text-white/40">morichal-abogados.llanostudio.co</span>
      </div>
      <Image src="/ejemplos/morichal-abogados-completa.webp" alt="" width={1100} height={2456} sizes="(max-width: 768px) 90vw, 45vw" className="h-auto w-full" />
    </div>
  )
}

/** Lo que trae cada uno, en una línea bajo su resumen. */
const PUNTOS: Record<'pagina' | 'enlaces', string[]> = {
  pagina: ['Servicios y horario', 'Agendar por WhatsApp', 'Tu equipo', 'Cómo llegar'],
  enlaces: ['Botones a todo', 'Tus redes', 'Código QR', 'Tu color'],
}

/**
 * Las tres formas de usar Mi Sitio. La tienda ocupa todo el ancho; la página
 * se muestra con una captura real y los enlaces con una maqueta que no finge
 * ser captura.
 */
export function TresProductos() {
  return (
    <section id="productos" className="py-[72px] md:py-[112px]">
      <Contenedor>
        <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <span className="antetitulo mb-[22px]">Una cuenta, tres productos</span>
            <h2 className="titulo-2 max-w-[14ch]">Empieza por uno. Suma los otros cuando quieras.</h2>
          </div>
          <p className="bajada md:justify-self-end">
            Vende con la tienda, preséntate con la página y junta todo en el link de tu bio. Mismo panel, misma
            dirección, sin abrir otra cuenta.
          </p>
        </Revelar>

        {/* Tienda: la protagonista */}
        <Revelar>
          <Link
            href={TIENDA.href}
            onPointerMove={moverLuz}
            className="baldosa foco group grid overflow-hidden md:min-h-[480px] md:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="relative z-10 flex flex-col p-7 md:p-10">
              <Estado disponible />
              <h3 className="titulo-3 mt-6">{TIENDA.nombre}</h3>
              <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-white/60">
                {TIENDA.resumen}
              </p>
              <ul className="mt-7 grid grid-cols-2 gap-x-6 border-b border-white/10 text-[13.5px] text-white/70">
                {['Editor en vivo', 'Lienzo libre', 'Plantillas pro', 'Dominio propio'].map((punto) => (
                  <li key={punto} className="border-t border-white/10 py-3">
                    {punto}
                  </li>
                ))}
              </ul>
              <span className="enlace-flecha mt-8 md:mt-auto md:pt-8">
                Conocer la tienda
                <ArrowUpRight aria-hidden="true" />
              </span>
            </div>

            <div className="relative min-h-[300px] md:min-h-0">
              <div className="absolute top-8 left-7 w-[125%] overflow-hidden rounded-[8px] bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2 md:top-10 md:left-0">
                <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-sitio-elevado px-3">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="ml-3 font-mono text-[10px] text-white/40">mercado-la-sabana.llanostudio.co</span>
                </div>
                <Image
                  src="/ejemplos/mercado-la-sabana.webp"
                  alt="Tienda de ejemplo Mercado La Sabana hecha con Mi Sitio"
                  width={1440}
                  height={900}
                  sizes="(max-width: 768px) 110vw, 60vw"
                  className="h-auto w-full"
                />
              </div>
              <div className="absolute right-6 bottom-0 hidden w-[150px] overflow-hidden rounded-t-[22px] border-[5px] border-b-0 border-sitio-elevado bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-3 lg:block">
                <Image src="/ejemplos/mercado-la-sabana-movil.webp" alt="" width={560} height={1212} sizes="150px" className="h-auto w-full" />
              </div>
            </div>
          </Link>
        </Revelar>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TarjetaProducto producto={PAGINA} puntos={PUNTOS.pagina} retardo={0}>
            <CapturaPagina />
          </TarjetaProducto>
          <TarjetaProducto producto={ENLACES} puntos={PUNTOS.enlaces} retardo={0.08}>
            <MaquetaEnlaces />
          </TarjetaProducto>
        </div>
      </Contenedor>
    </section>
  )
}

function TarjetaProducto({
  producto,
  puntos,
  retardo,
  children,
}: {
  producto: (typeof PRODUCTOS)[number]
  puntos: string[]
  retardo: number
  children: React.ReactNode
}) {
  return (
    <Revelar retardo={retardo}>
      <Link href={producto.href} onPointerMove={moverLuz} className="baldosa foco group flex h-[520px] flex-col overflow-hidden">
        <div className="relative z-10 p-7 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <Estado disponible={producto.disponible} />
            <ArrowUpRight
              aria-hidden="true"
              strokeWidth={1.4}
              className="h-5 w-5 text-white/30 transition-[transform,color] duration-700 ease-salida group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
            />
          </div>
          <h3 className="mt-5 text-[22px] tracking-[-0.03em] text-white">{producto.nombre}</h3>
          <p className="mt-1.5 max-w-[40ch] text-[14px] leading-relaxed text-white/55">
            {producto.resumen}
          </p>
          <p className="mt-4 text-[12px] tracking-[0.02em] text-white/40">{puntos.join(' · ')}</p>
        </div>
        <div aria-hidden="true" className="relative flex-1">
          {children}
        </div>
      </Link>
    </Revelar>
  )
}
