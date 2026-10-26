'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, CreditCard, MessageCircle, Store, Truck } from 'lucide-react'
import { crearPedido, validarCupon, type CuponAplicado } from '@/app/(tienda)/[subdominio]/carrito/acciones'
import { guardarCarrito } from '@/app/(tienda)/[subdominio]/acciones-sitio'
import { ETIQUETAS_PAGO, type CheckoutPago, type MetodoPago, type PedidoCreado } from '@/tipos/pedidos'
import { abrirCheckout } from './abrirCheckout'
import { formatearPrecio } from '@/utilidades/formato'
import { esMedioLocal } from '@/utilidades/medios'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { calcularEnvio, type Entrega } from '@/utilidades/envios'
import { MetaEnvioGratis, SelectorCantidad, useCarrito } from './Carrito'

const SALIDA = [0.16, 1, 0.3, 1] as const

function Campo({
  etiqueta,
  nombre,
  error,
  ancho,
  ...resto
}: React.InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; nombre: string; error?: string; ancho?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${ancho ? 'sm:col-span-2' : ''}`}>
      <span className="text-tinta/70">{etiqueta}</span>
      <input
        name={nombre}
        aria-invalid={Boolean(error)}
        className={`rounded-(--radius-marca) border bg-transparent px-3.5 py-3 outline-none transition focus:border-tinta/60 ${
          error ? 'border-red-500' : 'border-tinta/15'
        }`}
        {...resto}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

/** Resumen del pedido en texto, para mandarlo por WhatsApp. */
function mensajeWhatsapp(pedido: PedidoCreado, nombreTienda: string, moneda: string) {
  const lineas = pedido.items.map(
    (item) => `• ${item.cantidad} × ${item.nombreProducto}${item.variante ? ` (${item.variante})` : ''} — ${formatearPrecio(item.subtotal, moneda)}`,
  )
  const direccion = pedido.direccionEnvio
  const recoge = direccion?.entrega === 'recoger'
  return [
    `¡Hola ${nombreTienda}! Acabo de hacer el pedido #${pedido.numero}:`,
    '',
    ...lineas,
    '',
    recoge ? 'Entrega: paso a recogerlo' : `Envío: ${Number(pedido.envio) > 0 ? formatearPrecio(pedido.envio, moneda) : 'gratis'}`,
    `Total: ${formatearPrecio(pedido.total, moneda)}`,
    `Pago: ${ETIQUETAS_PAGO[pedido.metodoPago]}`,
    '',
    `${pedido.clienteNombre} · ${pedido.clienteTelefono ?? ''}`,
    ...(recoge ? [] : [`${direccion?.direccion ?? ''}${direccion?.detalle ? `, ${direccion.detalle}` : ''}, ${direccion?.ciudad ?? ''}`]),
  ].join('\n')
}

/** Un identificador por navegador para el carrito guardado: así se actualiza en vez de duplicarse. */
function tokenCarrito(): string {
  const clave = 'mt-carrito-token'
  try {
    const guardado = localStorage.getItem(clave)
    if (guardado) return guardado
    const nuevo = crypto.randomUUID()
    localStorage.setItem(clave, nuevo)
    return nuevo
  } catch {
    return crypto.randomUUID()
  }
}

/**
 * Finalizar compra: datos de entrega, medio de pago y resumen. Al confirmar,
 * el pedido se crea en la API (que recalcula precios y aparta el stock) y, si
 * la tienda lo pide, se abre WhatsApp con el resumen listo para enviar.
 */
