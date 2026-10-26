import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { obtenerPlanes } from '@/servicios/planes.servicio'
import { formatearPrecio } from '@/utilidades/formato'
import { Contenedor } from './Contenedor'
import { MENU_PRECIOS, PRODUCTOS } from './productos'
import { Revelar } from './Revelar'

/**
 * Lo que cuesta cada producto, de un vistazo: el plan Gratis y desde cuánto
 * arrancan los pagos. Los precios salen de la misma oferta que edita el admin;
 * si la API no responde, se dice sólo "Desde $0".
 */
export async function PreciosPortada() {
  const ofertas = await Promise.all(MENU_PRECIOS.map((producto) => obtenerPlanes(producto.clave)))

  return (
    <section id="precios" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <span className="antetitulo mb-[22px]">Precios</span>
            <h2 className="titulo-2 max-w-[13ch]">Empieza gratis. Paga cuando crezcas.</h2>
          </div>
          <p className="bajada md:justify-self-end">Sin comisión por venta, sin permanencia y sin tarjeta para empezar.</p>
        </Revelar>

        <div className="grid gap-4 md:grid-cols-3">
          {MENU_PRECIOS.map((producto, indice) => {
            const pagos = ofertas[indice]!.filter((plan) => plan.precio > 0).sort((a, b) => a.precio - b.precio)
            const desde = pagos[0]
            return (
              <Revelar key={producto.clave} retardo={indice * 0.06}>
                <Link href={producto.href} className="baldosa foco group flex h-full flex-col p-7 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <producto.icono aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 text-sitio-azul-claro" />
                    <ArrowUpRight
                      aria-hidden="true"
                      strokeWidth={1.4}
                      className="h-5 w-5 text-white/30 transition-[transform,color] duration-700 ease-salida group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
                    />
                  </div>
                  <h3 className="mt-6 text-[20px] tracking-[-0.03em]">{producto.nombre}</h3>
                  <p className="mt-1 text-[13.5px] text-white/50">{PRODUCTOS.find((otro) => otro.clave === producto.clave)?.resumen}</p>
                  <p className="mt-8 flex items-baseline gap-2">
                    <span className="text-[clamp(36px,4vw,52px)] leading-none tracking-[-0.045em]">$0</span>
                    <span className="text-[13px] text-white/45">para siempre</span>
                  </p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[13px] text-white/55">
                    {desde ? (
                      <>
                        Planes pagos desde <span className="text-white">{formatearPrecio(desde.precio)}</span> al mes
                      </>
                    ) : (
                      'Planes pagos cuando los necesites'
                    )}
                  </p>
                </Link>
              </Revelar>
            )
          })}
        </div>
      </Contenedor>
    </section>
  )
}
