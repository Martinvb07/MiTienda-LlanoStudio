'use client'

import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'

export function Compartir({ nombre }: { nombre: string }) {
  const [copiado, setCopiado] = useState(false)

  async function compartir() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: nombre, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 1800)
      }
    } catch {
      // Compartir cancelado: nada que hacer.
    }
  }

  return (
    <button type="button" onClick={() => void compartir()} className="inline-flex items-center gap-2 text-sm text-tinta/65 transition hover:text-tinta">
      {copiado ? <Check aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}
      {copiado ? 'Enlace copiado' : 'Compartir'}
    </button>
  )
}
