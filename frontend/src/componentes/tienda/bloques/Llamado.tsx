import type { PropsLlamado } from '@/tipos/bloques'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'

/** Franja de color de marca con un mensaje y un botón, que puede abrir WhatsApp. */
export function Llamado({
  titulo,
  texto,
  textoBoton,
  enlaceBoton,
  aWhatsapp,
  whatsapp,
  tienda,
}: PropsLlamado & { whatsapp?: string; tienda?: string }) {
  const enlace =
    aWhatsapp && whatsapp ? enlaceWhatsapp(whatsapp, `Hola ${tienda ?? ''}, quiero más información`) : enlaceBoton || '#productos'

  return (
    <section className="px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-(--radius-marca) bg-marca px-8 py-14 text-center text-marca-contraste md:flex-row md:justify-between md:px-14 md:text-left">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">{titulo}</h2>
          {texto && <p className="mt-3 text-lg opacity-85">{texto}</p>}
        </div>
        {textoBoton && (
          <a
            href={enlace}
            target={aWhatsapp ? '_blank' : undefined}
            rel={aWhatsapp ? 'noopener noreferrer' : undefined}
            className="shrink-0 rounded-(--radius-marca) bg-marca-contraste px-7 py-3.5 font-semibold text-marca transition hover:opacity-90"
          >
            {textoBoton}
          </a>
        )}
      </div>
    </section>
  )
}
