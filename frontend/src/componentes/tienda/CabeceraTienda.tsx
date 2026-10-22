import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Search, ShoppingBag } from 'lucide-react'
import type { AjustesTienda } from '@/tipos/tienda'
import { esMedioLocal } from '@/utilidades/medios'
import { enlaceWhatsapp, telefonoLegible } from '@/utilidades/whatsapp'

interface Props {
  nombre: string
  logoUrl: string | null
  ajustes?: AjustesTienda
}

function Logo({ nombre, logoUrl, grande }: { nombre: string; logoUrl: string | null; grande?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={nombre}
          width={240}
          height={96}
          unoptimized={esMedioLocal(logoUrl)}
          className={grande ? 'h-12 w-auto max-w-[220px] object-contain' : 'h-9 w-auto max-w-[160px] object-contain'}
        />
      ) : (
        <span className={`truncate font-display font-semibold tracking-tight ${grande ? 'text-2xl' : 'text-lg'}`}>{nombre}</span>
      )}
    </Link>
  )
}

function Buscador({ ancho }: { ancho?: boolean }) {
  return (
    <form action="/buscar" className={`flex items-stretch overflow-hidden rounded-(--radius-marca) border border-tinta/15 ${ancho ? 'w-full max-w-xl' : 'w-56'}`}>
      <input
        type="search"
        name="q"
        placeholder="¿Qué estás buscando?"
        aria-label="Buscar productos"
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-tinta outline-none placeholder:text-tinta/45"
      />
      <button type="submit" aria-label="Buscar" className="grid w-12 place-items-center bg-marca text-marca-contraste">
        <Search aria-hidden="true" className="h-4 w-4" />
      </button>
    </form>
  )
}

/**
 * Cabecera de la tienda. La simple es una línea con logo y menú; la completa
 * suma buscador, WhatsApp de servicio al cliente y una barra de menú con color
 * propio y un botón destacado, como las tiendas de supermercado.
 */
export function CabeceraTienda({ nombre, logoUrl, ajustes = {} }: Props) {
  const menu = ajustes.menu?.filter((item) => item.texto.trim()) ?? []

  if (ajustes.cabecera !== 'completa') {
    return (
      <header className="border-b border-tinta/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Logo nombre={nombre} logoUrl={logoUrl} />
          <nav className="flex min-w-0 items-center gap-5 overflow-x-auto text-sm text-tinta/70">
            {menu.length > 0 ? (
              menu.map((item) => (
                <a key={item.texto + item.enlace} href={item.enlace || '#'} className="shrink-0 transition hover:text-tinta">
                  {item.texto}
                </a>
              ))
            ) : (
              <Link href="/#productos" className="shrink-0 transition hover:text-tinta">
                Productos
              </Link>
            )}
            {ajustes.buscador && (
              <Link href="/buscar" aria-label="Buscar" className="shrink-0 transition hover:text-tinta">
                <Search aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>
      </header>
    )
  }

  const barra = ajustes.colorBarra ?? '#000000'

  return (
    <header>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-6">
        <Logo nombre={nombre} logoUrl={logoUrl} grande />
        {ajustes.buscador !== false && (
          <div className="order-3 flex w-full justify-center md:order-none md:w-auto md:flex-1">
            <Buscador ancho />
          </div>
        )}
        <Link href="/#productos" aria-label="Ver productos" className="text-tinta/80 transition hover:text-tinta">
          <ShoppingBag aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
        </Link>
      </div>

      <div style={{ background: barra }} className="text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 sm:gap-6">
          {ajustes.botonDestacado?.texto && (
            <a
              href={ajustes.botonDestacado.enlace || '#productos'}
              className="flex shrink-0 items-center gap-2 rounded-(--radius-marca) bg-marca px-5 py-2.5 text-sm font-medium text-marca-contraste transition hover:opacity-90"
            >
              <ShoppingBag aria-hidden="true" className="h-4 w-4" />
              {ajustes.botonDestacado.texto}
            </a>
          )}
          <nav className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto text-[15px] [scrollbar-width:none]">
            {menu.map((item) => (
              <a key={item.texto + item.enlace} href={item.enlace || '#'} className="shrink-0 opacity-90 transition hover:opacity-100">
                {item.texto}
              </a>
            ))}
          </nav>
          {ajustes.whatsapp && (
            <a
              href={enlaceWhatsapp(ajustes.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-2.5 md:flex"
            >
              <MessageCircle aria-hidden="true" className="h-7 w-7" strokeWidth={1.6} />
              <span className="leading-tight">
                <span className="block text-lg font-semibold">{telefonoLegible(ajustes.whatsapp)}</span>
                <span className="block text-xs opacity-75">Servicio al cliente</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
