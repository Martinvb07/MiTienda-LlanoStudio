import Link from 'next/link'
import { MessageCircle, Truck } from 'lucide-react'
import type { AjustesTienda, BloqueFicha, Producto, ResenaPublica } from '@/tipos/tienda'
import { plantillaCompleta } from '@/utilidades/fichaProducto'
import { formatearPrecio, generarSlug } from '@/utilidades/formato'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { TarjetaProducto } from './TarjetaProducto'
import { BarraCompraFija } from './ficha/BarraCompraFija'
import { Beneficios } from './ficha/Beneficios'
import { BotonComprar } from './ficha/BotonComprar'
import { Compartir } from './ficha/Compartir'
import { Avisame } from './ficha/Avisame'
import { BotonFavorito } from './ficha/BotonFavorito'
import { GaleriaFicha } from './ficha/GaleriaFicha'
import { Opiniones } from './ficha/Opiniones'
import { Estrellas } from './Estrellas'
import { MedirVista } from './ficha/MedirVista'

interface Props {
  producto: Producto
  nombreTienda: string
  moneda: string
  ajustes?: AjustesTienda
  /** Catálogo de la tienda, para los productos relacionados. */
  catalogo?: Producto[]
  /** Opiniones aprobadas; sin ellas (vista previa) la sección sale vacía. */
  resenas?: ResenaPublica[]
}

/**
 * Página de un producto, armada con la plantilla de la tienda
 * (ajustes.paginaProducto): qué piezas se ven, en qué orden y cómo van las
 * fotos. La usan la tienda pública y la vista previa del editor.
 */
