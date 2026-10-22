import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { AjustesTienda, Producto } from "@/tipos/tienda";
import { formatearPrecio, generarSlug } from "@/utilidades/formato";
import { esMedioLocal } from "@/utilidades/medios";
import { enlaceWhatsapp } from "@/utilidades/whatsapp";

interface Props {
  producto: Producto;
  nombreTienda: string;
  moneda: string;
  ajustes?: AjustesTienda;
}

/** Página de un producto. La usan la tienda pública y la vista previa del editor. */
export function FichaProducto({
  producto,
  nombreTienda,
  moneda,
  ajustes = {},
}: Props) {
  const [portada, ...resto] = producto.fotos;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <nav
        aria-label="Ruta"
        className="flex flex-wrap items-center gap-2 text-sm text-tinta/60"
      >
        <Link href="/" className="transition hover:text-tinta">
          {nombreTienda}
        </Link>
        {producto.categoria && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              href={`/categoria/${generarSlug(producto.categoria)}`}
              className="transition hover:text-tinta"
            >
              {producto.categoria}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-(--radius-marca) bg-tinta/5">
            {portada ? (
              <Image
                src={portada}
                alt={producto.nombre}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={esMedioLocal(portada)}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-tinta/30">
                Sin foto
              </div>
            )}
          </div>

          {resto.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {resto.map((foto) => (
                <div
                  key={foto}
                  className="relative aspect-square overflow-hidden rounded-(--radius-marca) bg-tinta/5"
                >
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="12vw"
                    unoptimized={esMedioLocal(foto)}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
            {producto.nombre}
          </h1>
          {producto.presentacion && (
            <p className="mt-2 text-sm text-tinta/55">
              {producto.presentacion}
            </p>
          )}

          <p className="mt-4 text-2xl">
            {formatearPrecio(producto.precio, moneda)}
          </p>
          {producto.precioComparacion && (
            <p className="mt-1 text-tinta/40 line-through">
              {formatearPrecio(producto.precioComparacion, moneda)}
            </p>
          )}

          {producto.descripcion && (
            <p className="mt-6 leading-relaxed whitespace-pre-line text-tinta/80">
              {producto.descripcion}
            </p>
          )}

          {/* El carrito y el pago (Wompi/PSE) llegan en una fase posterior. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={producto.stock === 0}
              className="rounded-(--radius-marca) bg-marca px-6 py-3 font-medium text-marca-contraste transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {producto.stock === 0 ? "Agotado" : "Añadir al carrito"}
            </button>

            {ajustes.whatsapp && producto.stock > 0 && (
              <a
                href={enlaceWhatsapp(
                  ajustes.whatsapp,
                  `Hola ${nombreTienda}, quiero pedir: ${producto.nombre}${producto.presentacion ? ` (${producto.presentacion})` : ""}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-(--radius-marca) bg-[#25d366] px-6 py-3 font-medium text-white transition hover:opacity-90"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
                Pedir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
