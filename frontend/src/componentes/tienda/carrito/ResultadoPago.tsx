'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react'
import { consultarPago } from '@/app/(tienda)/[subdominio]/carrito/acciones'
import type { EstadoPagoTienda } from '@/tipos/pedidos'
import { formatearPrecio } from '@/utilidades/formato'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'

const SALIDA = [0.16, 1, 0.3, 1] as const

/**
 * Confirma el pago al volver de la pasarela. Si todavía está pendiente,
 * pregunta otra vez unos segundos después (PSE y Nequi pueden tardar).
 */
export function ResultadoPago({
  referencia,
  idExterno,
  whatsapp,
  moneda,
}: {
  referencia: string
  idExterno?: string
  whatsapp?: string
  moneda: string
}) {
  const [pago, setPago] = useState<EstadoPagoTienda | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    let intentos = 0
    async function revisar() {
      const resultado = await consultarPago(referencia, idExterno)
      if (!vivo) return
      setPago(resultado)
      setCargando(false)
      if (resultado?.estado === 'PENDIENTE' && intentos++ < 8) setTimeout(() => void revisar(), 4000)
    }
    void revisar()
    return () => {
      vivo = false
    }
  }, [referencia, idExterno])

  if (cargando) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-tinta/15 border-t-tinta" />
        <p className="mt-5 text-tinta/70">Confirmando tu pago…</p>
      </main>
    )
  }

  if (!pago) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">No encontramos ese pago</h1>
        <Link href="/" className="mt-8 inline-block underline underline-offset-4">
          Volver a la tienda
        </Link>
      </main>
    )
  }

  const aprobado = pago.estado === 'APROBADO'
  const pendiente = pago.estado === 'PENDIENTE'
  const Icono = aprobado ? CheckCircle2 : pendiente ? Clock : XCircle
  const nombre = pago.pedido.clienteNombre.split(' ')[0]

  return (
    <motion.main
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: SALIDA }}
      className="mx-auto max-w-xl px-6 py-20 text-center"
    >
      <Icono
        aria-hidden="true"
        strokeWidth={1.5}
        className={`mx-auto h-14 w-14 ${aprobado ? 'text-emerald-500' : pendiente ? 'text-amber-500' : 'text-red-500'}`}
      />
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
        {aprobado ? `¡Pago recibido, ${nombre}!` : pendiente ? 'Tu pago está en proceso' : 'El pago no se completó'}
      </h1>
      <p className="mt-3 text-tinta/70">
        {aprobado ? (
          <>
            Pagaste <strong className="text-tinta">{formatearPrecio(pago.monto, moneda)}</strong> por el pedido{' '}
            <strong className="text-tinta">#{pago.pedido.numero}</strong>. Te escribiremos a {pago.pedido.clienteEmail} para coordinar la entrega.
          </>
        ) : pendiente ? (
          <>Algunos medios, como PSE, tardan unos minutos. En cuanto se confirme, tu pedido #{pago.pedido.numero} queda pagado.</>
        ) : (
          <>Tu pedido #{pago.pedido.numero} sigue apartado. Puedes intentar con otro medio o escribirle a la tienda.</>
        )}
      </p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        {whatsapp && (
          <a
            href={enlaceWhatsapp(
              whatsapp,
              aprobado
                ? `¡Hola! Acabo de pagar el pedido #${pago.pedido.numero} (${formatearPrecio(pago.monto, moneda)}).`
                : `¡Hola! Tuve un problema pagando el pedido #${pago.pedido.numero}. ¿Me ayudas?`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-[#25d366] px-6 py-3.5 font-medium text-white"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Escribir por WhatsApp
          </a>
        )}
        <Link href="/" className="boton-tienda inline-flex items-center justify-center rounded-(--radius-marca) border border-tinta/20 px-6 py-3.5 font-medium">
          Seguir comprando
        </Link>
      </div>
    </motion.main>
  )
}
