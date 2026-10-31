import Link from 'next/link'
import { Check, MessageCircle, Package, Store, Truck } from 'lucide-react'
import type { SeguimientoPedido as Pedido } from '@/app/(tienda)/[subdominio]/acciones-sitio'
import { formatearPrecio } from '@/utilidades/formato'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'

const fecha = (valor: string) =>
  new Date(valor).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })

/** Pasos que ve el comprador. Pagado y preparando cuentan como "preparando". */
function pasosDe(pedido: Pedido) {
  const recoge = pedido.entrega === 'recoger'
  return [
    { clave: 'recibido', titulo: 'Recibido', Icono: Check },
    { clave: 'preparando', titulo: 'Preparando', Icono: Package },
    { clave: 'enviado', titulo: recoge ? 'Listo para recoger' : 'En camino', Icono: recoge ? Store : Truck },
    { clave: 'entregado', titulo: 'Entregado', Icono: Check },
  ]
}

const AVANCE: Record<Pedido['estado'], number> = { PENDIENTE: 0, PAGADO: 1, PREPARANDO: 1, ENVIADO: 2, ENTREGADO: 3, CANCELADO: -1, REEMBOLSADO: -1 }

export function SeguimientoPedido({ pedido, moneda, tienda, whatsapp }: { pedido: Pedido; moneda: string; tienda: string; whatsapp?: string }) {
  const avance = AVANCE[pedido.estado]
  const cancelado = avance < 0
  const pasos = pasosDe(pedido)

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm text-tinta/60">Pedido #{pedido.numero} · {fecha(pedido.creadoEn)}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {cancelado ? 'Este pedido fue cancelado' : avance === 3 ? `¡Listo, ${pedido.nombre}! Ya lo tienes` : `${pedido.nombre}, así va tu pedido`}
      </h1>

      {!cancelado && (
        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Avance del pedido">
          {pasos.map((paso, indice) => {
            const hecho = indice <= avance
            return (
              <li key={paso.clave} className="flex flex-col gap-2" aria-current={indice === avance ? 'step' : undefined}>
                <span className={`h-1.5 rounded-full ${hecho ? 'bg-marca' : 'bg-tinta/10'}`} />
                <span className={`flex items-center gap-1.5 text-xs sm:text-sm ${hecho ? 'text-tinta' : 'text-tinta/45'}`}>
                  <paso.Icono aria-hidden="true" className="hidden h-4 w-4 shrink-0 sm:block" />
                  {paso.titulo}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {pedido.guia && !cancelado && (
        <div className="mt-8 rounded-(--radius-marca) border border-tinta/15 p-4 text-sm">
          <p className="font-medium">Seguimiento del envío</p>
          <p className="mt-1 text-tinta/70">
            {pedido.transportadora ? `${pedido.transportadora} · ` : ''}Guía <span className="font-mono text-tinta">{pedido.guia}</span>
          </p>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-medium">Lo que pediste</h2>
        <ul className="mt-4 divide-y divide-tinta/10 border-y border-tinta/10">
          {pedido.items.map((item, indice) => (
            <li key={indice} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {item.cantidad} × {item.nombreProducto}
                {item.variante && <span className="text-tinta/55"> ({item.variante})</span>}
              </span>
              <span className="tabular-nums">{formatearPrecio(item.subtotal, moneda)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-1.5 text-sm">
          {Number(pedido.descuento) > 0 && (
            <div className="flex justify-between text-tinta/65">
              <dt>Descuento</dt>
              <dd className="tabular-nums">−{formatearPrecio(pedido.descuento, moneda)}</dd>
            </div>
          )}
          <div className="flex justify-between text-tinta/65">
            <dt>{pedido.entrega === 'recoger' ? 'Recoges en la tienda' : `Envío${pedido.ciudad ? ` a ${pedido.ciudad}` : ''}`}</dt>
            <dd className="tabular-nums">{Number(pedido.envio) > 0 ? formatearPrecio(pedido.envio, moneda) : 'Gratis'}</dd>
          </div>
          <div className="mt-1 flex justify-between text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatearPrecio(pedido.total, moneda)}</dd>
          </div>
        </dl>
        {pedido.factura && <p className="mt-3 text-sm text-tinta/60">Factura electrónica {pedido.factura}</p>}
      </section>

      <p className="mt-8 text-xs text-tinta/50">Actualizado {fecha(pedido.actualizadoEn)}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {whatsapp && (
          <a
            href={enlaceWhatsapp(whatsapp, `Hola ${tienda}, te escribo por mi pedido #${pedido.numero}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-marca px-5 py-3 text-sm font-medium text-marca-contraste transition hover:opacity-90"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
            Preguntar por mi pedido
          </a>
        )}
        <Link href="/" className="inline-flex items-center justify-center rounded-(--radius-marca) border border-tinta/20 px-5 py-3 text-sm transition hover:bg-tinta/5">
          Seguir comprando
        </Link>
      </div>
    </main>
  )
}