export function FichaProducto({ producto, nombreTienda, moneda, ajustes = {}, catalogo = [], resenas = [] }: Props) {
  const plantilla = plantillaCompleta(ajustes.paginaProducto)
  const descuento =
    producto.precioComparacion && Number(producto.precioComparacion) > Number(producto.precio)
      ? Math.round((1 - Number(producto.precio) / Number(producto.precioComparacion)) * 100)
      : 0

  // Si alguna variante cuesta menos, el precio se anuncia "desde".
  const precioMinimo = Math.min(
    Number(producto.precio),
    ...(producto.variantes ?? []).filter((variante) => variante.precio != null).map((variante) => Number(variante.precio)),
  )

  const relacionados = plantilla.relacionados
    ? [
        ...catalogo.filter((otro) => otro.id !== producto.id && producto.categoria && otro.categoria === producto.categoria),
        ...catalogo.filter((otro) => otro.id !== producto.id && (!producto.categoria || otro.categoria !== producto.categoria)),
      ].slice(0, 4)
    : []

  const piezas: Record<BloqueFicha, React.ReactNode> = {
    titulo: (
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{producto.nombre}</h1>
        {plantilla.resenas && producto.resenas && producto.resenas.total > 0 && (
          <a href="#opiniones" className="inline-flex w-fit items-center gap-2 text-sm text-tinta/65 transition hover:text-tinta">
            <Estrellas valor={producto.resenas.promedio} />
            {producto.resenas.promedio.toLocaleString('es-CO', { minimumFractionDigits: 1 })} · {producto.resenas.total}{' '}
            {producto.resenas.total === 1 ? 'opinión' : 'opiniones'}
          </a>
        )}
      </div>
    ),
    presentacion: producto.presentacion ? <p className="text-sm text-tinta/55">{producto.presentacion}</p> : null,
    precio: (
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-2xl">
          {precioMinimo < Number(producto.precio) ? 'Desde ' : ''}
          {formatearPrecio(Math.min(precioMinimo, Number(producto.precio)), moneda)}
        </span>
        {producto.precioComparacion && (
          <s className="text-tinta/40">{formatearPrecio(producto.precioComparacion, moneda)}</s>
        )}
        {descuento > 0 && (
          <span className="rounded-full bg-marca px-2.5 py-0.5 text-xs font-semibold text-marca-contraste">-{descuento}%</span>
        )}
      </div>
    ),
    stock:
      producto.stock > 0 ? (
        <p className="flex items-center gap-2 text-sm text-tinta/70">
          <span className={`h-2 w-2 rounded-full ${producto.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {producto.stock <= 5 ? `¡Sólo quedan ${producto.stock}!` : 'Disponible'}
        </p>
      ) : (
        <p className="text-sm text-tinta/55">Agotado</p>
      ),
    descripcion: producto.descripcion ? (
      <p className="leading-relaxed whitespace-pre-line text-tinta/80">{producto.descripcion}</p>
    ) : null,
    comprar: (
      <div data-boton-comprar>
        <BotonComprar producto={producto} moneda={moneda} />
        {producto.stock === 0 && (
          <div className="mt-4">
            <Avisame productoId={producto.id} />
          </div>
        )}
        <div className="mt-4">
          <BotonFavorito productoId={producto.id} />
        </div>
      </div>
    ),
    beneficios: <Beneficios beneficios={plantilla.beneficios} />,
    whatsapp:
      ajustes.whatsapp && producto.stock > 0 ? (
        <a
          href={enlaceWhatsapp(
            ajustes.whatsapp,
            `Hola ${nombreTienda}, quiero pedir: ${producto.nombre}${producto.presentacion ? ` (${producto.presentacion})` : ''}.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="boton-tienda flex items-center justify-center gap-2 rounded-(--radius-marca) bg-[#25d366] px-6 py-3.5 font-medium text-white transition hover:opacity-90"
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          Pedir por WhatsApp
        </a>
      ) : null,
    envio: plantilla.textoEnvio ? (
      <p className="flex items-start gap-3 rounded-(--radius-marca) bg-tinta/[0.04] px-4 py-3 text-sm text-tinta/75">
        <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {plantilla.textoEnvio}
      </p>
    ) : null,
    acordeones:
      plantilla.acordeones.length > 0 ? (
        <div className="border-t border-tinta/10">
          {plantilla.acordeones.map((acordeon) => (
            <details key={acordeon.id} className="group border-b border-tinta/10">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium [&::-webkit-details-marker]:hidden">
                {acordeon.titulo}
                <span aria-hidden="true" className="text-xl text-tinta/50 transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed whitespace-pre-line text-tinta/70">{acordeon.texto}</p>
            </details>
          ))}
        </div>
      ) : null,
    compartir: <Compartir nombre={producto.nombre} />,
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <MedirVista id={producto.id} nombre={producto.nombre} precio={producto.precio} moneda={moneda} />
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2 text-sm text-tinta/60">
        <Link href="/" className="transition hover:text-tinta">
          {nombreTienda}
        </Link>
        {producto.categoria && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/categoria/${generarSlug(producto.categoria)}`} className="transition hover:text-tinta">
              {producto.categoria}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-8 grid items-start gap-12 lg:grid-cols-2">
        <GaleriaFicha fotos={producto.fotos} nombre={producto.nombre} disposicion={plantilla.galeria} zoom={plantilla.zoomFoto} />

        <div
          className={`flex flex-col gap-5 ${plantilla.fijarInfo ? 'lg:sticky lg:top-24' : ''} ${plantilla.animarEntrada ? 'entrada' : ''}`}
        >
          {plantilla.orden
            .filter((pieza) => pieza.visible && piezas[pieza.id])
            .map((pieza) => (
              <div key={pieza.id}>{piezas[pieza.id]}</div>
            ))}
        </div>
      </div>

      {plantilla.resenas && <Opiniones productoId={producto.id} resenas={resenas} resumen={producto.resenas ?? null} />}

      {relacionados.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight">{plantilla.tituloRelacionados}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {relacionados.map((otro) => (
              <TarjetaProducto key={otro.id} producto={otro} moneda={moneda} />
            ))}
          </div>
        </section>
      )}
      {plantilla.barraFija && <BarraCompraFija producto={producto} moneda={moneda} />}
    </main>
  )
}
