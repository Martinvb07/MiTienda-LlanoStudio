import Link from 'next/link'
import { headers } from 'next/headers'
import { CABECERA_HOST } from '@/middleware'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { obtenerTienda } from '@/servicios/tiendas.servicio'

/**
 * 404 dentro de una tienda (producto o categoría que ya no existe). Va con el
 * tema y la cabecera de la tienda: el comprador no debe sentir que salió de ella.
 */
export default async function NoEncontradaTienda() {
  const host = (await headers()).get(CABECERA_HOST)
  const tienda = host ? await obtenerTienda(host) : null

  return (
    <>
      {tienda && <CabeceraTienda nombre={tienda.nombre} logoUrl={tienda.logoUrl} ajustes={tienda.ajustes} />}
      <section className="flex min-h-[72vh] flex-col items-center justify-center px-6 py-20 text-center">
        <p
          aria-hidden="true"
          className="font-display text-[clamp(110px,22vw,240px)] leading-[0.85] tracking-[-0.07em] text-tinta/10 select-none"
        >
          404
        </p>
        <h1 className="-mt-3 font-display text-[clamp(26px,3.6vw,40px)] leading-tight tracking-[-0.03em] sm:-mt-6">
          No encontramos esta página
        </h1>
        <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-tinta/65">
          Puede que el producto ya no esté disponible o que el enlace haya cambiado. Lo demás de la tienda sigue aquí.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-marca bg-marca px-7 text-sm font-medium text-marca-contraste transition-opacity hover:opacity-90"
          >
            Volver a la tienda
          </Link>
          <Link
            href="/buscar"
            className="inline-flex h-12 items-center rounded-marca border border-tinta/15 px-7 text-sm font-medium transition-colors hover:border-tinta/40"
          >
            Ver todos los productos
          </Link>
        </div>
      </section>
    </>
  )
}
