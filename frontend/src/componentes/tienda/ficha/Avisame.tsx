'use client'

import { useState, type FormEvent } from 'react'
import { Bell, Check } from 'lucide-react'
import { pedirAviso } from '@/app/(tienda)/[subdominio]/acciones-sitio'

/** Producto agotado: quien lo quiere deja su correo y le escribimos cuando vuelva. */
export function Avisame({ productoId }: { productoId: string }) {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'hecho'>('listo')
  const [error, setError] = useState('')

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEstado('enviando')
    setError('')
    const resultado = await pedirAviso(productoId, email)
    if (resultado.ok) return setEstado('hecho')
    setEstado('listo')
    setError(resultado.campos.email ?? resultado.mensaje)
  }

  if (estado === 'hecho') {
    return (
      <p className="flex items-center gap-2 rounded-(--radius-marca) border border-tinta/15 px-4 py-3 text-sm text-tinta/80">
        <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
        Listo. Te escribimos a {email} apenas vuelva a haber.
      </p>
    )
  }

  return (
    <form onSubmit={(evento) => void enviar(evento)} className="rounded-(--radius-marca) border border-tinta/15 p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Bell aria-hidden="true" className="h-4 w-4" />
        Avísame cuando llegue
      </p>
      <p className="mt-1 text-sm text-tinta/60">Deja tu correo y te escribimos una sola vez cuando haya unidades.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`avisame-${productoId}`}>
          Tu correo
        </label>
        <input
          id={`avisame-${productoId}`}
          type="email"
          required
          maxLength={160}
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="tu@correo.com"
          className="min-w-0 flex-1 rounded-(--radius-marca) border border-tinta/20 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-tinta/60"
        />
        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="boton-tienda rounded-(--radius-marca) bg-marca px-5 py-2.5 text-sm font-medium text-marca-contraste transition hover:opacity-90 disabled:opacity-50"
        >
          {estado === 'enviando' ? 'Guardando…' : 'Avisarme'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  )
}