export function PantallaCompra({ nombreTienda }: { nombreTienda: string }) {
  const carrito = useCarrito()
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [creado, setCreado] = useState<PedidoCreado | null>(null)
  const [checkout, setCheckout] = useState<CheckoutPago | null>(null)
  const [errorPago, setErrorPago] = useState('')

  async function pagar(datos: CheckoutPago) {
    setErrorPago('')
    try {
      await abrirCheckout(datos)
    } catch (problema) {
      setErrorPago(problema instanceof Error ? problema.message : 'No pudimos abrir el pago')
    }
  }

  const ajustes = carrito?.ajustes ?? {}
  const enLinea = ajustes.pagosEnLinea ?? []
  const metodos: MetodoPago[] = [
    ...(enLinea.includes('WOMPI') ? (['wompi'] as const) : []),
    ...(enLinea.includes('EPAYCO') ? (['epayco'] as const) : []),
    ...(enLinea.includes('BOLD') ? (['bold'] as const) : []),
    ...(ajustes.pagoContraEntrega ? (['contra-entrega'] as const) : []),
    ...(ajustes.pagoTransferencia ? (['transferencia'] as const) : []),
    'acordar',
  ]
  const [metodo, setMetodo] = useState<MetodoPago>(metodos[0]!)
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState<CuponAplicado | null>(null)
  const [errorCupon, setErrorCupon] = useState('')
  const [revisandoCupon, setRevisandoCupon] = useState(false)
  const [entrega, setEntrega] = useState<Entrega>('domicilio')
  const [ciudad, setCiudad] = useState('')
  const formulario = useRef<HTMLFormElement>(null)
  const contactoDejado = useRef(false)
  const ultimoGuardado = useRef('')

  // Con el correo o el celular escritos, el carrito se guarda: si no termina,
  // la tienda puede escribirle (Clientes → Carritos abandonados).
  const lineasActuales = carrito?.lineas
  const guardar = useCallback(() => {
    const datos = formulario.current ? new FormData(formulario.current) : null
    if (!datos || !lineasActuales) return
    const texto = (clave: string) => String(datos.get(clave) ?? '').trim()
    const email = texto('email')
    const telefono = texto('telefono')
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!correoValido && telefono.replace(/\D/g, '').length < 7) return
    contactoDejado.current = true
    const datosCarrito = {
      nombre: texto('nombre') || undefined,
      email: correoValido ? email : undefined,
      telefono: telefono || undefined,
      items: lineasActuales.map((linea) => ({ productoId: linea.productoId, cantidad: linea.cantidad, variante: linea.variante })),
    }
    // Cada campo que se deja dispara esto: sólo se manda si algo cambió.
    const firma = JSON.stringify(datosCarrito)
    if (firma === ultimoGuardado.current) return
    ultimoGuardado.current = firma
    void guardarCarrito({ token: tokenCarrito(), ...datosCarrito }).catch(() => undefined)
  }, [lineasActuales])

  // Si cambia el carrito después de dejar el contacto, se actualiza.
  useEffect(() => {
    if (!contactoDejado.current) return
    const espera = setTimeout(guardar, 1500)
    return () => clearTimeout(espera)
  }, [guardar])
  const subtotalActual = carrito?.subtotal ?? 0

  // Si cambia el carrito, el descuento ya no es el mismo: se vuelve a pedir.
  useEffect(() => {
    setCupon(null)
  }, [subtotalActual])

  if (!carrito) return null
  const { lineas, subtotal, moneda } = carrito
  const descuento = cupon?.descuento ?? 0
  // La misma cuenta que hace la API: zona de la ciudad, costo general o recoger.
  const calculo = calcularEnvio(ajustes, subtotal - descuento, ciudad, entrega)
  const envio = cupon?.envioGratis || !calculo.ok ? 0 : calculo.costo
  const zona = calculo.ok ? calculo.zona : null
  const ciudadesZonas = [...new Set((ajustes.zonasEnvio ?? []).flatMap((otra) => otra.ciudades.map((nombre) => nombre.trim())).filter(Boolean))]
  const total = subtotal - descuento + envio

  async function aplicarCupon() {
    if (!codigo.trim()) return
    setRevisandoCupon(true)
    setErrorCupon('')
    const resultado = await validarCupon(codigo.trim(), subtotal)
    setRevisandoCupon(false)
    if (resultado.ok) setCupon(resultado.cupon)
    else {
      setCupon(null)
      setErrorCupon(resultado.mensaje)
    }
  }
  const porWhatsapp = Boolean(ajustes.pedidosWhatsapp && ajustes.whatsapp)
  const pagoEnLinea = metodo === 'wompi' || metodo === 'epayco' || metodo === 'bold'
  const faltaMinimo = ajustes.pedidoMinimo && subtotal < ajustes.pedidoMinimo ? ajustes.pedidoMinimo - subtotal : 0

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!carrito || enviando) return
    const datos = new FormData(evento.currentTarget)
    const texto = (clave: string) => String(datos.get(clave) ?? '').trim()

    setEnviando(true)
    setError('')
    setErrores({})
    const resultado = await crearPedido({
      cliente: {
        nombre: texto('nombre'),
        email: texto('email'),
        telefono: texto('telefono'),
        ciudad: entrega === 'recoger' ? '' : texto('ciudad'),
        direccion: entrega === 'recoger' ? '' : texto('direccion'),
        detalle: entrega === 'recoger' ? undefined : texto('detalle') || undefined,
        notas: texto('notas') || undefined,
      },
      items: carrito.lineas.map((linea) => ({ productoId: linea.productoId, cantidad: linea.cantidad, variante: linea.variante })),
      metodoPago: metodo,
      canal: porWhatsapp ? 'whatsapp' : 'web',
      cupon: cupon?.codigo,
      entrega,
    })
    setEnviando(false)

    if (!resultado.ok) {
      setErrores(resultado.campos)
      setError(Object.keys(resultado.campos).length ? 'Revisa los datos marcados en rojo.' : resultado.mensaje)
      return
    }
    setCreado(resultado.pedido)
    setCheckout(resultado.checkout)
    carrito.vaciar()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Pago en línea: directo a la pasarela; el WhatsApp va después de pagar.
    if (resultado.checkout) {
      void pagar(resultado.checkout)
      return
    }
    if (porWhatsapp && ajustes.whatsapp) {
      window.open(enlaceWhatsapp(ajustes.whatsapp, mensajeWhatsapp(resultado.pedido, nombreTienda, moneda)), '_blank')
    }
  }

  if (creado) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: SALIDA }}
        className="mx-auto max-w-xl px-6 py-20 text-center"
      >
        <CheckCircle2 aria-hidden="true" className="mx-auto h-14 w-14 text-emerald-500" strokeWidth={1.5} />
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">¡Gracias, {creado.clienteNombre.split(' ')[0]}!</h1>
        <p className="mt-3 text-tinta/70">
          Recibimos tu pedido <strong className="text-tinta">#{creado.numero}</strong> por{' '}
          <strong className="text-tinta">{formatearPrecio(creado.total, moneda)}</strong>. Te escribiremos a {creado.clienteEmail} y por
          teléfono para coordinar la entrega.
        </p>
        {creado.direccionEnvio?.entrega === 'recoger' && (
          <div className="mt-8 rounded-(--radius-marca) border border-tinta/15 p-5 text-left">
            <p className="font-medium">Dónde recogerlo</p>
            <p className="mt-2 text-sm text-tinta/75">{ajustes.direccionRecogida || ajustes.direccion || 'La tienda te escribe para contarte dónde.'}</p>
            {ajustes.horario && <p className="mt-1 text-xs text-tinta/55">{ajustes.horario}</p>}
          </div>
        )}
        {checkout && (
          <div className="mt-8 rounded-(--radius-marca) border border-tinta/15 p-5">
            <p className="font-medium">Falta el pago</p>
            <p className="mt-1 text-sm text-tinta/70">
              Si la ventana de pago no se abrió o la cerraste, ábrela otra vez. Tu pedido queda apartado mientras tanto.
            </p>
            {errorPago && <p className="mt-2 text-sm text-red-600">{errorPago}</p>}
            <button
              type="button"
              onClick={() => void pagar(checkout)}
              className="boton-tienda mt-4 inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-marca px-6 py-3.5 font-medium text-marca-contraste"
            >
              <CreditCard aria-hidden="true" className="h-5 w-5" />
              Pagar {formatearPrecio(creado.total, moneda)}
            </button>
          </div>
        )}
        {creado.metodoPago === 'transferencia' && ajustes.datosTransferencia && (
          <div className="mt-8 rounded-(--radius-marca) border border-tinta/15 p-5 text-left">
            <p className="font-medium">Datos para transferir</p>
            <p className="mt-2 text-sm whitespace-pre-line text-tinta/75">{ajustes.datosTransferencia}</p>
            <p className="mt-3 text-xs text-tinta/55">Usa el número de pedido #{creado.numero} como referencia.</p>
          </div>
        )}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          {ajustes.whatsapp && (
            <a
              href={enlaceWhatsapp(ajustes.whatsapp, mensajeWhatsapp(creado, nombreTienda, moneda))}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-[#25d366] px-6 py-3.5 font-medium text-white"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
              {porWhatsapp ? 'Enviar el pedido por WhatsApp' : 'Escribir por WhatsApp'}
            </a>
          )}
          <Link href="/" className="boton-tienda inline-flex items-center justify-center rounded-(--radius-marca) border border-tinta/20 px-6 py-3.5 font-medium">
            Seguir comprando
          </Link>
        </div>
      </motion.main>
    )
  }

  if (lineas.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Tu carrito está vacío</h1>
        <p className="mt-3 text-tinta/65">Agrega productos para hacer tu pedido.</p>
        <Link href="/" className="boton-tienda mt-8 inline-block rounded-(--radius-marca) bg-marca px-6 py-3.5 font-medium text-marca-contraste">
          Ver productos
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
      <form ref={formulario} onSubmit={confirmar} onBlur={guardar} noValidate className="flex flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Finalizar compra</h1>
          <p className="mt-2 text-tinta/65">Sin crear cuenta. Te contactamos para coordinar la entrega.</p>
        </div>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-medium">Tus datos</legend>
          <Campo etiqueta="Nombre completo" nombre="nombre" autoComplete="name" required error={errores.nombre} ancho />
          <Campo etiqueta="Correo" nombre="email" type="email" autoComplete="email" required error={errores.email} />
          <Campo etiqueta="Celular" nombre="telefono" type="tel" autoComplete="tel" required error={errores.telefono} />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-medium">Entrega</legend>
          {ajustes.recogerEnTienda && (
            <div className="grid gap-2.5 sm:col-span-2 sm:grid-cols-2">
              {(
                [
                  { valor: 'domicilio', titulo: 'A domicilio', detalle: 'Te lo llevamos', Icono: Truck },
                  {
                    valor: 'recoger',
                    titulo: 'Recoger en la tienda',
                    detalle: ajustes.direccionRecogida || ajustes.direccion || 'Sin costo de envío',
                    Icono: Store,
                  },
                ] as const
              ).map(({ valor, titulo, detalle, Icono }) => (
                <label
                  key={valor}
                  className={`flex cursor-pointer items-start gap-3 rounded-(--radius-marca) border px-4 py-3.5 transition ${
                    entrega === valor ? 'border-tinta bg-tinta/[0.03]' : 'border-tinta/15 hover:border-tinta/35'
                  }`}
                >
                  <input type="radio" name="entrega" checked={entrega === valor} onChange={() => setEntrega(valor)} className="sr-only" />
                  <Icono aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-tinta/70" strokeWidth={1.6} />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{titulo}</span>
                    <span className="truncate text-xs text-tinta/55">{detalle}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {entrega === 'domicilio' && (
            <>
              <Campo etiqueta="Dirección" nombre="direccion" autoComplete="street-address" required error={errores.direccion} ancho />
              <Campo etiqueta="Apto, torre o barrio (opcional)" nombre="detalle" error={errores.detalle} />
              <div className="flex flex-col gap-1.5">
                <Campo
                  etiqueta="Ciudad"
                  nombre="ciudad"
                  autoComplete="address-level2"
                  required
                  list={ciudadesZonas.length ? 'ciudades-envio' : undefined}
                  value={ciudad}
                  onChange={(evento) => setCiudad(evento.target.value)}
                  error={errores.ciudad ?? (!calculo.ok && ciudad.trim().length > 2 ? calculo.motivo : undefined)}
                />
                {ciudadesZonas.length > 0 && (
                  <datalist id="ciudades-envio">
                    {ciudadesZonas.map((nombre) => (
                      <option key={nombre} value={nombre} />
                    ))}
                  </datalist>
                )}
                {zona && (
                  <span className="text-xs text-tinta/60">
                    {zona.nombre}: {zona.costo > 0 ? formatearPrecio(zona.costo, moneda) : 'envío gratis'}
                    {zona.tiempo ? ` · ${zona.tiempo}` : ''}
                  </span>
                )}
              </div>
            </>
          )}
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-tinta/70">Notas para la tienda (opcional)</span>
            <textarea
              name="notas"
              rows={3}
              maxLength={500}
              className="rounded-(--radius-marca) border border-tinta/15 bg-transparent px-3.5 py-3 outline-none transition focus:border-tinta/60"
            />
          </label>
        </fieldset>

        <fieldset>
          <legend className="mb-4 font-medium">Pago</legend>
          <div className="flex flex-col gap-2.5">
            {metodos.map((opcion) => (
              <label
                key={opcion}
                className={`flex cursor-pointer items-center gap-3 rounded-(--radius-marca) border px-4 py-3.5 transition ${
                  metodo === opcion ? 'border-tinta bg-tinta/[0.03]' : 'border-tinta/15 hover:border-tinta/35'
                }`}
              >
                <input type="radio" name="metodo" checked={metodo === opcion} onChange={() => setMetodo(opcion)} className="accent-current" />
                <span className="flex-1">{ETIQUETAS_PAGO[opcion]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-(--radius-marca) bg-red-500/10 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={enviando || faltaMinimo > 0}
          className={`boton-tienda flex items-center justify-center gap-2 rounded-(--radius-marca) px-6 py-4 text-lg font-medium transition hover:opacity-90 disabled:opacity-50 ${
            porWhatsapp ? 'bg-[#25d366] text-white' : 'bg-marca text-marca-contraste'
          }`}
        >
          {pagoEnLinea ? (
            <CreditCard aria-hidden="true" className="h-5 w-5" />
          ) : (
            porWhatsapp && <MessageCircle aria-hidden="true" className="h-5 w-5" />
          )}
          {enviando
            ? 'Enviando tu pedido…'
            : faltaMinimo > 0
              ? `Faltan ${formatearPrecio(faltaMinimo, moneda)} para el pedido mínimo`
              : pagoEnLinea
                ? `Ir a pagar · ${formatearPrecio(total, moneda)}`
                : porWhatsapp
                  ? 'Pedir por WhatsApp'
                  : `Confirmar pedido · ${formatearPrecio(total, moneda)}`}
        </button>
      </form>

      <aside className="h-fit rounded-(--radius-marca) bg-tinta/[0.03] p-6 lg:sticky lg:top-24">
        <h2 className="font-medium">Tu pedido</h2>
        <ul className="mt-4 divide-y divide-tinta/10">
          {lineas.map((linea) => (
            <li key={`${linea.productoId}|${linea.variante ?? ''}`} className="flex gap-4 py-4">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-(--radius-marca) bg-tinta/5">
                {linea.foto && <Image src={linea.foto} alt="" fill sizes="64px" unoptimized={esMedioLocal(linea.foto)} className="object-cover" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <span className="truncate">
                    {linea.nombre}
                    {linea.varianteNombre && <span className="text-tinta/55"> · {linea.varianteNombre}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatearPrecio(Number(linea.precio) * linea.cantidad, moneda)}</span>
                </div>
                <div className="self-start">
                  <SelectorCantidad
                    chico
                    valor={linea.cantidad}
                    maximo={linea.stock}
                    alCambiar={(cantidad) => carrito.cambiarCantidad(linea.productoId, linea.variante, cantidad)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-tinta/10 pt-4">
          <MetaEnvioGratis subtotal={subtotal} ajustes={ajustes} moneda={moneda} />
        </div>
        <div className="mt-4 border-t border-tinta/10 pt-4">
          {cupon ? (
            <div className="flex items-center justify-between gap-3 rounded-(--radius-marca) bg-emerald-500/10 px-3.5 py-2.5 text-sm">
              <span>
                <strong className="font-semibold">{cupon.codigo}</strong> · {cupon.descripcion}
              </span>
              <button type="button" onClick={() => setCupon(null)} className="text-tinta/60 underline underline-offset-2 hover:text-tinta">
                Quitar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') {
                    evento.preventDefault()
                    void aplicarCupon()
                  }
                }}
                placeholder="Código de descuento"
                aria-label="Código de descuento"
                className="min-w-0 flex-1 rounded-(--radius-marca) border border-tinta/15 bg-transparent px-3.5 py-2.5 text-sm uppercase outline-none focus:border-tinta/60"
              />
              <button
                type="button"
                onClick={() => void aplicarCupon()}
                disabled={revisandoCupon || !codigo.trim()}
                className="boton-tienda rounded-(--radius-marca) border border-tinta/20 px-4 text-sm font-medium transition hover:bg-tinta/5 disabled:opacity-40"
              >
                {revisandoCupon ? '…' : 'Aplicar'}
              </button>
            </div>
          )}
          {errorCupon && <p className="mt-2 text-xs text-red-600">{errorCupon}</p>}
        </div>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-tinta/65">Subtotal</dt>
            <dd className="tabular-nums">{formatearPrecio(subtotal, moneda)}</dd>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Descuento</dt>
              <dd className="tabular-nums">-{formatearPrecio(descuento, moneda)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-tinta/65">{entrega === 'recoger' ? 'Entrega' : 'Envío'}</dt>
            <dd className="tabular-nums">{entrega === 'recoger' ? 'Recoges en la tienda' : envio ? formatearPrecio(envio, moneda) : 'Gratis'}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-tinta/10 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatearPrecio(total, moneda)}</dd>
          </div>
        </dl>
      </aside>
    </main>
  )
}
