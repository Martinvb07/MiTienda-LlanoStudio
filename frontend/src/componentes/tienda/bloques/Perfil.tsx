import Image from 'next/image'
import { Facebook, Instagram, MessageCircle, Music2 } from 'lucide-react'
import type { PropsPerfil } from '@/tipos/bloques'
import type { AjustesTienda } from '@/tipos/tienda'
import { esMedioLocal } from '@/utilidades/medios'
import { hrefEnlace } from '@/utilidades/enlacesBio'

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]!.toUpperCase())
    .join('')

interface Props extends PropsPerfil {
  nombreSitio?: string
  logoUrl?: string | null
  ajustes?: AjustesTienda
}

/**
 * La cabeza de los enlaces para tu bio: foto (o iniciales), nombre, bio y los
 * íconos de las redes de Contacto y redes. Entra escalonada, de arriba abajo.
 */
export function Perfil({ nombre, bio, fotoUrl, forma = 'circulo', mostrarRedes, nombreSitio, logoUrl, ajustes = {} }: Props) {
  const titulo = nombre || nombreSitio || 'Tu nombre'
  const foto = fotoUrl || logoUrl
  const redes = [
    ajustes.instagram && { clave: 'instagram', Icono: Instagram, etiqueta: 'Instagram', valor: ajustes.instagram },
    ajustes.tiktok && { clave: 'tiktok', Icono: Music2, etiqueta: 'TikTok', valor: ajustes.tiktok },
    ajustes.facebook && { clave: 'facebook', Icono: Facebook, etiqueta: 'Facebook', valor: ajustes.facebook },
    ajustes.whatsapp && { clave: 'whatsapp', Icono: MessageCircle, etiqueta: 'WhatsApp', valor: ajustes.whatsapp },
  ].filter((red) => !!red)

  return (
    <section className="bio-entrada flex flex-col items-center px-6 pt-14 pb-6 text-center">
      <span
        className={`relative grid h-24 w-24 place-items-center overflow-hidden bg-marca text-3xl text-marca-contraste shadow-[0_0_0_4px_var(--superficie),0_0_0_6px_color-mix(in_srgb,var(--marca)_35%,transparent)] ${
          forma === 'circulo' ? 'rounded-full' : 'rounded-[28%]'
        }`}
      >
        {foto ? (
          <Image src={foto} alt={titulo} fill sizes="96px" priority unoptimized={esMedioLocal(foto)} className="object-cover" />
        ) : (
          <span aria-hidden="true" className="font-display font-semibold">
            {iniciales(titulo)}
          </span>
        )}
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-balance">{titulo}</h1>
      {bio && <p className="mt-2 max-w-sm leading-relaxed text-pretty text-tinta/70">{bio}</p>}
      {mostrarRedes && redes.length > 0 && (
        <div className="mt-5 flex justify-center gap-2.5">
          {redes.map(({ clave, Icono, etiqueta, valor }) => (
            <a
              key={clave}
              href={hrefEnlace({ url: '', icono: clave }, { [clave]: valor })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={etiqueta}
              className="grid h-10 w-10 place-items-center rounded-full border border-current/15 text-tinta/80 transition duration-300 hover:-translate-y-0.5 hover:border-current/40 hover:text-tinta"
            >
              <Icono aria-hidden="true" className="h-[18px] w-[18px]" />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
