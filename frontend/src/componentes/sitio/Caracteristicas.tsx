'use client'

import Image from 'next/image'
import { ArrowUpRight, Banknote, Lock, MapPinned, MessageCircle, ShoppingCart, Star, Users } from 'lucide-react'
import { Contenedor } from './Contenedor'
import { Detalles, type Detalle } from './Detalles'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'

/** La luz que sigue al cursor en las baldosas, igual que en llanostudio.co. */
export function moverLuz(evento: React.PointerEvent<HTMLElement>) {
  const caja = evento.currentTarget.getBoundingClientRect()
  evento.currentTarget.style.setProperty('--mx', `${evento.clientX - caja.left}px`)
  evento.currentTarget.style.setProperty('--my', `${evento.clientY - caja.top}px`)
}

export function Baldosa({
  titulo,
  texto,
  plan,
  ancha = false,
  retardo = 0,
  children,
}: {
  titulo: string
  texto: string
  /** Desde qué plan, dicho en voz baja. */
  plan?: string
  ancha?: boolean
  retardo?: number
  children: React.ReactNode
}) {
  return (
    <Revelar retardo={retardo} className={cn(ancha && 'md:col-span-2')}>
      <article
        onPointerMove={moverLuz}
        className="baldosa foco group relative flex h-[440px] flex-col overflow-hidden"
      >
        <div className="relative z-10 p-7 md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[19px] tracking-[-0.02em] text-white">{titulo}</h3>
            {plan && <span className="shrink-0 text-[10.5px] tracking-[0.14em] text-white/40 uppercase">{plan}</span>}
          </div>
          <p className="mt-1.5 max-w-[40ch] text-[14px] leading-relaxed text-white/55">{texto}</p>
        </div>
        <div className="relative flex-1">{children}</div>
      </article>
    </Revelar>
  )
}

/**
 * Pasarelas que cada tienda conecta con su propia cuenta. Con `logo` (archivo
 * oficial en public/logos) se muestra la marca en blanco; sin él, el nombre.
 */
const PASARELAS: { nombre: string; logo?: string }[] = [{ nombre: 'Wompi' }, { nombre: 'ePayco' }, { nombre: 'Bold' }]

/** Lo que trae la tienda además del mosaico, dicho corto. */
const MAS_TIENDA: Detalle[] = [
  { icono: MapPinned, titulo: 'Envíos por zona', texto: 'Un precio por ciudad o región, y recoger en la tienda sin costo.' },
  { icono: Star, titulo: 'Opiniones con estrellas', texto: 'Tus clientes califican; sale lo que apruebes, con compra verificada.' },
  { icono: ShoppingCart, titulo: 'Carritos abandonados', texto: 'Ves quién no terminó y le escribes por WhatsApp con un toque.' },
  { icono: Users, titulo: 'Tus clientes', texto: 'Quién te compra, cuánto lleva y cuándo volvió, en una lista.' },
]

const OTROS_PAGOS = [
  { nombre: 'WhatsApp', detalle: 'Cierras la venta en el chat', icono: MessageCircle },
  { nombre: 'Contra entrega', detalle: 'Paga al recibir', icono: Banknote },
]

/**
 * La tienda a fondo, en un mosaico con capturas reales como el de servicios de
 * llanostudio.co. Lo que depende del plan lo dice en una línea tenue.
 */
