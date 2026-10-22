import Image from 'next/image'
import Link from 'next/link'
import type { Producto } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'

/**
 * Un producto en una grilla. 'simple' es foto grande y texto suelto; 'tarjeta'
 * va en un recuadro con el precio en el color de la marca y la presentación,
 * como el catálogo de un supermercado.
 */
export function TarjetaProducto({
  producto,
  moneda,
  estilo = 'simple',
}: {
  producto: Producto
  moneda: string
  estilo?: 'simple' | 'tarjeta'
}) {
  const foto = producto.fotos[0]
  const segunda = producto.fotos[1]
  // Sólo se ve si el tema lo activa (data-segunda-foto en el marco de la tienda).
  const fotoAlterna = segunda ? (
    <Image
      src={segunda}
      alt=""
      fill
      sizes="(max-width: 640px) 50vw, 25vw"
      unoptimized={esMedioLocal(segunda)}
      className="foto-alterna object-cover opacity-0 transition duration-500"
    />
  ) : null
  const agotado = producto.stock === 0

  if (estilo === 'tarjeta') {
    return (
      <Link
        href={`/productos/${producto.slug}`}
        className="tarjeta-producto group flex flex-col overflow-hidden rounded-(--radius-marca) border border-tinta/12 bg-superficie p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="tarjeta-foto relative aspect-square overflow-hidden rounded-[calc(var(--radio)*0.6)] bg-tinta/5">
          {foto ? (
            <Image src={foto} alt={producto.nombre} fill sizes="(max-width: 640px) 50vw, 20vw" unoptimized={esMedioLocal(foto)} className="object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-tinta/30">Sin foto</span>
          )}
          {fotoAlterna}
          {producto.precioComparacion && !agotado && (
            <span className="absolute top-2 left-2 rounded-full bg-marca px-2 py-0.5 text-[11px] font-semibold text-marca-contraste">
              Oferta
            </span>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 text-center text-sm">{producto.nombre}</h3>
        <p className="mt-2 text-center">
          <span className="font-display text-lg font-semibold text-marca">{formatearPrecio(producto.precio, moneda)}</span>
          {producto.precioComparacion && (
            <s className="ml-1.5 text-xs text-tinta/40">{formatearPrecio(producto.precioComparacion, moneda)}</s>
          )}
        </p>
        {(producto.presentacion || agotado) && (
          <p className="mt-0.5 text-center text-xs text-tinta/55">{agotado ? 'Agotado' : producto.presentacion}</p>
        )}
      </Link>
    )
  }

  return (
    <Link href={`/productos/${producto.slug}`} className="tarjeta-producto group block">
      <div className="tarjeta-foto relative aspect-square overflow-hidden rounded-(--radius-marca) bg-tinta/5">
        {foto ? (
          <Image src={foto} alt={producto.nombre} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized={esMedioLocal(foto)} className="object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-tinta/30">Sin foto</div>
        )}
        {fotoAlterna}
      </div>
      <h3 className="mt-4 font-medium">{producto.nombre}</h3>
      <p className="mt-1 text-tinta/70">{formatearPrecio(producto.precio, moneda)}</p>
      {producto.precioComparacion && (
        <p className="text-sm text-tinta/40 line-through">{formatearPrecio(producto.precioComparacion, moneda)}</p>
      )}
      {producto.presentacion && <p className="mt-1 text-sm text-tinta/50">{producto.presentacion}</p>}
      {agotado && <p className="mt-1 text-sm text-tinta/40">Agotado</p>}
    </Link>
  )
}
