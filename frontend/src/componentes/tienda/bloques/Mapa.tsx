import type { PropsMapa } from '@/tipos/bloques'
import { TituloSeccion } from './TituloSeccion'

const ALTOS = { bajo: 'h-[260px]', medio: 'h-[380px]', alto: 'h-[520px]' } as const

export function Mapa({ titulo, direccion, alto = 'medio' }: PropsMapa) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={direccion} />
      <div className={`overflow-hidden rounded-(--radius-marca) bg-tinta/5 ${ALTOS[alto]}`}>
        {direccion ? (
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`}
            title={`Mapa: ${direccion}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
        ) : (
          <span className="grid h-full place-items-center text-sm text-tinta/40">Escribe la dirección de tu local</span>
        )}
      </div>
    </section>
  )
}
