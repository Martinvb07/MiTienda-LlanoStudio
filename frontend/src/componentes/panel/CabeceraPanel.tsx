import type { ReactNode } from 'react'

/** Encabezado de cada pantalla del tablero: título, bajada y acción principal. */
export function CabeceraPanel({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[clamp(28px,3vw,40px)] leading-[1.05] font-normal tracking-[-0.04em]">{titulo}</h1>
        {descripcion && <p className="mt-2 max-w-xl text-sm text-sitio-tenue">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}
