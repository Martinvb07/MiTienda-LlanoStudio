import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { ARTICULOS, fechaLarga } from '@/contenido/articulos'

export const metadata: Metadata = {
  title: 'Recursos',
  description:
    'Guías para vender en línea en Colombia: fotos de producto, descripciones, pagos, envíos y cómo elegir la plantilla de tu tienda.',
}

export default function PaginaRecursos() {
  const [destacado, ...resto] = ARTICULOS

  return (
    <>
      <CabeceraPagina
        rotulo="Recursos"
        titulo="Aprende a vender en línea, sin vueltas"
        descripcion="Guías cortas y concretas sobre lo que de verdad hace que una tienda venda en Colombia."
      />

      <section className="pt-24 pb-[110px] md:pb-[150px]">
        <Contenedor>
          {destacado && (
            <Revelar>
              <Link href={`/blog/${destacado.slug}`} className="group grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[8px]">
                  <Image
                    src={destacado.portada}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover transition-transform duration-[1.4s] ease-salida group-hover:scale-[1.04]"
                  />
                </div>
                <div className="pb-2">
                  <span className="antetitulo">
                    {destacado.categoria} · {destacado.minutos} min
                  </span>
                  <h2 className="mt-4 text-[clamp(28px,3.2vw,44px)] leading-[1.04] tracking-[-0.04em]">
                    {destacado.titulo}
                  </h2>
                  <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/55">{destacado.resumen}</p>
                  <span className="enlace-flecha mt-7">
                    Leer
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </Revelar>
          )}

          <div className="mt-24 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {resto.map((articulo, indice) => (
              <Revelar key={articulo.slug} retardo={(indice % 3) * 0.08}>
                <Link href={`/blog/${articulo.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[8px]">
                    <Image
                      src={articulo.portada}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-[1.4s] ease-salida group-hover:scale-[1.05]"
                    />
                  </div>
                  <p className="mt-5 text-[11px] tracking-[0.12em] text-white/45 uppercase">
                    {articulo.categoria} · {fechaLarga(articulo.fecha)}
                  </p>
                  <h3 className="mt-2.5 text-[20px] leading-[1.2] tracking-[-0.02em] transition-colors duration-500 group-hover:text-white/70">
                    {articulo.titulo}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/50">{articulo.resumen}</p>
                </Link>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
