'use client'

import Image from 'next/image'
import { ArrowUpRight, Lock } from 'lucide-react'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'

/** La luz que sigue al cursor en las baldosas, igual que en llanostudio.co. */
function moverLuz(evento: React.PointerEvent<HTMLElement>) {
  const caja = evento.currentTarget.getBoundingClientRect()
  evento.currentTarget.style.setProperty('--mx', `${evento.clientX - caja.left}px`)
  evento.currentTarget.style.setProperty('--my', `${evento.clientY - caja.top}px`)
}

function Baldosa({
  titulo,
  texto,
  ancha = false,
  retardo = 0,
  children,
}: {
  titulo: string
  texto: string
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
          <h3 className="text-[19px] tracking-[-0.02em] text-white">{titulo}</h3>
          <p className="mt-1.5 max-w-[38ch] text-[14px] leading-relaxed text-white/55">{texto}</p>
        </div>
        <div className="relative flex-1">{children}</div>
      </article>
    </Revelar>
  )
}

/** Funciones del producto en un mosaico con imágenes reales, como el de servicios de llanostudio.co. */
export function Caracteristicas() {
  return (
    <section id="producto" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <span className="antetitulo mb-[22px]">Producto</span>
            <h2 className="titulo-2 max-w-[13ch]">Todo para vender, en un solo lugar</h2>
          </div>
          <p className="bajada md:justify-self-end">
            Diseño, catálogo, dirección propia y panel. Lo que antes le pedías a un programador, ahora lo
            haces tú en una tarde.
          </p>
        </Revelar>

        <div className="grid gap-4 md:grid-cols-3">
          <Baldosa
            ancha
            titulo="Editor visual en vivo"
            texto="Arrastra secciones, cambia textos, colores y fotos, y mira tu tienda real actualizándose mientras editas."
          >
            <div className="absolute top-0 left-7 w-[115%] overflow-hidden rounded-t-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2 md:left-8">
              <Image src="/ejemplos/editor.webp" alt="Editor de tienda de Mi Sitio" width={1440} height={900} sizes="(max-width: 768px) 120vw, 60vw" className="h-auto w-full" />
            </div>
          </Baldosa>

          <Baldosa retardo={0.08} titulo="Catálogo con fotos" texto="Precio, precio antes, fotos e inventario. Las imágenes se optimizan solas.">
            <div className="absolute inset-x-7 top-0 bottom-7 overflow-hidden rounded-[8px]">
              <Image src="/fotos/lana-2.webp" alt="" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover transition-transform duration-[1.4s] ease-salida group-hover:scale-[1.05]" />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[6px] bg-white/90 px-3 py-2.5 text-black backdrop-blur">
                <span>
                  <span className="block text-[12px]">Suéter Páramo</span>
                  <span className="block text-[13px] font-medium">
                    $ 279.000 <s className="ml-1 text-[11px] font-normal text-black/40">$ 329.000</s>
                  </span>
                </span>
                <span className="rounded-[4px] bg-black px-2.5 py-1.5 text-[10.5px] text-white">Agregar</span>
              </div>
            </div>
          </Baldosa>

          <Baldosa retardo={0.04} titulo="Perfecta en el celular" texto="Así compra la mayoría de tus clientes. Todas las plantillas se adaptan solas.">
            <div className="absolute top-0 left-1/2 w-[200px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border-[6px] border-b-0 border-sitio-elevado transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2">
              <Image src="/ejemplos/orbita-movil.webp" alt="" width={560} height={1212} sizes="200px" className="h-auto w-full" />
            </div>
          </Baldosa>

          <Baldosa retardo={0.08} titulo="Tu propia dirección" texto="Tu tienda vive en tunegocio.llanostudio.co desde el primer día.">
            <div className="absolute inset-x-7 top-0 bottom-7 overflow-hidden rounded-[8px] ring-1 ring-white/10">
              <Image src="/ejemplos/casa-morichal.webp" alt="" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover object-top brightness-75" />
              <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2.5 font-mono text-[12px] whitespace-nowrap backdrop-blur">
                <Lock aria-hidden="true" className="h-3 w-3 text-white/60" />
                casa-morichal.llanostudio.co
              </div>
            </div>
          </Baldosa>

          <Baldosa retardo={0.12} titulo="Panel simple" texto="Productos, diseño y publicación en un panel que se entiende sin manual.">
            <div className="absolute top-0 left-7 w-[180%] overflow-hidden rounded-t-[8px] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-x-6">
              <Image src="/ejemplos/panel-productos.webp" alt="" width={1440} height={900} sizes="60vw" className="h-auto w-full" />
            </div>
          </Baldosa>
        </div>
      </Contenedor>
    </section>
  )
}

const PASOS = [
  { titulo: 'Crea tu cuenta', texto: 'Tu nombre, tu correo y la dirección de tu tienda. Dos minutos.' },
  { titulo: 'Elige una plantilla', texto: 'Diez diseños listos por rubro, del catálogo sencillo al supermercado en línea. Cambia colores, letra y textos a tu gusto.' },
  { titulo: 'Sube tus productos', texto: 'Arrastra las fotos, pon el precio y el inventario. Se ven al instante.' },
  { titulo: 'Publica y comparte', texto: 'Actívala con un clic y comparte tu dirección por WhatsApp e Instagram.' },
]

/** Cómo funciona, en filas numeradas como el índice de servicios de llanostudio.co. */
export function ComoFunciona() {
  return (
    <section className="py-[110px] md:py-[150px]">
      <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Revelar>
          <span className="antetitulo mb-[22px]">Cómo funciona</span>
          <h2 className="titulo-2 max-w-[11ch]">De cero a vender en una tarde</h2>
        </Revelar>
        <Revelar retardo={0.1} className="border-b border-white/12">
          {PASOS.map((paso, indice) => (
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
