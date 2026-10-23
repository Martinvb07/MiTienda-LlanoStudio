import type { Metadata } from 'next'
import { ArrowUpRight, Instagram, MessageCircle, Building2, type LucideIcon } from 'lucide-react'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { Revelar } from '@/componentes/sitio/Revelar'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbenos por el chat en vivo o por Instagram si tienes dudas sobre Mi Sitio o quieres el plan Pro.',
  alternates: { canonical: '/contacto' },
}

const CANALES: { nombre: string; detalle: string; texto: string; icono: LucideIcon; url?: string }[] = [
  {
    nombre: 'Chat en vivo',
    detalle: 'Abajo a la derecha',
    texto: 'Te responde una persona del equipo.',
    icono: MessageCircle,
  },
  {
    nombre: 'Instagram',
    detalle: '@llanostudio.co',
    texto: 'Para una consulta corta.',
    icono: Instagram,
    url: 'https://www.instagram.com/llanostudio.co/',
  },
  {
    nombre: 'El estudio',
    detalle: 'llanostudio.co',
    texto: 'Para un proyecto a medida.',
    icono: Building2,
    url: 'https://llanostudio.co',
  },
]

export default function PaginaContacto() {
  return (
    <>
      <CabeceraPagina
        rotulo="Contacto"
        titulo="Hablemos de tu negocio"
        descripcion="Si la plataforma ya lo resuelve, te lo decimos derecho."
      />

      <section className="py-[110px] md:py-[150px]">
        <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Revelar>
            <span className="antetitulo mb-[22px]">Canales</span>
            <h2 className="titulo-2 max-w-[11ch]">Escríbenos por donde prefieras</h2>
            <p className="bajada mt-6">Lunes a viernes, en horario de Colombia.</p>
          </Revelar>

          <Revelar retardo={0.1} className="border-b border-white/12">
            {CANALES.map((canal) => {
              const contenido = (
                <>
                  <canal.icono aria-hidden="true" strokeWidth={1.4} className="h-5 w-5 text-white/45" />
                  <div>
                    <h3 className="text-[clamp(22px,2.2vw,28px)] tracking-[-0.03em]">{canal.nombre}</h3>
                    <p className="mt-1.5 text-[14px] text-white/55">
                      <span className="text-white/80">{canal.detalle}</span> · {canal.texto}
                    </p>
                  </div>
                  {canal.url && (
                    <ArrowUpRight
                      aria-hidden="true"
                      strokeWidth={1.4}
                      className="h-5 w-5 text-white/30 transition-[transform,color] duration-700 ease-salida group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
                    />
                  )}
                </>
              )
              const clases = 'group grid grid-cols-[56px_1fr_auto] items-center gap-6 border-t border-white/12 py-8 md:grid-cols-[80px_1fr_auto]'
              return canal.url ? (
                <a key={canal.nombre} href={canal.url} target="_blank" rel="noopener noreferrer" className={clases}>
                  {contenido}
                </a>
              ) : (
                <div key={canal.nombre} className={clases}>
                  {contenido}
                </div>
              )
            })}
          </Revelar>
        </Contenedor>
      </section>
    </>
  )
}
