'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Award,
  BadgePercent,
  Check,
  Clock,
  Coffee,
  CreditCard,
  Facebook,
  Gift,
  Heart,
  Home,
  Instagram,
  Leaf,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Package,
  Phone,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ElementoLienzo, RedSocial } from '@/tipos/bloques'
import type { AjustesTienda, Producto } from '@/tipos/tienda'
import { generarSlug } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { BotonCarrito } from '../carrito/Carrito'
import { TarjetaProducto } from '../TarjetaProducto'
import { restante } from './CuentaRegresiva'
import { direccionVideo } from './Video'

/** Lo que las piezas vivas necesitan de la tienda para pintarse. */
export interface ContextoLienzo {
  productos?: Producto[]
  moneda?: string
  ajustes?: AjustesTienda
  nombreTienda?: string
  logoUrl?: string | null
  /** En el editor: las piezas vacías muestran qué falta y los iframes no se tragan el mouse. */
  editando?: boolean
}

/** Íconos que se pueden poner sueltos en el lienzo: los que más usa una tienda. */
export const ICONOS_LIENZO: Record<string, { Icono: LucideIcon; nombre: string }> = {
  estrella: { Icono: Star, nombre: 'Estrella' },
  corazon: { Icono: Heart, nombre: 'Corazón' },
  envio: { Icono: Truck, nombre: 'Envío' },
  garantia: { Icono: ShieldCheck, nombre: 'Garantía' },
  pago: { Icono: CreditCard, nombre: 'Pago' },
  regalo: { Icono: Gift, nombre: 'Regalo' },
  etiqueta: { Icono: Tag, nombre: 'Etiqueta' },
  descuento: { Icono: BadgePercent, nombre: 'Descuento' },
  reloj: { Icono: Clock, nombre: 'Horario' },
  ubicacion: { Icono: MapPin, nombre: 'Ubicación' },
  telefono: { Icono: Phone, nombre: 'Teléfono' },
  correo: { Icono: Mail, nombre: 'Correo' },
  chat: { Icono: MessageCircle, nombre: 'Chat' },
  bolsa: { Icono: ShoppingBag, nombre: 'Bolsa' },
  brillo: { Icono: Sparkles, nombre: 'Brillo' },
  premio: { Icono: Award, nombre: 'Premio' },
  hoja: { Icono: Leaf, nombre: 'Natural' },
  rayo: { Icono: Zap, nombre: 'Rápido' },
  cafe: { Icono: Coffee, nombre: 'Café' },
  tijeras: { Icono: Scissors, nombre: 'Hecho a mano' },
  casa: { Icono: Home, nombre: 'Hogar' },
  listo: { Icono: Check, nombre: 'Listo' },
  candado: { Icono: Lock, nombre: 'Seguro' },
  paquete: { Icono: Package, nombre: 'Paquete' },
}

const REDES: Record<RedSocial, { Icono: LucideIcon; nombre: string; enlace: (ajustes: AjustesTienda) => string | null }> = {
  instagram: { Icono: Instagram, nombre: 'Instagram', enlace: (a) => (a.instagram ? `https://instagram.com/${a.instagram.replace(/^@/, '')}` : null) },
  facebook: {
    Icono: Facebook,
    nombre: 'Facebook',
    enlace: (a) => (a.facebook ? (a.facebook.startsWith('http') ? a.facebook : `https://facebook.com/${a.facebook}`) : null),
  },
  tiktok: { Icono: Music2, nombre: 'TikTok', enlace: (a) => (a.tiktok ? `https://tiktok.com/@${a.tiktok.replace(/^@/, '')}` : null) },
  whatsapp: { Icono: MessageCircle, nombre: 'WhatsApp', enlace: (a) => (a.whatsapp ? enlaceWhatsapp(a.whatsapp) : null) },
}

/** Aviso dentro de una pieza que todavía no tiene lo que necesita (sólo en el editor). */
function Falta({ texto, editando }: { texto: string; editando?: boolean }) {
  if (!editando) return null
  return (
    <span className="grid h-full w-full place-items-center rounded-[6px] border border-dashed border-tinta/25 px-3 text-center text-[0.7em] leading-snug text-tinta/50">
      {texto}
    </span>
  )
}

/** Un iframe no deja arrastrar: en el editor va una tapa encima. */
const Tapa = ({ editando }: { editando?: boolean }) => (editando ? <span aria-hidden="true" className="absolute inset-0" /> : null)

