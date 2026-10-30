'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useFavoritos } from '@/utilidades/favoritos'

/** Guarda el producto en los favoritos de este navegador. */
export function BotonFavorito({ productoId }: { productoId: string }) {
  const { es, alternar, ids } = useFavoritos()
  const guardado = es(productoId)
  return (
    <span className="inline-flex items-center gap-3 text-sm text-tinta/65">
      <button
        type="button"
        aria-pressed={guardado}
        onClick={() => alternar(productoId)}
        className="inline-flex items-center gap-2 transition hover:text-tinta"
      >
        <Heart aria-hidden="true" className={`h-4 w-4 ${guardado ? 'fill-current text-tinta' : ''}`} />
        {guardado ? 'En favoritos' : 'Guardar'}
      </button>
      {ids.length > 0 && (
        <Link href="/favoritos" className="underline-offset-4 hover:underline">
          Ver favoritos ({ids.length})
        </Link>
      )}
    </span>
  )
}
