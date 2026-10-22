import { MessageCircle } from 'lucide-react'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'

/** Botón flotante de WhatsApp en la esquina, en todas las páginas de la tienda. */
export function BotonWhatsapp({ numero, tienda }: { numero: string; tienda: string }) {
  return (
    <a
      href={enlaceWhatsapp(numero, `Hola ${tienda}, quiero hacer un pedido.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="group fixed right-5 bottom-5 z-40 flex items-center gap-2"
    >
      <span className="hidden rounded-md bg-[#dcf8c6] px-3 py-1.5 text-sm font-medium text-[#075e54] shadow-md transition group-hover:translate-x-0 sm:block">
        WhatsApp
      </span>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg transition group-hover:scale-105">
        <MessageCircle aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
      </span>
    </a>
  )
}
