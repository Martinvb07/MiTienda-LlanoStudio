'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Copy, CreditCard, Gift, Loader2, ShieldCheck, Ticket } from 'lucide-react'
import {
  ErrorPanel,
  crearCheckout,
  obtenerReferidos,
  obtenerSuscripcion,
  probarCupon,
  verificarPago,
  type Referidos,
  type PagoSuscripcion,
  type PeriodoPago,
  type PlanPago,
  type Suscripcion,
} from '@/servicios/panel'
import { formatearPrecio } from '@/utilidades/formato'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, CLASES_ENTRADA, Etiqueta, Segmentado } from './ui/basicos'
import { Aparecer } from './ui/movimiento'

const URL_SCRIPT_BOLD = 'https://checkout.bold.co/library/boldPaymentButton.js'

declare global {
  interface Window {
    BoldCheckout?: new (opciones: Record<string, string>) => { open: () => void }
  }
}

let cargaBold: Promise<void> | null = null

/** Carga una sola vez la librería del checkout de Bold. */
function cargarBold(): Promise<void> {
  if (window.BoldCheckout) return Promise.resolve()
  cargaBold ??= new Promise<void>((resolver, rechazar) => {
    const script = document.createElement('script')
    script.src = URL_SCRIPT_BOLD
    script.async = true
    script.onload = () => resolver()
    script.onerror = () => {
      cargaBold = null
      rechazar(new Error('No se pudo cargar Bold'))
    }
    document.head.appendChild(script)
  })
  return cargaBold
}

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const ESTADO_PAGO: Record<PagoSuscripcion['estado'], { texto: string; tono: 'verde' | 'ambar' | 'neutro' }> = {
  PENDIENTE: { texto: 'Procesando', tono: 'neutro' },
  APROBADO: { texto: 'Aprobado', tono: 'verde' },
  RECHAZADO: { texto: 'Rechazado', tono: 'ambar' },
  ANULADO: { texto: 'Anulado', tono: 'neutro' },
  ERROR: { texto: 'Error', tono: 'ambar' },
}

type Retorno = { tono: 'nota' | 'error'; texto: string } | null

