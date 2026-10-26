import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CalendarCheck, Clock, Globe, Inbox, Phone, Users, type LucideIcon } from 'lucide-react'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { PLANTILLAS_PAGINA } from '@/utilidades/plantillasPagina'

export const metadata: Metadata = {
  title: 'Página para tu negocio',
  description:
    'Una página para abogados, clínicas, restaurantes y servicios: qué haces, tu equipo, tu horario y un botón para escribirte por WhatsApp. Gratis para empezar.',
  alternates: { canonical: '/para-negocios' },
}

/** Lo que de verdad trae hoy. Lo que depende del plan lo dice en voz baja. */
const DETALLES: { icono: LucideIcon; titulo: string; texto: string; plan?: string }[] = [
  { icono: CalendarCheck, titulo: 'Reservas en línea', texto: 'Eligen servicio, día y hora libre; la cita llega a tu agenda.' },
  { icono: Inbox, titulo: 'Formulario de contacto', texto: 'Cotizaciones y preguntas que llegan a tu panel y a tu correo.' },
  { icono: Clock, titulo: 'Servicios y horario', texto: 'Con precio, duración y días de atención.' },
  { icono: Phone, titulo: 'Llamar y cómo llegar', texto: 'Un toque para llamar o abrir el mapa.' },
  { icono: Users, titulo: 'Tu equipo', texto: 'Foto, nombre y cargo.', plan: 'Desde Emprende' },
  { icono: Globe, titulo: 'Tu dominio', texto: 'www.tunegocio.co, con HTTPS.', plan: 'Negocio y Pro' },
]

export default function PaginaParaNegocios() {
  return (
    <>
      <CabeceraPagina
        rotulo="Página para tu negocio"
        titulo="Tu negocio, a un mensaje"
        descripcion="Qué haces, quiénes atienden y cómo escribirte. Sin carrito."
      >
        <Boton href="/panel/crear-cuenta?producto=pagina" flecha>
          Crear mi página
        </Boton>
        <Boton href="/plantillas/pagina" variante="secundario">
          Ver plantillas
        </Boton>
      </CabeceraPagina>

      {/* Captura real de una página armada con la plantilla de consultorio */}
      <section className="pt-20 pb-[110px] md:pt-24 md:pb-[150px]">
        <Contenedor>
          <Revelar>
            <div className="baldosa relative h-[420px] overflow-hidden md:h-[560px]">
              <div className="absolute inset-x-5 top-8 -bottom-10 overflow-hidden rounded-[10px] bg-black shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 md:inset-x-[8%] md:top-12">
                <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-sitio-elevado px-3">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="ml-3 truncate font-mono text-[10px] text-white/40">morichal-abogados.llanostudio.co</span>
                </div>
                <Image
                  src="/ejemplos/morichal-abogados-completa.webp"
                  alt="Página de ejemplo de Morichal Abogados hecha con Mi Sitio"
                  width={1100}
                  height={2456}
                  sizes="(max-width: 768px) 95vw, 84vw"
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="absolute right-[5%] bottom-0 hidden w-[170px] overflow-hidden rounded-t-[24px] border-[6px] border-b-0 border-sitio-elevado bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] md:block">
                <Image src="/ejemplos/morichal-abogados-movil.webp" alt="" width={560} height={1212} sizes="170px" className="h-auto w-full" />
              </div>
            </div>
          </Revelar>
        </Contenedor>
      </section>

      {/* Para quién: cada fila lleva a su plantilla */}
      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Revelar>
            <span className="antetitulo mb-[22px]">Para quién</span>
            <h2 className="titulo-2 max-w-[11ch]">Una plantilla por oficio</h2>
          </Revelar>
          <Revelar retardo={0.1} className="border-b border-white/12">
            {PLANTILLAS_PAGINA.map((plantilla, indice) => (
              <Link
                key={plantilla.clave}
                href="/plantillas/pagina"
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
              <h2 className="titulo-2 max-w-[13ch]">Lo justo para que te contacten</h2>
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
        titulo="Tu página puede estar lista hoy"
        hrefEmpezar="/panel/crear-cuenta?producto=pagina"
        hrefPlantillas="/plantillas/pagina"
      />
    </>
  )
}
