import Link from 'next/link'
import type { OpcionesTarjeta } from '@/tipos/bloques'
import type { Producto } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'
import { FotoSegura } from './FotoSegura'
import { AgregarRapido } from './carrito/AgregarRapido'
import { Estrellas } from './Estrellas'

/**
 * Un producto en una grilla. 'simple' es foto grande y texto suelto; 'tarjeta'
 * va en un recuadro con el precio destacado (color propio o el de la marca) y la presentación,
 * como el catálogo de un supermercado. `opciones` esconde lo que no se quiera
 * ver (nombre, precios, insignia, botón); sin ellas se ve todo.
 */
export function TarjetaProducto({
  producto,
  moneda,
  estilo: estiloBase = 'simple',
  opciones = {},
}: {
  producto: Producto
  moneda: string
  estilo?: 'simple' | 'tarjeta'
  opciones?: OpcionesTarjeta
}) {
  const estilo = opciones.estilo ?? estiloBase
  const ver = {
    nombre: opciones.nombre !== false,
    precio: opciones.precio !== false,
    precioAntes: opciones.precioAntes !== false,
    oferta: opciones.oferta !== false,
    boton: opciones.boton !== false,
  }
  const insignia = opciones.textoOferta?.trim() || 'Oferta'
  const foto = producto.fotos[0]
  const segunda = producto.fotos[1]
  // Sólo se ve si el tema lo activa (data-segunda-foto en el marco de la tienda).
  const fotoAlterna = segunda ? (
    <FotoSegura
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
            <FotoSegura
              src={foto}
              alt={producto.nombre}
              fill
              sizes="(max-width: 640px) 50vw, 20vw"
              unoptimized={esMedioLocal(foto)}
              className="object-cover transition duration-500 group-hover:scale-105"
              respaldo={<span className="flex h-full items-center justify-center text-xs text-tinta/30">Sin foto</span>}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-tinta/30">Sin foto</span>
          )}
          {fotoAlterna}
          {ver.oferta && producto.precioComparacion && !agotado && (
            <span className="absolute top-2 left-2 rounded-full bg-marca px-2 py-0.5 text-[11px] font-semibold text-marca-contraste">
              {insignia}
            </span>
          )}
        </div>
        {ver.nombre && <h3 className="mt-3 line-clamp-2 text-center text-sm">{producto.nombre}</h3>}
        {producto.resenas && producto.resenas.total > 0 && (
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-tinta/55">
            <Estrellas valor={producto.resenas.promedio} tamano="h-3 w-3" /> ({producto.resenas.total})
          </p>
        )}
        {(ver.precio || ver.precioAntes) && (
          <p className="mt-2 text-center">
            {ver.precio && (
              <span className="font-display text-lg font-semibold text-[var(--precio,var(--marca))]">{formatearPrecio(producto.precio, moneda)}</span>
            )}
            {ver.precioAntes && producto.precioComparacion && (
              <s className="ml-1.5 text-xs text-tinta/40">{formatearPrecio(producto.precioComparacion, moneda)}</s>
            )}
          </p>
        )}
        {(producto.presentacion || agotado) && (
          <p className="mt-0.5 text-center text-xs text-tinta/55">{agotado ? 'Agotado' : producto.presentacion}</p>
        )}
        <span className="mt-auto" />
        {ver.boton && <AgregarRapido producto={producto} forma="boton" />}
      </Link>
    )
  }

  return (
    <Link href={`/productos/${producto.slug}`} className="tarjeta-producto group block">
      <div className="tarjeta-foto relative aspect-square overflow-hidden rounded-(--radius-marca) bg-tinta/5">
        {foto ? (
          <FotoSegura
            src={foto}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={esMedioLocal(foto)}
            className="object-cover transition duration-300 group-hover:scale-105"
            respaldo={<div className="flex h-full items-center justify-center text-sm text-tinta/30">Sin foto</div>}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-tinta/30">Sin foto</div>
        )}
        {fotoAlterna}
        {ver.oferta && opciones.textoOferta !== undefined && producto.precioComparacion && !agotado && (
          <span className="absolute top-2 left-2 rounded-full bg-marca px-2 py-0.5 text-[11px] font-semibold text-marca-contraste">
            {insignia}
          </span>
        )}
        {ver.boton && <AgregarRapido producto={producto} forma="flotante" />}
      </div>
      {ver.nombre && <h3 className="mt-4 font-medium">{producto.nombre}</h3>}
      {producto.resenas && producto.resenas.total > 0 && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-tinta/55">
          <Estrellas valor={producto.resenas.promedio} tamano="h-3.5 w-3.5" /> ({producto.resenas.total})
        </p>
      )}
      {ver.precio && <p className="mt-1 text-tinta/70">{formatearPrecio(producto.precio, moneda)}</p>}
      {ver.precioAntes && producto.precioComparacion && (
        <p className="text-sm text-tinta/40 line-through">{formatearPrecio(producto.precioComparacion, moneda)}</p>
      )}
      {producto.presentacion && <p className="mt-1 text-sm text-tinta/50">{producto.presentacion}</p>}
      {agotado && <p className="mt-1 text-sm text-tinta/40">Agotado</p>}
    </Link>
  )
}