export function Caracteristicas({ rotulo = 'Tienda en línea' }: { rotulo?: string }) {
  return (
    <section id="tienda" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <span className="antetitulo mb-[22px]">{rotulo}</span>
            <h2 className="titulo-2 max-w-[13ch]">Todo para vender, en un solo lugar</h2>
          </div>
          <p className="bajada md:justify-self-end">
            Diseño, catálogo, cobros y pedidos. Sin programador.
          </p>
        </Revelar>

        <div className="grid gap-4 md:grid-cols-3">
          <Baldosa
            ancha
            titulo="Editor visual en vivo"
            texto="Arrastra secciones y cambia letra, colores y botones. Lo ves en vivo."
          >
            <div className="absolute top-0 left-7 w-[115%] overflow-hidden rounded-t-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2 md:left-8">
              <Image src="/ejemplos/editor.webp" alt="Editor de tienda de Mi Sitio" width={1440} height={900} sizes="(max-width: 768px) 120vw, 60vw" className="h-auto w-full" />
            </div>
          </Baldosa>

          <Baldosa
            retardo={0.08}
            plan="Negocio y Pro"
            titulo="Lienzo libre"
            texto="Arrastra y estira títulos, fotos y botones donde quieras."
          >
            <div className="absolute top-0 left-7 w-[150%] overflow-hidden rounded-t-[8px] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-x-6 md:left-8">
              <Image src="/ejemplos/lienzo.webp" alt="Lienzo libre en el editor de Mi Sitio" width={1012} height={632} sizes="(max-width: 768px) 150vw, 45vw" className="h-auto w-full" />
            </div>
          </Baldosa>

          <Baldosa
            retardo={0.04}
            titulo="Comprar se siente bien"
            texto="Agregar en un toque, aviso con foto y la foto que vuela a la bolsa."
          >
            <div className="absolute top-0 left-1/2 w-[200px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border-[6px] border-b-0 border-sitio-elevado transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2">
              <Image src="/ejemplos/compra-aviso.webp" alt="Aviso con foto al agregar un producto a la bolsa" width={560} height={1212} sizes="200px" className="h-auto w-full" />
            </div>
          </Baldosa>

          <Baldosa
            retardo={0.08}
            titulo="Plantillas pro"
            texto="Cuatro tiendas estilo supermercado, listas para llenar."
          >
            <div className="absolute inset-x-7 top-0 bottom-7 overflow-hidden rounded-[8px] ring-1 ring-white/10">
              <Image src="/ejemplos/zona-fit.webp" alt="" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover object-top transition-transform duration-[1.4s] ease-salida group-hover:scale-[1.05]" />
            </div>
          </Baldosa>

          <Baldosa retardo={0.12} titulo="Cobra como cobra Colombia" texto="Tu cuenta de pagos, WhatsApp o contra entrega. Sin comisión.">
            <div className="absolute inset-x-7 top-0 bottom-7 flex flex-col gap-2 md:inset-x-8">
              <div className="grid flex-1 grid-cols-3 gap-2">
                {PASARELAS.map((pasarela) => (
                  <div
                    key={pasarela.nombre}
                    className="grid place-items-center rounded-[8px] border border-white/10 bg-black/30 px-3 transition-colors duration-500 group-hover:border-white/15"
                  >
                    {pasarela.logo ? (
                      <Image
                        src={pasarela.logo}
                        alt={pasarela.nombre}
                        width={120}
                        height={40}
                        className="h-6 w-auto object-contain opacity-80 brightness-0 invert transition-opacity duration-500 group-hover:opacity-100 [html[data-tema=claro]_&]:invert-0"
                      />
                    ) : (
                      <span className="text-[17px] font-semibold tracking-[-0.03em] text-white/80">{pasarela.nombre}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="py-1 text-center text-[11px] tracking-[0.12em] text-white/40 uppercase">Tarjeta, PSE y más, a tu cuenta</p>
              {OTROS_PAGOS.map((pago) => (
                <div key={pago.nombre} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-black/30 px-4 py-3">
                  <pago.icono aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-white/55" />
                  <span className="text-[13.5px] text-white/85">{pago.nombre}</span>
                  <span className="ml-auto truncate text-[11.5px] text-white/40">{pago.detalle}</span>
                </div>
              ))}
            </div>
          </Baldosa>

          <Baldosa retardo={0.04} plan="Negocio y Pro" titulo="Tu propio dominio" texto="Conecta el tuyo, con HTTPS incluido.">
            <div className="absolute inset-x-7 top-0 bottom-7 overflow-hidden rounded-[8px] ring-1 ring-white/10">
              <Image src="/ejemplos/casa-morichal.webp" alt="" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover object-top brightness-75" />
              <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2.5 font-mono text-[12px] whitespace-nowrap backdrop-blur">
                <Lock aria-hidden="true" className="h-3 w-3 text-white/60" />
                www.casamorichal.co
              </div>
            </div>
          </Baldosa>

          <Baldosa retardo={0.08} titulo="Perfecta en el celular" texto="Todas las plantillas se adaptan solas.">
            <div className="absolute top-0 left-1/2 w-[200px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border-[6px] border-b-0 border-sitio-elevado transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2">
              <Image src="/ejemplos/sabana-wear-movil.webp" alt="" width={560} height={1212} sizes="200px" className="h-auto w-full" />
            </div>
          </Baldosa>

          <Baldosa retardo={0.12} titulo="Un panel que se entiende" texto="Pedidos, cupones, estadísticas y tu equipo.">
            <div className="absolute top-0 left-7 w-[180%] overflow-hidden rounded-t-[8px] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-x-6">
              <Image src="/ejemplos/panel-productos.webp" alt="" width={1440} height={900} sizes="60vw" className="h-auto w-full" />
            </div>
          </Baldosa>
        </div>
        <Detalles detalles={MAS_TIENDA} columnas={4} />
      </Contenedor>
    </section>
  )
}

interface Paso {
  titulo: string
  texto: string
}

/** Los pasos de la tienda, que es lo que cuenta la página de características. */
const PASOS: Paso[] = [
  { titulo: 'Crea tu cuenta', texto: 'Dos minutos, sin tarjeta.' },
  { titulo: 'Elige una plantilla', texto: 'Y cámbiala a tu gusto.' },
  { titulo: 'Sube tus productos', texto: 'Fotos, precio y variantes.' },
  { titulo: 'Conecta cómo cobrar', texto: 'Wompi, ePayco, Bold o WhatsApp.' },
  { titulo: 'Publica y comparte', texto: 'Con tu enlace o tu código QR.' },
]

/** Cómo funciona, en filas numeradas como el índice de servicios de llanostudio.co. */
export function ComoFunciona({
  titulo = 'De cero a vender en una tarde',
  pasos = PASOS,
}: {
  titulo?: string
  pasos?: Paso[]
}) {
  return (
    <section className="py-[110px] md:py-[150px]">
      <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Revelar>
          <span className="antetitulo mb-[22px]">Cómo funciona</span>
          <h2 className="titulo-2 max-w-[11ch]">{titulo}</h2>
        </Revelar>
        <Revelar retardo={0.1} className="border-b border-white/12">
          {pasos.map((paso, indice) => (
            <div
              key={paso.titulo}
              className="group grid grid-cols-[56px_1fr_auto] items-center gap-6 border-t border-white/12 py-8 md:grid-cols-[80px_1fr_auto]"
            >
              <span className="font-mono text-[13px] text-white/40">{String(indice + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-[clamp(22px,2.2vw,28px)] tracking-[-0.03em]">{paso.titulo}</h3>
                <p className="mt-1.5 text-[14px] text-white/55">{paso.texto}</p>
              </div>
              <ArrowUpRight
                aria-hidden="true"
                strokeWidth={1.4}
                className="h-5 w-5 text-white/30 transition-[transform,color] duration-700 ease-salida group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
              />
            </div>
          ))}
        </Revelar>
      </Contenedor>
    </section>
  )
}
