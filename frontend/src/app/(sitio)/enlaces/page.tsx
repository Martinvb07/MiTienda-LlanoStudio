import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, BarChart3, Globe, Link2, MessageCircle, Palette, QrCode, type LucideIcon } from 'lucide-react'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { PLANTILLAS_ENLACES } from '@/utilidades/plantillasEnlaces'

export const metadata: Metadata = {
  title: 'Enlaces para tu bio',
  description:
    'Un solo enlace para la bio de Instagram o TikTok: tu WhatsApp, tus redes, tu tienda y lo que quieras, en una página corta con tu color. Gratis para empezar.',
  alternates: { canonical: '/enlaces' },
}

/** Lo que de verdad trae hoy. Lo que depende del plan lo dice en voz baja. */
const DETALLES: { icono: LucideIcon; titulo: string; texto: string; plan?: string }[] = [
  { icono: Link2, titulo: 'Botones a todo', texto: 'WhatsApp, redes, tu tienda, una guía o un formulario.' },
  { icono: MessageCircle, titulo: 'Escribe @usuario o el número', texto: 'Armamos el enlace solos; sin copiar direcciones largas.' },
  { icono: Palette, titulo: 'Tu color y tu letra', texto: 'Fondo degradado o de malla, botones redondos o rectos.', plan: 'Desde Emprende' },
  { icono: QrCode, titulo: 'Código QR', texto: 'Para el mostrador, las bolsas o tu tarjeta.' },
  { icono: BarChart3, titulo: 'Visitas', texto: 'Cuánta gente entra desde tu bio.' },
  { icono: Globe, titulo: 'Tu dominio', texto: 'links.tumarca.co, con HTTPS.', plan: 'Negocio y Pro' },
]

/** Tres capturas reales, en abanico. */
const MUESTRA = ['dulce-antojo', 'yuli-ariza', 'coach-mateo'] as const

export default function PaginaEnlaces() {
  return (
    <>
      <CabeceraPagina
        rotulo="Enlaces para tu bio"
        titulo="Un solo enlace para tu bio"
        descripcion="Tu WhatsApp, tus redes y tu tienda en una página corta, con tu color."
      >
        <Boton href="/panel/crear-cuenta?producto=enlaces" flecha>
          Crear mis enlaces
        </Boton>
        <Boton href="/plantillas/enlaces" variante="secundario">
          Ver plantillas
        </Boton>
      </CabeceraPagina>

      {/* Capturas reales de enlaces armados con las plantillas */}
      <section className="pt-20 pb-[110px] md:pt-24 md:pb-[150px]">
        <Contenedor>
          <Revelar>
            <div className="baldosa relative flex h-[460px] items-end justify-center overflow-hidden md:h-[560px]">
              {MUESTRA.map((ejemplo, indice) => {
                const centro = indice === 1
                return (
                  <div
                    key={ejemplo}
                    className={`relative -mx-6 w-[190px] shrink-0 overflow-hidden rounded-t-[30px] border-[7px] border-b-0 border-sitio-elevado bg-black shadow-[0_40px_100px_-30px_rgba(0,0,0,1)] transition-transform duration-700 ease-salida md:-mx-4 md:w-[250px] ${
                      centro ? 'z-10 mb-0' : `mb-[-40px] hidden opacity-90 sm:block ${indice === 0 ? '-rotate-6' : 'rotate-6'}`
                    }`}
                  >
                    <Image
                      src={`/ejemplos/${ejemplo}-movil.webp`}
                      alt={centro ? 'Enlaces de ejemplo de Yuli Ariza hechos con Mi Sitio' : ''}
                      width={560}
                      height={1212}
                      sizes="250px"
                      className="h-auto w-full"
                      priority={centro}
                    />
                  </div>
                )
              })}
            </div>
          </Revelar>
        </Contenedor>
      </section>

      {/* Para quién: cada fila lleva a las plantillas */}
      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Revelar>
            <span className="antetitulo mb-[22px]">Para quién</span>
            <h2 className="titulo-2 max-w-[11ch]">Para quien vive en redes</h2>
          </Revelar>
          <Revelar retardo={0.1} className="border-b border-white/12">
            {PLANTILLAS_ENLACES.map((plantilla, indice) => (
              <Link
                key={plantilla.clave}
                href="/plantillas/enlaces"
                className="group grid grid-cols-[56px_1fr_auto] items-center gap-6 border-t border-white/12 py-6 md:grid-cols-[80px_1fr_auto]"
              >
                <span className="font-mono text-[13px] text-white/40">{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[clamp(20px,2vw,26px)] tracking-[-0.03em]">{plantilla.categoria}</h3>
                  <p className="mt-1 text-[13.5px] text-white/45">Ejemplo: {plantilla.ejemplo}</p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  strokeWidth={1.4}
                  className="h-5 w-5 text-white/30 transition-[transform,color] duration-700 ease-salida group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
                />
              </Link>
            ))}
          </Revelar>
        </Contenedor>
      </section>

      {/* Qué trae */}
      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <span className="antetitulo mb-[22px]">Qué trae</span>
              <h2 className="titulo-2 max-w-[13ch]">Lo justo para que te encuentren</h2>
            </div>
            <p className="bajada md:justify-self-end">Gratis para empezar.</p>
          </Revelar>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DETALLES.map((detalle, indice) => (
              <Revelar key={detalle.titulo} retardo={(indice % 3) * 0.06}>
                <article className="baldosa flex h-full flex-col gap-5 p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/12 text-sitio-azul-claro">
                      <detalle.icono aria-hidden="true" strokeWidth={1.5} className="h-[18px] w-[18px]" />
                    </span>
                    {detalle.plan && (
                      <span className="text-[10.5px] tracking-[0.14em] text-white/40 uppercase">{detalle.plan}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[19px] tracking-[-0.02em]">{detalle.titulo}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{detalle.texto}</p>
                  </div>
                </article>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>

      <LlamadoFinal
        titulo="Tu link de la bio, listo hoy"
        hrefEmpezar="/panel/crear-cuenta?producto=enlaces"
        hrefPlantillas="/plantillas/enlaces"
      />
    </>
  )
}
