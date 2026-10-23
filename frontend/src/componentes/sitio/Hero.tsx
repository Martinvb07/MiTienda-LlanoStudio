'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Boton } from './Boton'
import { PLANTILLAS_TIENDA } from '@/utilidades/plantillas'

const SALIDA = [0.16, 1, 0.3, 1] as const

/** Tiendas de la vitrina: la del centro y las que se abren a los lados. */
const VITRINA = [
  { src: '/ejemplos/casa-morichal.webp', alt: 'Tienda de ejemplo Casa Morichal', lado: -1, tipo: 'escritorio' },
  { src: '/ejemplos/orbita.webp', alt: 'Tienda de ejemplo Órbita', lado: 1, tipo: 'escritorio' },
  { src: '/ejemplos/paso-urbano-movil.webp', alt: 'Tienda de ejemplo Paso Urbano en celular', lado: -2, tipo: 'movil' },
  { src: '/ejemplos/barro-vivo-movil.webp', alt: 'Tienda de ejemplo Barro Vivo en celular', lado: 2, tipo: 'movil' },
] as const

const CIFRAS = [
  { valor: String(PLANTILLAS_TIENDA.length), etiqueta: 'plantillas listas' },
  { valor: '0', etiqueta: 'líneas de código' },
  { valor: '0%', etiqueta: 'de comisión por venta' },
]

/**
 * Portada como la de llanostudio.co: titular enorme, un botón, y una vitrina
 * de tiendas reales hechas con Mi Sitio que se abre al bajar. La tienda es lo
 * que ya está; la página y los enlaces se nombran como lo que viene.
 */
export function Hero() {
  const zona = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: zona, offset: ['start end', 'end start'] })

  return (
    <section className="relative overflow-hidden pt-[150px] md:pt-[190px]">
      <div className="entrada flex flex-col items-center px-5 text-center">
        <span className="antetitulo mb-[22px]">Mi Sitio, de Llano Studio</span>
        <h1 className="titulo-1">
          Todo tu negocio,
          <br />
          en un solo sitio
        </h1>
        <p className="bajada mx-auto mt-[22px] hidden !text-base md:block">
          Tu tienda, tu página y tus enlaces. Una cuenta, una dirección.
        </p>
        <div className="mt-[30px] flex w-full max-w-[400px] justify-center gap-3 md:mt-[34px] md:w-auto md:max-w-none">
          <Boton href="/panel/crear-cuenta" flecha className="w-full md:w-auto">
            Empezar gratis
          </Boton>
          <Boton href="/plantillas" variante="secundario" className="hidden md:inline-flex">
            Ver plantillas
          </Boton>
        </div>
        <p className="mt-5 text-[13px] text-white/45 md:text-xs">Sin tarjeta de crédito · Sin código</p>
      </div>

      <div ref={zona} className="relative mx-auto mt-12 h-[calc(54vw+44px)] max-w-[1400px] [--abrir:31vw] md:mt-24 md:h-[clamp(260px,46vw,620px)] md:[--abrir:22vw]">
        {VITRINA.map((tarjeta, indice) => (
          <TarjetaVitrina key={tarjeta.src} {...tarjeta} progreso={scrollYProgress} orden={indice} />
        ))}

        <motion.figure
          initial={{ opacity: 0, y: 80, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, delay: 0.25, ease: SALIDA }}
          className="absolute top-0 left-1/2 z-10 w-[86vw] -translate-x-1/2 md:w-[min(64vw,880px)] overflow-hidden rounded-[10px] bg-black shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] ring-1 ring-white/10"
        >
          <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-sitio-elevado px-3">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="ml-3 font-mono text-[10px] text-white/40">lana-andina.llanostudio.co</span>
          </div>
          <Image
            src="/ejemplos/lana-andina.webp"
            alt="Tienda de ejemplo Lana Andina hecha con Mi Sitio"
            width={1440}
            height={900}
            priority
            sizes="(max-width: 768px) 86vw, (max-width: 1400px) 64vw, 880px"
            className="h-auto w-full"
          />
        </motion.figure>
      </div>

      <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 px-5 text-center md:mt-24">
        {CIFRAS.map((cifra, indice) => (
          <motion.div
            key={cifra.etiqueta}
            initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: indice * 0.08, ease: SALIDA }}
          >
            <dd className="text-[clamp(32px,4.4vw,56px)] leading-none font-normal tracking-[-0.045em]">
              {cifra.valor}
            </dd>
            <dt className="mt-2 text-xs text-white/45">{cifra.etiqueta}</dt>
          </motion.div>
        ))}
      </dl>
    </section>
  )
}

function TarjetaVitrina({
  src,
  alt,
  lado,
  tipo,
  progreso,
  orden,
}: {
  src: string
  alt: string
  lado: number
  tipo: 'escritorio' | 'movil'
  progreso: MotionValue<number>
  orden: number
}) {
  // Al bajar, las tarjetas de los lados se abren hacia afuera y se inclinan.
  // --abrir (en el contenedor) separa más las de escritorio en celular, para
  // que se asomen por los bordes como en llanostudio.co.
  const separacion = useTransform(progreso, [0.15, 0.6], [0, lado * (tipo === 'movil' ? 3.5 : 6)])
  const giro = useTransform(progreso, [0.15, 0.6], [0, lado * 2.5])
  const x = useTransform(separacion, (valor) =>
    tipo === 'movil' ? `calc(-50% + ${lado * 37}vw + ${valor}vw)` : `calc(-50% + ${lado} * var(--abrir) + ${valor}vw)`,
  )

  return (
    <motion.figure
      initial={{ opacity: 0, y: 100, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.6, delay: 0.4 + orden * 0.08, ease: SALIDA }}
      style={{ x, rotate: giro }}
      className={
        tipo === 'escritorio'
          ? 'absolute top-[7%] left-1/2 w-[62vw] overflow-hidden rounded-[8px] bg-black opacity-70 shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10 md:w-[min(40vw,560px)]'
          : 'absolute top-[12%] left-1/2 hidden w-[min(13vw,190px)] overflow-hidden rounded-[22px] border-[5px] border-sitio-elevado bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] lg:block'
      }
    >
      <Image src={src} alt={alt} width={tipo === 'escritorio' ? 1440 : 560} height={tipo === 'escritorio' ? 900 : 1212} sizes="(max-width: 768px) 62vw, 40vw" className="h-auto w-full brightness-[0.8]" />
    </motion.figure>
  )
}
