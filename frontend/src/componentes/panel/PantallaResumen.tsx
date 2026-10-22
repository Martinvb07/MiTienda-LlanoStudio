'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ArrowUpRight } from 'lucide-react'
import { listarProductos } from '@/servicios/panel'
import type { ProductoPanel } from '@/tipos/tienda'
import { urlTienda } from '@/utilidades/dominios'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'
import { Etiqueta } from './ui/basicos'

const NOMBRES_PLAN: Record<string, string> = {
  GRATIS: 'Gratis',
  EMPRENDE: 'Emprende',
  NEGOCIO: 'Negocio',
  PRO: 'Pro',
}

/** Portada del panel: saludo, la tienda y los pasos que faltan para vender. */
export function PantallaResumen() {
  const { sesion } = useSesion()
  const [productos, setProductos] = useState<ProductoPanel[] | null>(null)

  useEffect(() => {
    listarProductos()
      .then(setProductos)
      .catch(() => setProductos([]))
  }, [])

  const visibles = productos?.filter((producto) => producto.activo).length ?? 0
  const publicada = sesion.tienda?.publicada ?? false
  const direccion = urlTienda(sesion.tenant.subdominio)

  const pasos = [
    {
      hecho: Boolean(sesion.tienda?.logoUrl),
      titulo: 'Dale tu identidad',
      texto: 'Sube tu logo, elige colores y arma la portada.',
      href: '/panel/plantillas?editar=1',
      accion: 'Abrir editor',
    },
    {
      hecho: visibles > 0,
      titulo: 'Agrega tus productos',
      texto: 'Nombre, fotos y precio. Puedes ocultarlos mientras los terminas.',
      href: '/panel/productos',
      accion: 'Ir a productos',
    },
    {
      hecho: publicada,
      titulo: 'Publica tu tienda',
      texto: 'Actívala en el editor, sección Publicación, y comparte tu dirección.',
      href: '/panel/plantillas?editar=1',
      accion: 'Publicar',
    },
  ]
  const hechos = pasos.filter((paso) => paso.hecho).length

  return (
    <div className="flex flex-col gap-6">
      <section className="relative isolate overflow-hidden rounded-[14px] border border-sitio-borde bg-sitio-superficie px-6 py-9 md:px-9">
        <span className="antetitulo">Hola, {sesion.usuario.nombre.split(' ')[0]}</span>
        <h1 className="mt-3 text-[clamp(30px,4vw,52px)] leading-[1.02] font-normal tracking-[-0.045em]">
          {sesion.tienda?.nombre ?? 'Tu tienda'}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Etiqueta tono={publicada ? 'verde' : 'ambar'}>{publicada ? 'Publicada' : 'Borrador'}</Etiqueta>
          <a
            href={direccion}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[12.5px] text-sitio-suave hover:text-white"
          >
            {direccion.replace(/^https?:\/\//, '')} <ArrowUpRight aria-hidden="true" className="inline h-3 w-3 align-[-1px]" />
          </a>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/panel/plantillas?editar=1" className="boton boton-primario boton-chico">
            Editar tienda
          </Link>
          <Link href="/panel/productos" className="boton boton-contorno boton-chico">
            Productos
          </Link>
        </div>
      </section>

      <div className="grid gap-3.5 sm:grid-cols-3">
        {[
          { valor: productos ? String(productos.length) : '—', etiqueta: 'Productos' },
          { valor: productos ? String(visibles) : '—', etiqueta: 'Visibles en la tienda' },
          { valor: NOMBRES_PLAN[sesion.tenant.plan] ?? sesion.tenant.plan, etiqueta: 'Plan' },
        ].map((cifra) => (
          <div key={cifra.etiqueta} className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5">
            <p className="text-[36px] leading-none tracking-[-0.045em]">{cifra.valor}</p>
            <p className="mt-2 text-xs text-sitio-tenue">{cifra.etiqueta}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[15px] font-medium">Para empezar a vender</h2>
          <span className="text-xs text-sitio-tenue">
            {hechos} de {pasos.length}
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-sitio-verde transition-[width] duration-700 ease-salida"
            style={{ width: `${(hechos / pasos.length) * 100}%` }}
          />
        </div>
        <ol className="mt-2">
          {pasos.map((paso, indice) => (
            <li
              key={paso.titulo}
              className="grid grid-cols-[32px_1fr_auto] items-center gap-4 border-b border-sitio-borde py-4 last:border-0"
            >
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full border text-[11px]',
                  paso.hecho ? 'border-sitio-verde/40 bg-sitio-verde/10 text-sitio-verde' : 'border-sitio-borde text-sitio-tenue',
                )}
              >
                {paso.hecho ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : String(indice + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm', paso.hecho && 'text-sitio-tenue line-through')}>{paso.titulo}</p>
                <p className="mt-0.5 text-[12.5px] text-sitio-tenue">{paso.texto}</p>
              </div>
              {!paso.hecho && (
                <Link href={paso.href} className="enlace-flecha !text-[11px] text-sitio-suave hover:text-white">
                  {paso.accion}
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center text-xs text-sitio-tenue">
        Pedidos, pagos con Wompi y PSE y métricas de ventas llegan en las próximas fases.
      </p>
    </div>
  )
}
