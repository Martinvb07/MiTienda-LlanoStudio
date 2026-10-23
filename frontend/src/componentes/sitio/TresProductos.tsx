'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Instagram, MapPin, MessageCircle, ShoppingBag } from 'lucide-react'
import { moverLuz } from './Caracteristicas'
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

/**
 * Las tres formas de usar Mi Sitio. La tienda ocupa todo el ancho porque es lo
 * que ya funciona; la página y los enlaces se muestran como lo que viene, con
 * maquetas que no fingen ser capturas.
 */
export function TresProductos() {
  return (
    <section id="productos" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <span className="antetitulo mb-[22px]">Una cuenta, tres productos</span>
            <h2 className="titulo-2 max-w-[14ch]">Empieza por uno. Suma los otros cuando quieras.</h2>
          </div>
          <p className="bajada md:justify-self-end">
            Mismo panel, misma dirección. Sin abrir otra cuenta.
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
          <TarjetaProxima producto={PAGINA} retardo={0}>
            <MaquetaPagina />
          </TarjetaProxima>
          <TarjetaProxima producto={ENLACES} retardo={0.08}>
            <MaquetaEnlaces />
          </TarjetaProxima>
        </div>
      </Contenedor>
    </section>
  )
}

function TarjetaProxima({
  producto,
  retardo,
  children,
}: {
  producto: (typeof PRODUCTOS)[number]
  retardo: number
  children: React.ReactNode
}) {
  return (
    <Revelar retardo={retardo}>
      <Link href={producto.href} onPointerMove={moverLuz} className="baldosa foco group flex h-[480px] flex-col overflow-hidden">
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
        </div>
        <div aria-hidden="true" className="relative flex-1">
          {children}
        </div>
      </Link>
    </Revelar>
  )
}

/** Línea de texto de maqueta: sólo forma, sin palabras inventadas. */
const Linea = ({ ancho, className = '' }: { ancho: string; className?: string }) => (
  <span className={`block h-2 rounded-full bg-white/12 ${className}`} style={{ width: ancho }} />
)

/** Maqueta de la página informativa: portada con foto, servicios y contacto. */
export function MaquetaPagina() {
  return (
    <div className="absolute inset-x-7 top-0 -bottom-6 overflow-hidden rounded-t-[8px] bg-black ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2 md:inset-x-8">
      <div className="relative h-[46%]">
        <Image src="/fotos/casa-historia.webp" alt="" fill sizes="(max-width: 768px) 90vw, 40vw" className="object-cover opacity-55" />
        <div className="absolute bottom-5 left-5 space-y-2.5">
          <Linea ancho="150px" className="!h-3 !bg-white/80" />
          <Linea ancho="110px" className="!bg-white/40" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 p-5">
        {[0, 1, 2].map((indice) => (
          <div key={indice} className="space-y-2 rounded-[6px] border border-white/10 p-3">
            <span className="block h-5 w-5 rounded-[4px] bg-white/10" />
            <Linea ancho="80%" />
            <Linea ancho="55%" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-5">
        <MapPin className="h-3.5 w-3.5 text-white/30" />
        <Linea ancho="40%" />
        <span className="ml-auto h-7 w-24 rounded-full bg-white/80" />
      </div>
    </div>
  )
}

/** Maqueta de la página de enlaces: un celular con botones apilados. */
export function MaquetaEnlaces() {
  const botones = [ShoppingBag, MessageCircle, MapPin, Instagram]
  return (
    <div className="absolute top-0 left-1/2 w-[210px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border-[6px] border-b-0 border-sitio-elevado bg-black px-5 pt-8 pb-10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2">
      <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-full ring-1 ring-white/15">
        <Image src="/fotos/lana-hero.webp" alt="" fill sizes="56px" className="object-cover" />
      </div>
      <div className="mt-3.5 flex flex-col items-center gap-2">
        <Linea ancho="96px" className="!bg-white/70" />
        <Linea ancho="128px" />
      </div>
      <div className="mt-6 space-y-2.5">
        {botones.map((Icono, indice) => (
          <div key={indice} className="flex h-10 items-center gap-3 rounded-full border border-white/12 px-4">
            <Icono className="h-3.5 w-3.5 text-white/50" />
            <Linea ancho={`${60 - indice * 8}%`} />
          </div>
        ))}
      </div>
    </div>
  )
}
