'use client'

import type { AjustesTienda } from '@/tipos/tienda'
import { Campo } from '../ui/basicos'

interface Props {
  ajustes: AjustesTienda
  alCambiar: (cambios: Partial<AjustesTienda>) => void
  /** https://tutienda.llanostudio.co, para armar la dirección del catálogo. */
  direccion: string
  vende: boolean
}

/** Pixel de Meta, Google Analytics y el catálogo para Instagram y Facebook. */
export function CamposMedicion({ ajustes, alCambiar, direccion, vende }: Props) {
  const pixelValido = !ajustes.pixelMeta || /^\d{5,20}$/.test(ajustes.pixelMeta)
  const analyticsValido = !ajustes.googleAnalytics || /^G-[A-Z0-9]{4,16}$/.test(ajustes.googleAnalytics)
  return (
    <>
      <Campo
        etiqueta="Pixel de Meta"
        valor={ajustes.pixelMeta ?? ''}
        alCambiar={(valor) => alCambiar({ pixelMeta: valor.replace(/\D/g, '') || undefined })}
        maximo={20}
        marcador="123456789012345"
        ayuda="Lo encuentras en Meta Events Manager. Mide visitas, carritos y compras de tus anuncios."
        error={pixelValido ? undefined : 'El ID del pixel tiene entre 5 y 20 números.'}
      />
      <Campo
        etiqueta="Google Analytics"
        valor={ajustes.googleAnalytics ?? ''}
        alCambiar={(valor) => alCambiar({ googleAnalytics: valor.trim().toUpperCase() || undefined })}
        maximo={18}
        marcador="G-XXXXXXXXXX"
        ayuda="El ID de medición de tu propiedad de Analytics 4."
        error={analyticsValido ? undefined : 'Empieza por G- seguido de letras y números.'}
      />
      {vende && (
        <div className="rounded-lg border border-sitio-borde bg-sitio-elevado p-3 text-[11.5px] leading-relaxed text-sitio-suave">
          <strong className="block text-sitio-tinta">Catálogo para Instagram y Facebook</strong>
          En Meta Commerce Manager elige «Agregar productos › Lista de datos › URL» y pega esta dirección. Se actualiza sola
          con tus precios y tu stock.
          <code className="mt-1.5 block select-all break-all rounded bg-sitio-campo px-2 py-1 text-[11px] text-sitio-tinta">
            {direccion}/catalogo.xml
          </code>
        </div>
      )}
    </>
  )
}