/** Plan actual, pago con Bold (mensual o anual) e historial de cobros. */
export function PantallaPlan() {
  const { recargar } = useSesion()
  const [datos, setDatos] = useState<Suscripcion | null>(null)
  const [periodo, setPeriodo] = useState<PeriodoPago>('MENSUAL')
  const [codigo, setCodigo] = useState('')
  // Precio con el cupón por plan y periodo ("NEGOCIO:ANUAL"); si no aplica, no está.
  const [cupon, setCupon] = useState<{ codigo: string; porcentaje: number; precios: Record<string, number> } | null>(null)
  const [errorCupon, setErrorCupon] = useState('')
  const [probando, setProbando] = useState(false)
  const [referidos, setReferidos] = useState<Referidos | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    obtenerReferidos().then(setReferidos).catch(() => undefined)
  }, [])
  const [pagando, setPagando] = useState<PlanPago | null>(null)
  const [error, setError] = useState('')
  const [retorno, setRetorno] = useState<Retorno>(null)

  const cargar = useCallback(() => obtenerSuscripcion().then(setDatos), [])

  useEffect(() => {
    cargar().catch(() => setError('No pudimos cargar tu plan. Recarga la página.'))
  }, [cargar])

  // Al volver de Bold llega ?bold-order-id=…: se confirma el pago con el servidor.
  useEffect(() => {
    const referencia = new URLSearchParams(window.location.search).get('bold-order-id')
    if (!referencia) return
    window.history.replaceState(null, '', window.location.pathname)
    let vivo = true

    async function confirmar(intento: number) {
      try {
        const { pago } = await verificarPago(referencia!)
        if (!vivo) return
        if (pago.estado === 'APROBADO') {
          setRetorno({ tono: 'nota', texto: `¡Pago recibido! Tu plan quedó activo hasta el ${fecha(pago.cubreHasta!)}.` })
          await Promise.all([cargar(), recargar()])
        } else if (pago.estado === 'PENDIENTE' && intento < 5) {
          setRetorno({ tono: 'nota', texto: 'Estamos confirmando tu pago con Bold…' })
          setTimeout(() => void confirmar(intento + 1), 3000)
        } else if (pago.estado === 'PENDIENTE') {
          setRetorno({ tono: 'nota', texto: 'Bold todavía está procesando tu pago. Te activamos el plan apenas lo apruebe.' })
        } else {
          setRetorno({ tono: 'error', texto: 'El pago no se aprobó. Puedes intentarlo de nuevo con otro medio.' })
        }
      } catch {
        if (vivo) setRetorno({ tono: 'error', texto: 'No pudimos confirmar el pago. Si te cobraron, escríbenos.' })
      }
    }
    void confirmar(0)
    return () => {
      vivo = false
    }
  }, [cargar, recargar])

  async function pagar(plan: PlanPago) {
    setError('')
    setPagando(plan)
    try {
      const [checkout] = await Promise.all([crearCheckout(plan, periodo, cupon?.precios[`${plan}:${periodo}`] ? cupon.codigo : undefined), cargarBold()])
      if (!window.BoldCheckout) throw new Error('Bold no cargó')
      new window.BoldCheckout({
        orderId: checkout.referencia,
        currency: checkout.moneda,
        amount: String(checkout.monto),
        apiKey: checkout.llave,
        integritySignature: checkout.firma,
        description: checkout.descripcion,
        redirectionUrl: checkout.redireccion,
        customerData: JSON.stringify({ email: checkout.correo }),
      }).open()
    } catch (problema) {
      setError(problema instanceof ErrorPanel ? problema.message : 'No pudimos abrir el pago. Intenta de nuevo.')
    } finally {
      setPagando(null)
    }
  }

  async function aplicarCupon(evento: React.FormEvent) {
    evento.preventDefault()
    const limpio = codigo.trim().toUpperCase()
    if (!limpio) return
    setProbando(true)
    setErrorCupon('')
    // Se prueba en cada plan y periodo: un cupón puede servir sólo para algunos.
    const combinaciones = pagables.flatMap((oferta) => (['MENSUAL', 'ANUAL'] as const).map((p) => [oferta.plan as PlanPago, p] as const))
    const resultados = await Promise.allSettled(combinaciones.map(([plan, p]) => probarCupon(plan, p, limpio)))
    const precios: Record<string, number> = {}
    let porcentaje = 0
    let mensaje = ''
    resultados.forEach((resultado, indice) => {
      const [plan, p] = combinaciones[indice]!
      if (resultado.status === 'fulfilled' && resultado.value.cupon) {
        precios[`${plan}:${p}`] = resultado.value.monto
        porcentaje = resultado.value.cupon.porcentaje
      } else if (resultado.status === 'rejected' && !mensaje) {
        mensaje = resultado.reason instanceof Error ? resultado.reason.message : 'Ese cupón no sirve'
      }
    })
    setProbando(false)
    if (Object.keys(precios).length === 0) {
      setCupon(null)
      setErrorCupon(mensaje || 'Ese cupón no sirve')
      return
    }
    setCupon({ codigo: limpio, porcentaje, precios })
  }

  const pagables = (datos?.planes ?? []).filter((oferta) => oferta.plan !== 'GRATIS')
  const hayAnual = pagables.some((oferta) => oferta.precioAnual > 0)
  const actual = datos?.planes.find((oferta) => oferta.plan === datos.plan)

  return (
    <div>
      <CabeceraPanel
        titulo="Plan y pagos"
        descripcion="Paga tu plan con Bold: tarjeta, PSE, Nequi o Botón Bancolombia. Sin cobros automáticos: tú decides cuándo renovar."
      />

      <AnimatePresence>
        {retorno && (
          <div className="mb-5">
            <Aviso tono={retorno.tono}>{retorno.texto}</Aviso>
          </div>
        )}
      </AnimatePresence>

      {/* ── Plan actual ── */}
      <Aparecer>
        <section className="rounded-[16px] border border-sitio-borde bg-sitio-superficie p-6 md:p-8">
          {!datos ? (
            <div className="brillo h-20 rounded-lg" />
          ) : (
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="antetitulo">Tu plan</span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-[clamp(28px,3.4vw,44px)] leading-none tracking-[-0.045em]">{actual?.nombre ?? datos.plan}</h2>
                  {datos.estado === 'activa' && <Etiqueta tono="verde">Al día</Etiqueta>}
                  {datos.estado === 'por-vencer' && <Etiqueta tono="ambar">Por vencer</Etiqueta>}
                  {datos.estado === 'gracia' && <Etiqueta tono="ambar">Vencido</Etiqueta>}
                </div>
                <p className="mt-3 max-w-xl text-[13px] text-sitio-tenue">
                  {datos.plan === 'GRATIS'
                    ? 'Estás en el plan gratuito. Elige un plan abajo cuando quieras crecer.'
                    : datos.estado === 'sin-vencimiento'
                      ? 'Tu plan no tiene fecha de vencimiento.'
                      : datos.estado === 'gracia'
                        ? `Venció el ${fecha(datos.venceEn!)}. Tienes ${datos.diasRestantes} ${datos.diasRestantes === 1 ? 'día' : 'días'} para pagar antes de volver al plan Gratis.`
                        : `Pagado hasta el ${fecha(datos.venceEn!)}${datos.estado === 'por-vencer' ? ` · faltan ${datos.diasRestantes} ${datos.diasRestantes === 1 ? 'día' : 'días'}` : ''}.`}
                </p>
              </div>
              <p className="flex items-center gap-2 text-[12px] text-sitio-tenue">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
                Pagos procesados por Bold
              </p>
            </div>
          )}
        </section>
      </Aparecer>

      {/* ── Planes ── */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-medium">Elige cómo pagar</h2>
          <p className="mt-1 text-[12.5px] text-sitio-tenue">
            Si renuevas el mismo plan antes de que venza, el tiempo se suma al que te queda.
          </p>
        </div>
        {hayAnual && (
          <Segmentado
            opciones={[
              { valor: 'MENSUAL', etiqueta: 'Mensual' },
              { valor: 'ANUAL', etiqueta: 'Anual' },
            ]}
            valor={periodo}
            alCambiar={setPeriodo}
          />
        )}
      </div>

      <AnimatePresence>
        {error && (
          <div className="mt-4">
            <Aviso>{error}</Aviso>
          </div>
        )}
      </AnimatePresence>
      {datos && !datos.pagosHabilitados && (
        <div className="mt-4">
          <Aviso tono="nota">Los pagos en línea se están activando. Mientras tanto, escríbenos y te cambiamos el plan.</Aviso>
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-4">
        {(datos ? pagables : [null, null, null]).map((oferta, indice) => {
          if (!oferta) return <div key={indice} className="brillo h-[340px] rounded-[16px]" />
          const plan = oferta.plan as PlanPago
          const anual = periodo === 'ANUAL'
          const montoBase = anual ? oferta.precioAnual : oferta.precio
          const conCupon = cupon?.precios[`${plan}:${periodo}`]
          const monto = conCupon ?? montoBase
          const ahorro = anual && oferta.precio > 0 ? Math.round((1 - oferta.precioAnual / (oferta.precio * 12)) * 100) : 0
          const esActual = datos!.plan === plan
          const disponible = monto > 0 && datos!.pagosHabilitados

          return (
            <Aparecer key={plan} orden={indice + 1}>
              <article
                className={cn(
                  'flex h-full flex-col rounded-[16px] border bg-sitio-superficie p-6 transition-colors duration-500',
                  oferta.destacado ? 'border-sitio-borde-fuerte' : 'border-sitio-borde',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[17px] tracking-[-0.02em]">{oferta.nombre}</h3>
                  {esActual ? (
                    <Etiqueta tono="azul">Tu plan</Etiqueta>
                  ) : oferta.destacado ? (
                    <Etiqueta>Más elegido</Etiqueta>
                  ) : null}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={periodo}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="mt-5"
                  >
                    {monto > 0 ? (
                      <p className="flex items-baseline gap-1.5">
                        <span className="text-[34px] leading-none tracking-[-0.05em]">{formatearPrecio(monto)}</span>
                        <span className="text-[12px] text-sitio-tenue">{anual ? '/ año' : '/ mes'}</span>
                        {conCupon !== undefined && (
                          <span className="text-[12px] text-sitio-tenue line-through">{formatearPrecio(montoBase)}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-[13px] text-sitio-tenue">No disponible {anual ? 'anual' : 'mensual'}</p>
                    )}
                    <p className="mt-2 h-4 text-[11.5px] text-sitio-verde">
                      {conCupon !== undefined
                        ? `Cupón ${cupon!.codigo}: −${cupon!.porcentaje}%`
                        : ahorro > 0
                          ? `Ahorras ${ahorro}% frente a pagar mes a mes`
                          : ''}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <p className="mt-3 text-[12.5px] text-sitio-tenue">{oferta.resumen}</p>
                <ul className="mt-5 flex-1 space-y-2 border-t border-sitio-borde pt-5 text-[12.5px] text-sitio-suave">
                  {oferta.incluye.slice(0, 5).map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.2} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!disponible || pagando !== null}
                  onClick={() => void pagar(plan)}
                  className={cn('group boton boton-chico mt-6 w-full', esActual || oferta.destacado ? 'boton-primario' : 'boton-contorno')}
                >
                  {pagando === plan ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CreditCard aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {esActual ? 'Renovar' : 'Pagar'} con Bold
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:translate-x-1"
                  />
                </button>
              </article>
            </Aparecer>
          )
        })}
      </div>

      {/* ── Cupón ── */}
      {datos && datos.pagosHabilitados && (
        <form onSubmit={(evento) => void aplicarCupon(evento)} className="mt-4 flex flex-wrap items-center gap-2">
          <label className="relative w-full max-w-[260px]">
            <Ticket aria-hidden="true" className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-sitio-tenue" />
            <input
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
              placeholder="¿Tienes un cupón?"
              aria-label="Cupón de descuento"
              className={cn(CLASES_ENTRADA, 'pl-8 font-mono uppercase placeholder:font-sans placeholder:normal-case')}
            />
          </label>
          <BotonPanel type="submit" disabled={probando || !codigo.trim()}>
            {probando ? 'Revisando…' : 'Aplicar'}
          </BotonPanel>
          {cupon && (
            <span className="text-[12.5px] text-sitio-verde">
              Cupón {cupon.codigo} aplicado: −{cupon.porcentaje}%
              <button type="button" onClick={() => { setCupon(null); setCodigo('') }} className="ml-2 text-sitio-tenue underline-offset-4 hover:underline">
                quitar
              </button>
            </span>
          )}
          {errorCupon && <span className="text-[12.5px] text-red-300">{errorCupon}</span>}
        </form>
      )}

      {/* ── Referidos ── */}
      {referidos?.activa && referidos.codigo && (
        <Aparecer orden={4}>
          <section className="mt-10 flex flex-col gap-5 rounded-[16px] border border-sitio-borde bg-sitio-superficie p-6 md:flex-row md:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sitio-borde bg-white/[0.03]">
              <Gift aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-medium">Invita y gana {referidos.dias} días gratis</h2>
              <p className="mt-1 text-[12.5px] text-sitio-tenue">
                Cuando una tienda que invitaste pague su primer plan, te regalamos {referidos.dias} días de tu plan (o de Emprende si estás en Gratis).
                {referidos.invitadas > 0 && ` Ya invitaste a ${referidos.invitadas}.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(referidos.enlace).then(() => {
                  setCopiado(true)
                  setTimeout(() => setCopiado(false), 1800)
                })
              }
              className="direccion max-w-full shrink-0"
            >
              <span className="min-w-0 px-3">
                <span className="truncate">{referidos.enlace.replace(/^https?:\/\//, '')}</span>
              </span>
              <span className="direccion-boton">
                {copiado ? <Check aria-hidden="true" className="h-3 w-3 text-sitio-verde" /> : <Copy aria-hidden="true" className="h-3 w-3" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </span>
            </button>
          </section>
        </Aparecer>
      )}

      {/* ── Historial ── */}
      {datos && datos.pagos.length > 0 && (
        <Aparecer orden={5}>
          <section className="mt-10 rounded-[16px] border border-sitio-borde bg-sitio-superficie p-6">
            <h2 className="text-[15px] font-medium">Tus pagos</h2>
            <ul className="mt-3 divide-y divide-sitio-borde">
              {datos.pagos.map((pago) => {
                const nombre = datos.planes.find((oferta) => oferta.plan === pago.plan)?.nombre ?? pago.plan
                return (
                  <li key={pago.referencia} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 sm:grid-cols-[1fr_auto_auto]">
                    <span className="min-w-0">
                      <span className="block text-[13.5px]">
                        Plan {nombre} {pago.periodo === 'ANUAL' ? 'anual' : 'mensual'}
                      </span>
                      <span className="text-[11.5px] text-sitio-tenue">
                        {fecha(pago.creadoEn)} · <span className="font-mono">{pago.referencia}</span>
                      </span>
                    </span>
                    <span className="hidden sm:inline">
                      <Etiqueta tono={ESTADO_PAGO[pago.estado].tono}>{ESTADO_PAGO[pago.estado].texto}</Etiqueta>
                    </span>
                    <span className="text-[13.5px] tabular-nums">{formatearPrecio(pago.monto)}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        </Aparecer>
      )}
    </div>
  )
}