function Cuenta({ elemento }: { elemento: ElementoLienzo }) {
  const [tiempo, setTiempo] = useState<ReturnType<typeof restante>>(null)
  useEffect(() => {
    if (!elemento.fecha) return
    setTiempo(restante(elemento.fecha))
    const reloj = setInterval(() => setTiempo(restante(elemento.fecha!)), 1000)
    return () => clearInterval(reloj)
  }, [elemento.fecha])
  const unidades = [
    { valor: tiempo?.dias, etiqueta: 'días' },
    { valor: tiempo?.horas, etiqueta: 'horas' },
    { valor: tiempo?.minutos, etiqueta: 'min' },
    { valor: tiempo?.segundos, etiqueta: 'seg' },
  ]
  return (
    <div className="grid h-full w-full grid-cols-4 gap-[0.4em]">
      {unidades.map((unidad) => (
        <div
          key={unidad.etiqueta}
          className="flex flex-col items-center justify-center rounded-(--radius-marca)"
          style={{ background: elemento.fondo ?? 'var(--marca)', color: elemento.color ?? 'var(--marca-contraste)' }}
        >
          <span className="font-display text-[1.6em] leading-none font-semibold tabular-nums">
            {unidad.valor === undefined ? '--' : String(unidad.valor).padStart(2, '0')}
          </span>
          <span className="mt-[0.3em] text-[0.55em] tracking-wide uppercase opacity-80">{unidad.etiqueta}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Las piezas que no son texto, botón, foto ni forma. Las vivas (productos,
 * redes, logo, menú…) leen los datos de la tienda al pintarse, así que se
 * actualizan solas cuando cambia el catálogo o los ajustes.
 */
export function PiezaEspecial({ elemento, contexto = {} }: { elemento: ElementoLienzo; contexto?: ContextoLienzo }) {
  const { productos = [], moneda = 'COP', ajustes = {}, editando } = contexto
  const color = elemento.color
  const alineacion = { izquierda: 'flex-start', centro: 'center', derecha: 'flex-end' }[elemento.alineacion ?? 'centro']

  switch (elemento.tipo) {
    case 'producto': {
      const producto = productos.find((otro) => otro.id === elemento.productoId) ?? productos[0]
      if (!producto) return <Falta texto="Aquí va un producto: crea uno en Productos." editando={editando} />
      return (
        <div className="h-full w-full overflow-hidden text-[16px]">
          <TarjetaProducto producto={producto} moneda={moneda} opciones={elemento.tarjeta} estilo="tarjeta" />
        </div>
      )
    }
    case 'productos': {
      const lista = productos
        .filter((producto) => !elemento.categoria || producto.categoria?.toLowerCase() === elemento.categoria.toLowerCase())
        .filter((producto) => !elemento.soloDestacados || producto.destacado)
        .slice(0, elemento.limite ?? 4)
      if (lista.length === 0) return <Falta texto="Aquí van tus productos: crea alguno en Productos." editando={editando} />
      return (
        <div
          className="lienzo-grilla grid h-full w-full content-start gap-3 overflow-hidden text-[16px]"
          style={{ '--cols': elemento.columnas ?? 4, '--colsm': elemento.columnasMovil ?? 2 } as CSSProperties}
        >
          {lista.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} moneda={moneda} opciones={elemento.tarjeta} estilo="tarjeta" />
          ))}
        </div>
      )
    }
    case 'categorias': {
      const categorias = [...new Set(productos.map((producto) => producto.categoria?.trim()).filter((c): c is string => Boolean(c)))]
      if (categorias.length === 0) return <Falta texto="Aquí van tus categorías: ponle categoría a tus productos." editando={editando} />
      return (
        <div className="flex h-full w-full flex-wrap content-center gap-[0.5em]" style={{ justifyContent: alineacion }}>
          {categorias.map((categoria) => (
            <Link
              key={categoria}
              href={`/categoria/${generarSlug(categoria)}`}
              className="rounded-full px-[1em] py-[0.5em] font-medium whitespace-nowrap transition hover:opacity-85"
              style={{ background: elemento.fondo ?? 'var(--marca)', color: color ?? 'var(--marca-contraste)' }}
            >
              {categoria}
            </Link>
          ))}
        </div>
      )
    }
    case 'redes': {
      const elegidas = (elemento.redes?.length ? elemento.redes : (Object.keys(REDES) as RedSocial[]))
        .map((red) => ({ red, ...REDES[red], href: REDES[red].enlace(ajustes) }))
        .filter((red) => red.href || editando)
      if (elegidas.length === 0) return <Falta texto="Agrega tus redes en Ajustes." editando={editando} />
      return (
        <div className="flex h-full w-full items-center gap-[0.5em]" style={{ justifyContent: alineacion }}>
          {elegidas.map(({ red, Icono, nombre, href }) => (
            <a
              key={red}
              href={href ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={nombre}
              className={`grid aspect-square h-full max-h-[2.6em] place-items-center rounded-full transition hover:opacity-80 ${href ? '' : 'opacity-40'}`}
              style={{ background: elemento.fondo ?? 'transparent', color: color ?? 'currentColor', border: elemento.fondo ? undefined : '1.5px solid currentColor' }}
            >
              <Icono aria-hidden="true" className="h-[45%] w-[45%]" strokeWidth={1.7} />
            </a>
          ))}
        </div>
      )
    }
    case 'whatsapp': {
      if (!ajustes.whatsapp && !editando) return null
      return (
        <a
          href={ajustes.whatsapp ? enlaceWhatsapp(ajustes.whatsapp, elemento.mensaje) : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full items-center justify-center gap-[0.5em] px-[0.8em] font-medium whitespace-nowrap transition hover:opacity-90"
          style={{
            background: elemento.fondo ?? '#25d366',
            color: color ?? '#ffffff',
            borderRadius: elemento.radio !== undefined ? `${elemento.radio}px` : 'var(--radio-boton, var(--radio))',
          }}
        >
          <MessageCircle aria-hidden="true" className="h-[1.15em] w-[1.15em] shrink-0" strokeWidth={1.8} />
          {elemento.texto || 'Escríbenos'}
        </a>
      )
    }
    case 'logo': {
      const { logoUrl, nombreTienda } = contexto
      return (
        <Link href="/" className="relative flex h-full w-full items-center" style={{ justifyContent: alineacion }}>
          {logoUrl ? (
            <Image src={logoUrl} alt={nombreTienda ?? 'Logo'} fill sizes="240px" unoptimized={esMedioLocal(logoUrl)} className="object-contain" style={{ objectPosition: elemento.alineacion === 'derecha' ? 'right' : elemento.alineacion === 'izquierda' ? 'left' : 'center' }} />
          ) : (
            <span className="font-display text-[1.4em] font-semibold tracking-tight" style={{ color }}>
              {nombreTienda || 'Tu tienda'}
            </span>
          )}
        </Link>
      )
    }
    case 'buscador':
      return (
        <form action="/buscar" className="flex h-full w-full items-stretch overflow-hidden rounded-(--radius-marca) border border-tinta/15 bg-superficie">
          <input name="q" type="search" placeholder={elemento.texto || '¿Qué estás buscando?'} aria-label="Buscar productos" className="min-w-0 flex-1 bg-transparent px-[0.8em] text-[0.9em] text-tinta outline-none placeholder:text-tinta/45" />
          <button type="submit" aria-label="Buscar" className="grid aspect-square place-items-center" style={{ background: elemento.fondo ?? 'var(--marca)', color: color ?? 'var(--marca-contraste)' }}>
            <Search aria-hidden="true" className="h-[1.1em] w-[1.1em]" />
          </button>
        </form>
      )
    case 'menu': {
      const enlaces = ajustes.menu ?? []
      if (enlaces.length === 0) return <Falta texto="Arma tu menú en Encabezado." editando={editando} />
      return (
        <nav className="flex h-full w-full flex-wrap items-center gap-x-[1.4em] gap-y-[0.3em]" style={{ justifyContent: alineacion, color }}>
          {enlaces.map((enlace) => (
            <a key={enlace.texto + enlace.enlace} href={enlace.enlace || '#'} className="whitespace-nowrap transition hover:opacity-70">
              {enlace.texto}
            </a>
          ))}
        </nav>
      )
    }
    case 'carrito':
      return (
        <span className="flex h-full w-full items-center" style={{ justifyContent: alineacion, color }}>
          <BotonCarrito className="transition hover:opacity-70" />
        </span>
      )
    case 'icono': {
      const { Icono } = ICONOS_LIENZO[elemento.icono ?? 'estrella'] ?? ICONOS_LIENZO.estrella!
      return (
        <Icono
          aria-hidden="true"
          className="h-full w-full"
          style={{ color: color ?? 'var(--marca)' }}
          fill={elemento.relleno ? 'currentColor' : 'none'}
          strokeWidth={1.5}
        />
      )
    }
    case 'enlace':
      return (
        <span className="flex h-full w-full items-center" style={{ justifyContent: alineacion }}>
          <a href={elemento.enlace || '#'} className={`transition hover:opacity-70 ${elemento.sinSubrayado ? '' : 'underline underline-offset-4'}`} style={{ color }}>
            {elemento.texto || 'Ver más'}
          </a>
        </span>
      )
    case 'linea':
      return <span className="block h-full min-h-px w-full" style={{ background: elemento.fondo ?? 'currentColor', opacity: (elemento.opacidad ?? 25) / 100 }} />
    case 'video': {
      const fuente = elemento.url ? direccionVideo(elemento.url) : null
      if (!fuente) return <Falta texto="Pega el enlace de un video de YouTube o Vimeo." editando={editando} />
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: elemento.radio ? `${elemento.radio}px` : undefined }}>
          <iframe src={fuente} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className="absolute inset-0 h-full w-full border-0" />
          <Tapa editando={editando} />
        </div>
      )
    }
    case 'mapa': {
      const direccion = elemento.direccion || ajustes.direccion
      if (!direccion) return <Falta texto="Escribe la dirección de tu local." editando={editando} />
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: elemento.radio ? `${elemento.radio}px` : undefined }}>
          <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`} title={`Mapa: ${direccion}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
          <Tapa editando={editando} />
        </div>
      )
    }
    case 'cuenta':
      if (!elemento.fecha) return <Falta texto="Elige la fecha de cierre de la oferta." editando={editando} />
      return <Cuenta elemento={elemento} />
    default:
      return null
  }
}
