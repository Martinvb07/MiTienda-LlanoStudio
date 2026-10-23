import Image from 'next/image'
import Link from 'next/link'
import { CalendarCheck, MessageCircle, Search, ShoppingBag } from 'lucide-react'
import { BotonCarrito } from './carrito/Carrito'
import type { AjustesTienda, TipoSitio } from '@/tipos/tienda'
import { esMedioLocal } from '@/utilidades/medios'
import { vendeEnLinea } from '@/utilidades/sitio'
import { enlaceWhatsapp, telefonoLegible } from '@/utilidades/whatsapp'

interface Props {
  nombre: string
  logoUrl: string | null
  ajustes?: AjustesTienda
  /** Una página informativa no lleva carrito ni buscador: en su lugar, WhatsApp. */
  tipo?: TipoSitio
}

/** Lo que va a la derecha de la cabecera: el carrito o, en una página, escribir por WhatsApp. */
function Accion({ vende, whatsapp, nombre, className }: { vende: boolean; whatsapp?: string; nombre: string; className?: string }) {
  if (vende) return <BotonCarrito className={className} />
  if (!whatsapp) return null
  return (
    <a
      href={enlaceWhatsapp(whatsapp, `Hola ${nombre}, quiero más información`)}
      target="_blank"
      rel="noopener noreferrer"
      className="boton-tienda inline-flex shrink-0 items-center gap-2 rounded-(--radius-marca) bg-marca px-4 py-2 text-sm font-medium text-marca-contraste transition hover:opacity-90"
    >
      <MessageCircle aria-hidden="true" className="h-4 w-4" />
      Escríbenos
    </a>
  )
}

const ALTO_LOGO = { chico: 'h-7 max-w-[130px]', medio: 'h-9 max-w-[160px]', grande: 'h-12 max-w-[220px]' } as const

function Logo({
  nombre,
  logoUrl,
  grande,
  tamano,
}: {
  nombre: string
  logoUrl: string | null
  grande?: boolean
  tamano?: keyof typeof ALTO_LOGO
}) {
  const alto = ALTO_LOGO[tamano ?? (grande ? 'grande' : 'medio')]
  return (
    <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={nombre}
          width={240}
          height={96}
          unoptimized={esMedioLocal(logoUrl)}
          className={`${alto} w-auto object-contain`}
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
export function CabeceraTienda({ nombre, logoUrl, ajustes = {}, tipo }: Props) {
  const vende = vendeEnLinea(tipo)
  const menu = ajustes.menu?.filter((item) => item.texto.trim()) ?? []
  const buscador = vende && ajustes.buscador
  // Sin menú propio, una tienda ofrece sus productos; una página no inventa enlaces.
  const menuSimple = menu.length > 0 || !vende ? menu : [{ texto: 'Productos', enlace: '/#productos' }]
  // Fija al bajar: pegada arriba, con el fondo de la tienda para que no se transparente.
  const fija = ajustes.cabeceraFija ? 'sticky top-0 z-50 bg-superficie/95 backdrop-blur' : ''

  if (ajustes.cabecera !== 'completa') {
    if (ajustes.logoCentrado) {
      return (
        <header className={`border-b border-tinta/10 ${fija}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-4">
            <nav className="flex min-w-0 items-center gap-5 overflow-x-auto text-sm text-tinta/70 [scrollbar-width:none]">
              {menuSimple.map((item) => (
                <a key={item.texto + item.enlace} href={item.enlace || '#'} className="shrink-0 transition hover:text-tinta">
                  {item.texto}
                </a>
              ))}
            </nav>
            <Logo nombre={nombre} logoUrl={logoUrl} tamano={ajustes.tamanoLogo} />
            <div className="flex items-center justify-end gap-5 text-tinta/75">
              {buscador && (
                <Link href="/buscar" aria-label="Buscar" className="transition hover:text-tinta">
                  <Search aria-hidden="true" className="h-5 w-5" />
                </Link>
              )}
              <Accion vende={vende} whatsapp={ajustes.whatsapp} nombre={nombre} className="transition hover:text-tinta" />
            </div>
          </div>
        </header>
      )
    }
    return (
      <header className={`border-b border-tinta/10 ${fija}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Logo nombre={nombre} logoUrl={logoUrl} tamano={ajustes.tamanoLogo} />
          <nav className="flex min-w-0 items-center gap-5 overflow-x-auto text-sm text-tinta/70">
            {/* En una página el menú se esconde en el celular: ahí manda el botón de WhatsApp. */}
            {menuSimple.map((item) => (
              <a
                key={item.texto + item.enlace}
                href={item.enlace || '#'}
                className={`shrink-0 transition hover:text-tinta ${!vende && ajustes.whatsapp ? 'hidden sm:inline' : ''}`}
              >
                {item.texto}
              </a>
            ))}
            {buscador && (
              <Link href="/buscar" aria-label="Buscar" className="shrink-0 transition hover:text-tinta">
                <Search aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
            <Accion vende={vende} whatsapp={ajustes.whatsapp} nombre={nombre} className="shrink-0 text-tinta/75 transition hover:text-tinta" />
          </nav>
        </div>
      </header>
    )
  }

  const barra = ajustes.colorBarra ?? '#000000'

  return (
    <header className={fija}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-6">
        <Logo nombre={nombre} logoUrl={logoUrl} grande tamano={ajustes.tamanoLogo} />
        {vende && ajustes.buscador !== false && (
          <div className="order-3 flex w-full justify-center md:order-none md:w-auto md:flex-1">
            <Buscador ancho />
          </div>
        )}
        <Accion vende={vende} whatsapp={ajustes.whatsapp} nombre={nombre} className="text-tinta/80 transition hover:text-tinta" />
      </div>

      <div style={{ background: barra }} className="text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 sm:gap-6">
          {ajustes.botonDestacado?.texto && (
            <a
              href={ajustes.botonDestacado.enlace || '#productos'}
              className="boton-tienda flex shrink-0 items-center gap-2 rounded-(--radius-marca) bg-marca px-5 py-2.5 text-sm font-medium text-marca-contraste transition hover:opacity-90"
            >
              {vende ? <ShoppingBag aria-hidden="true" className="h-4 w-4" /> : <CalendarCheck aria-hidden="true" className="h-4 w-4" />}
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
                <span className="block text-xs opacity-75">{vende ? 'Servicio al cliente' : 'Escríbenos'}</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
