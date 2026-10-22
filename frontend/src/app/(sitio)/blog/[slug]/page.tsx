import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { ARTICULOS, articuloPorSlug, fechaLarga } from '@/contenido/articulos'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return ARTICULOS.map((articulo) => ({ slug: articulo.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const articulo = articuloPorSlug((await params).slug)
  if (!articulo) return { title: 'Artículo no encontrado' }
  return {
    title: articulo.titulo,
    description: articulo.resumen,
    openGraph: { title: articulo.titulo, description: articulo.resumen, images: [articulo.portada], type: 'article' },
  }
}

export default async function PaginaArticulo({ params }: Props) {
  const articulo = articuloPorSlug((await params).slug)
  if (!articulo) notFound()

  const otros = ARTICULOS.filter((otro) => otro.slug !== articulo.slug).slice(0, 3)

  return (
    <>
      <article className="pt-[130px] md:pt-[170px]">
        <Contenedor>
          <div className="entrada mx-auto max-w-[760px]">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-[11.5px] tracking-[0.1em] text-white/50 uppercase transition-colors hover:text-white"
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:-translate-x-1" />
              Recursos
            </Link>
            <p className="mt-10 text-[11px] tracking-[0.12em] text-white/45 uppercase">
              {articulo.categoria} · {fechaLarga(articulo.fecha)} · {articulo.minutos} min de lectura
            </p>
            <h1 className="mt-4 text-[clamp(36px,5vw,64px)] leading-[1.02] tracking-[-0.045em]">{articulo.titulo}</h1>
            <p className="mt-6 text-[18px] leading-relaxed text-white/60">{articulo.resumen}</p>
          </div>

          <Revelar className="relative mx-auto mt-14 aspect-[16/9] max-w-[1100px] overflow-hidden rounded-[10px]">
            <Image src={articulo.portada} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
          </Revelar>

          <div className="mx-auto mt-16 max-w-[680px]">
            {articulo.secciones.map((seccion, indice) => (
              <section key={indice} className="mt-10 first:mt-0">
                {seccion.titulo && <h2 className="text-[26px] leading-[1.15] tracking-[-0.03em]">{seccion.titulo}</h2>}
                {seccion.parrafos.map((parrafo) => (
                  <p key={parrafo.slice(0, 40)} className="mt-4 text-[17px] leading-[1.75] text-white/70">
                    {parrafo}
                  </p>
                ))}
                {seccion.lista && (
                  <ul className="mt-5 border-b border-white/10">
                    {seccion.lista.map((punto) => (
                      <li key={punto} className="border-t border-white/10 py-3.5 text-[16px] leading-relaxed text-white/75">
                        {punto}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </Contenedor>
      </article>

      <section className="py-[110px] md:py-[150px]">
        <Contenedor>
          <h2 className="titulo-3 mb-10">Sigue leyendo</h2>
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
            {otros.map((otro) => (
              <Link key={otro.slug} href={`/blog/${otro.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[8px]">
                  <Image src={otro.portada} alt="" fill sizes="33vw" className="object-cover transition-transform duration-[1.4s] ease-salida group-hover:scale-[1.05]" />
                </div>
                <p className="mt-4 text-[11px] tracking-[0.12em] text-white/45 uppercase">{otro.categoria}</p>
                <h3 className="mt-2 text-[18px] leading-[1.25] tracking-[-0.02em]">{otro.titulo}</h3>
              </Link>
            ))}
          </div>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
