'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { vendeEnLinea } from '@/utilidades/sitio'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'

/**
 * Productos, pedidos y descuentos son de la tienda en línea. Una página
 * informativa no los ve en el menú; si llega por un enlace, se le explica.
 */
export function SoloTienda({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { sesion } = useSesion()
  if (vendeEnLinea(sesion.tienda?.tipo)) return children

  return (
    <>
      <CabeceraPanel titulo={titulo} />
      <div className="flex flex-col items-start gap-4 rounded-[14px] border border-sitio-borde bg-sitio-superficie p-6 sm:p-8">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-sitio-borde text-sitio-suave">
          <LayoutTemplate aria-hidden="true" strokeWidth={1.6} className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-[17px] font-medium">Tu página no vende en línea</h2>
          <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-sitio-tenue">
            {titulo} es de la tienda en línea. Tu página muestra tus servicios y recibe mensajes por WhatsApp.
          </p>
        </div>
        <Link href="/panel/plantillas" className="boton boton-primario boton-chico">
          Editar mi página
        </Link>
      </div>
    </>
  )
}
