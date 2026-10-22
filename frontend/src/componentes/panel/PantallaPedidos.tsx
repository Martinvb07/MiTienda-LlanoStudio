'use client'

/* eslint-disable @next/next/no-img-element -- miniaturas de productos subidas por el usuario */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Download, Mail, MapPin, MessageCircle, Phone, Search, X } from 'lucide-react'
import { actualizarPedido, listarPedidos } from '@/servicios/panel'
import { ETIQUETAS_PAGO, type EstadoPedido, type Pedido } from '@/tipos/pedidos'
import { formatearPrecio } from '@/utilidades/formato'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, CURVA, Etiqueta } from './ui/basicos'
import { Aparecer, Contador } from './ui/movimiento'
import { confirmar } from './ui/confirmar'

export const ESTADOS: { valor: EstadoPedido; etiqueta: string; tono: 'neutro' | 'verde' | 'ambar' | 'azul' }[] = [
  { valor: 'PENDIENTE', etiqueta: 'Nuevo', tono: 'ambar' },
  { valor: 'PAGADO', etiqueta: 'Pagado', tono: 'azul' },
  { valor: 'PREPARANDO', etiqueta: 'Preparando', tono: 'azul' },
  { valor: 'ENVIADO', etiqueta: 'Enviado', tono: 'azul' },
  { valor: 'ENTREGADO', etiqueta: 'Entregado', tono: 'verde' },
  { valor: 'CANCELADO', etiqueta: 'Cancelado', tono: 'neutro' },
  { valor: 'REEMBOLSADO', etiqueta: 'Reembolsado', tono: 'neutro' },
]

const ESTADO = Object.fromEntries(ESTADOS.map((estado) => [estado.valor, estado])) as Record<
  EstadoPedido,
  (typeof ESTADOS)[number]
>

/** El camino normal de un pedido, para los botones de avanzar. */
const FLUJO: EstadoPedido[] = ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO']

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos', cumple: () => true },
  { valor: 'nuevos', etiqueta: 'Nuevos', cumple: (p: Pedido) => p.estado === 'PENDIENTE' },
  { valor: 'curso', etiqueta: 'En curso', cumple: (p: Pedido) => ['PAGADO', 'PREPARANDO', 'ENVIADO'].includes(p.estado) },
  { valor: 'entregados', etiqueta: 'Entregados', cumple: (p: Pedido) => p.estado === 'ENTREGADO' },
  { valor: 'cancelados', etiqueta: 'Cancelados', cumple: (p: Pedido) => p.estado === 'CANCELADO' || p.estado === 'REEMBOLSADO' },
] as const

const vendido = (pedido: Pedido) => pedido.estado !== 'CANCELADO' && pedido.estado !== 'REEMBOLSADO'

export function fechaCorta(fecha: string) {
  return new Date(fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function exportarCsv(pedidos: Pedido[]) {
  const filas = [
    ['Pedido', 'Fecha', 'Cliente', 'Correo', 'Teléfono', 'Ciudad', 'Dirección', 'Productos', 'Pago', 'Estado', 'Subtotal', 'Envío', 'Descuento', 'Total'],
    ...pedidos.map((pedido) => [
      pedido.numero,
      new Date(pedido.creadoEn).toLocaleString('es-CO'),
      pedido.clienteNombre,
      pedido.clienteEmail,
      pedido.clienteTelefono ?? '',
      pedido.direccionEnvio?.ciudad ?? '',
      [pedido.direccionEnvio?.direccion, pedido.direccionEnvio?.detalle].filter(Boolean).join(', '),
      pedido.items.map((item) => `${item.cantidad} x ${item.nombreProducto}${item.variante ? ` (${item.variante})` : ''}`).join(' | '),
      ETIQUETAS_PAGO[pedido.metodoPago],
      ESTADO[pedido.estado].etiqueta,
      pedido.subtotal,
      pedido.envio,
      pedido.descuento,
      pedido.total,
    ]),
  ]
  const csv = filas.map((fila) => fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(',')).join('\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

/** Pedidos de la tienda: cifras del mes, filtros, búsqueda y el detalle de cada uno. */
export function PantallaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['valor']>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState<string | null>(null)
  const limites = limitesDe(useSesion().sesion.tenant.plan)

  useEffect(() => {
    listarPedidos()
      .then(setPedidos)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  const lista = useMemo(() => pedidos ?? [], [pedidos])
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const delMes = lista.filter((pedido) => vendido(pedido) && new Date(pedido.creadoEn).getTime() >= inicioMes)
  const ventasMes = delMes.reduce((suma, pedido) => suma + Number(pedido.total), 0)

  const filtrados = useMemo(() => {
    const cumple = FILTROS.find((opcion) => opcion.valor === filtro)!.cumple
    const termino = busqueda.trim().toLowerCase()
    return lista
      .filter((pedido) => cumple(pedido))
      .filter(
        (pedido) =>
          !termino ||
          String(pedido.numero).includes(termino) ||
          pedido.clienteNombre.toLowerCase().includes(termino) ||
          pedido.clienteEmail.includes(termino) ||
          (pedido.clienteTelefono ?? '').includes(termino),
      )
  }, [lista, filtro, busqueda])

  const seleccionado = lista.find((pedido) => pedido.id === abierto) ?? null

  function reemplazar(pedido: Pedido) {
    setPedidos((actuales) => (actuales ?? []).map((otro) => (otro.id === pedido.id ? pedido : otro)))
  }

  return (
    <>
      <CabeceraPanel
        titulo="Pedidos"
        descripcion="Lo que te compran en la tienda. Cambia el estado a medida que lo preparas y lo envías."
        accion={
          lista.length > 0 ? (
            <BotonPanel
              onClick={() => exportarCsv(filtrados)}
              disabled={!limites.exportarPedidos}
              title={limites.exportarPedidos ? undefined : `Desde el plan ${planMinimo((plan) => plan.exportarPedidos)}`}
              className="h-10 px-4"
            >
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Exportar a Excel
            </BotonPanel>
          ) : undefined
        }
      />

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { etiqueta: 'Nuevos por atender', valor: lista.filter((pedido) => pedido.estado === 'PENDIENTE').length, alerta: true },
          {
            etiqueta: 'En camino',
            valor: lista.filter((pedido) => ['PAGADO', 'PREPARANDO', 'ENVIADO'].includes(pedido.estado)).length,
          },
          { etiqueta: 'Ventas del mes', valor: ventasMes, formato: (n: number) => formatearPrecio(Math.round(n)) },
          {
            etiqueta: 'Ticket promedio',
            valor: delMes.length ? ventasMes / delMes.length : 0,
            formato: (n: number) => formatearPrecio(Math.round(n)),
          },
        ].map((cifra, indice) => (
          <Aparecer key={cifra.etiqueta} orden={indice}>
            <div className="h-full rounded-[16px] border border-sitio-borde bg-sitio-superficie p-5">
              <p className="text-[11.5px] text-sitio-tenue">{cifra.etiqueta}</p>
              <p
                className={cn(
                  'mt-3 truncate text-[clamp(22px,2.6vw,32px)] leading-none tracking-[-0.04em]',
                  cifra.alerta && cifra.valor > 0 && 'text-sitio-ambar',
                )}
              >
                {pedidos ? <Contador valor={cifra.valor} formato={cifra.formato} /> : '—'}
              </p>
            </div>
          </Aparecer>
        ))}
      </div>

      {pedidos && pedidos.length === 0 ? (
        <Aparecer>
          <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]" />
            <p className="text-2xl tracking-[-0.03em]">Todavía no tienes pedidos</p>
            <p className="mt-2 max-w-sm text-sm text-sitio-tenue">
              Cuando alguien compre en tu tienda, aparece aquí con sus datos de entrega y lo que pidió.
            </p>
          </div>
        </Aparecer>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {FILTROS.map((opcion) => {
                const activo = filtro === opcion.valor
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setFiltro(opcion.valor)}
                    className={cn(
                      'relative flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] transition-colors',
                      activo ? 'text-black' : 'text-sitio-suave hover:text-white',
                    )}
                  >
                    {activo ? (
                      <motion.span layoutId="filtro-pedidos" transition={{ duration: 0.5, ease: CURVA }} className="absolute inset-0 rounded-full bg-white" />
                    ) : (
                      <span className="absolute inset-0 rounded-full border border-sitio-borde" />
                    )}
                    <span className="relative">{opcion.etiqueta}</span>
                    <span className={cn('relative text-[11px]', activo ? 'text-black/50' : 'text-sitio-tenue')}>
                      {lista.filter((pedido) => opcion.cumple(pedido)).length}
                    </span>
                  </button>
                )
              })}
            </div>
            <label className="flex h-[36px] items-center gap-2 rounded-lg border border-sitio-borde bg-sitio-campo px-3 focus-within:border-white/40 lg:w-72">
              <Search aria-hidden="true" className="h-3.5 w-3.5 text-sitio-tenue" />
              <input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Número, cliente o teléfono"
                aria-label="Buscar pedidos"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-sitio-tenue"
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-sitio-borde bg-sitio-superficie">
            {!pedidos ? (
              <div className="flex flex-col gap-2 p-4">
                {[0, 1, 2].map((indice) => (
                  <div key={indice} className="brillo h-14 rounded-lg" />
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <p className="px-6 py-14 text-center text-sm text-sitio-tenue">Ningún pedido coincide.</p>
            ) : (
              <ul className="divide-y divide-sitio-borde">
                <AnimatePresence initial={false}>
                  {filtrados.map((pedido, indice) => (
                    <motion.li
                      key={pedido.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(indice, 10) * 0.03, ease: CURVA }}
                    >
                      <button
                        type="button"
                        onClick={() => setAbierto(pedido.id)}
                        className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-white/[0.025] md:grid-cols-[90px_1.4fr_1fr_110px_120px]"
                      >
                        <span className="font-mono text-[13px] text-sitio-suave">#{pedido.numero}</span>
                        <span className="justify-self-end md:hidden">
                          <Etiqueta tono={ESTADO[pedido.estado].tono}>{ESTADO[pedido.estado].etiqueta}</Etiqueta>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px]">{pedido.clienteNombre}</span>
                          <span className="block truncate text-[12px] text-sitio-tenue">
                            {pedido.items.reduce((suma, item) => suma + item.cantidad, 0)} productos · {pedido.direccionEnvio?.ciudad}
                          </span>
                        </span>
                        <span className="hidden text-[12.5px] text-sitio-tenue md:block">
                          {fechaCorta(pedido.creadoEn)}
                          {pedido.canal === 'whatsapp' && <MessageCircle aria-label="Por WhatsApp" className="ml-1.5 inline h-3.5 w-3.5 text-[#4ee28a]" />}
                        </span>
                        <span className="hidden md:block">
                          <Etiqueta tono={ESTADO[pedido.estado].tono}>{ESTADO[pedido.estado].etiqueta}</Etiqueta>
                        </span>
                        <span className="text-right text-[14px] tabular-nums md:text-right">{formatearPrecio(pedido.total)}</span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {seleccionado && (
          <DetallePedido pedido={seleccionado} alCambiar={reemplazar} alError={setError} alCerrar={() => setAbierto(null)} />
        )}
      </AnimatePresence>
    </>
  )
}

function DetallePedido({
  pedido,
  alCambiar,
  alError,
  alCerrar,
}: {
  pedido: Pedido
  alCambiar: (pedido: Pedido) => void
  alError: (mensaje: string) => void
  alCerrar: () => void
}) {
  const { sesion } = useSesion()
  const [guardando, setGuardando] = useState(false)
  const [nota, setNota] = useState(pedido.notaInterna ?? '')
  const indice = FLUJO.indexOf(pedido.estado)
  const siguiente = indice >= 0 && indice < FLUJO.length - 1 ? FLUJO[indice + 1] : null
  const tienda = sesion.tienda?.nombre ?? 'la tienda'

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [alCerrar])

  async function cambiar(cambios: { estado?: EstadoPedido; notaInterna?: string | null }) {
    setGuardando(true)
    try {
      alCambiar(await actualizarPedido(pedido.id, cambios))
    } catch (problema) {
      alError(problema instanceof Error ? problema.message : 'No se pudo actualizar el pedido')
    } finally {
      setGuardando(false)
    }
  }

  const mensajeCliente: Partial<Record<EstadoPedido, string>> = {
    PENDIENTE: `Hola ${pedido.clienteNombre.split(' ')[0]}, recibimos tu pedido #${pedido.numero} en ${tienda}. ¡Gracias por tu compra!`,
    PAGADO: `Hola ${pedido.clienteNombre.split(' ')[0]}, confirmamos el pago de tu pedido #${pedido.numero}. Ya lo estamos preparando.`,
    ENVIADO: `Hola ${pedido.clienteNombre.split(' ')[0]}, tu pedido #${pedido.numero} ya va en camino.`,
    ENTREGADO: `Hola ${pedido.clienteNombre.split(' ')[0]}, ¿te llegó bien tu pedido #${pedido.numero}? Gracias por comprar en ${tienda}.`,
  }

  return (
    <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label={`Pedido ${pedido.numero}`}>
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={alCerrar}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.55, ease: CURVA }}
        className="marco-oscuro absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-sitio-borde bg-sitio-lateral font-sans"
      >
        <header className="flex items-start justify-between gap-4 border-b border-sitio-borde px-6 py-5">
          <div>
            <p className="font-mono text-[12px] text-sitio-tenue">{fechaCorta(pedido.creadoEn)}</p>
            <h2 className="mt-1 text-[26px] tracking-[-0.03em]">Pedido #{pedido.numero}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Etiqueta tono={ESTADO[pedido.estado].tono}>{ESTADO[pedido.estado].etiqueta}</Etiqueta>
              <Etiqueta>{ETIQUETAS_PAGO[pedido.metodoPago]}</Etiqueta>
              {pedido.canal === 'whatsapp' && <Etiqueta tono="verde">Por WhatsApp</Etiqueta>}
            </div>
          </div>
          <button type="button" onClick={alCerrar} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full text-sitio-tenue hover:bg-white/[0.07] hover:text-white">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Avance del pedido */}
          <ol className="flex items-center gap-1">
            {FLUJO.map((paso, posicion) => (
              <li key={paso} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={cn(
                    'h-1 rounded-full transition-colors duration-500',
                    indice >= posicion && pedido.estado !== 'CANCELADO' ? 'bg-sitio-verde' : 'bg-white/10',
                  )}
                />
                <span className={cn('text-[10.5px]', indice >= posicion ? 'text-sitio-suave' : 'text-sitio-tenue')}>
                  {ESTADO[paso].etiqueta}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {siguiente && (
              <BotonPanel variante="primario" disabled={guardando} onClick={() => void cambiar({ estado: siguiente })}>
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
                Marcar como {ESTADO[siguiente].etiqueta.toLowerCase()}
              </BotonPanel>
            )}
            {pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
              <BotonPanel
                variante="peligro"
                disabled={guardando}
                onClick={async () => {
                  const si = await confirmar({
                    titulo: `¿Cancelar el pedido #${pedido.numero}?`,
                    mensaje: 'Las unidades vuelven a tu inventario. Puedes reactivarlo después.',
                    confirmar: 'Cancelar pedido',
                    cancelar: 'Volver',
                    peligro: true,
                  })
                  if (si) void cambiar({ estado: 'CANCELADO' })
                }}
              >
                Cancelar pedido
              </BotonPanel>
            )}
            {pedido.estado === 'CANCELADO' && (
              <BotonPanel disabled={guardando} onClick={() => void cambiar({ estado: 'PENDIENTE' })}>
                Reactivar
              </BotonPanel>
            )}
          </div>

          <h3 className="mt-8 text-[11px] tracking-[0.14em] text-sitio-tenue uppercase">Cliente</h3>
          <div className="mt-3 rounded-xl border border-sitio-borde p-4">
            <p className="text-[15px]">{pedido.clienteNombre}</p>
            <div className="mt-3 flex flex-col gap-2 text-[13px] text-sitio-suave">
              <a href={`mailto:${pedido.clienteEmail}`} className="flex items-center gap-2 hover:text-white">
                <Mail aria-hidden="true" className="h-3.5 w-3.5" /> {pedido.clienteEmail}
              </a>
              {pedido.clienteTelefono && (
                <a href={`tel:${pedido.clienteTelefono}`} className="flex items-center gap-2 hover:text-white">
                  <Phone aria-hidden="true" className="h-3.5 w-3.5" /> {pedido.clienteTelefono}
                </a>
              )}
              <p className="flex items-start gap-2">
                <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {pedido.direccionEnvio?.direccion}
                  {pedido.direccionEnvio?.detalle ? `, ${pedido.direccionEnvio.detalle}` : ''}
                  <br />
                  {pedido.direccionEnvio?.ciudad}
                </span>
              </p>
            </div>
            {pedido.clienteTelefono && (
              <a
                href={enlaceWhatsapp(pedido.clienteTelefono, mensajeCliente[pedido.estado] ?? `Hola ${pedido.clienteNombre.split(' ')[0]}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/[0.08] text-[13px] text-[#4ee28a] transition-colors hover:bg-[#25d366]/[0.15]"
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                Escribirle por WhatsApp
              </a>
            )}
            {pedido.notas && (
              <p className="mt-4 rounded-lg bg-white/[0.04] px-3 py-2.5 text-[13px] text-sitio-suave">“{pedido.notas}”</p>
            )}
          </div>

          <h3 className="mt-8 text-[11px] tracking-[0.14em] text-sitio-tenue uppercase">Productos</h3>
          <ul className="mt-3 divide-y divide-sitio-borde rounded-xl border border-sitio-borde">
            {pedido.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sitio-superficie-2">
                  {item.foto && <img src={item.foto} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px]">{item.nombreProducto}</span>
                  <span className="text-[12px] text-sitio-tenue">
                    {item.cantidad} × {formatearPrecio(item.precioUnitario)}
                    {item.variante ? ` · ${item.variante}` : ''}
                  </span>
                </span>
                <span className="text-[13.5px] tabular-nums">{formatearPrecio(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between text-sitio-suave">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatearPrecio(pedido.subtotal)}</dd>
            </div>
            {Number(pedido.descuento) > 0 && (
              <div className="flex justify-between text-sitio-suave">
                <dt>Descuento {pedido.cupon ? `(${pedido.cupon})` : ''}</dt>
                <dd className="tabular-nums">-{formatearPrecio(pedido.descuento)}</dd>
              </div>
            )}
            <div className="flex justify-between text-sitio-suave">
              <dt>Envío</dt>
              <dd className="tabular-nums">{Number(pedido.envio) ? formatearPrecio(pedido.envio) : 'Gratis'}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-sitio-borde pt-2 text-[16px]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatearPrecio(pedido.total)}</dd>
            </div>
          </dl>

          <h3 className="mt-8 text-[11px] tracking-[0.14em] text-sitio-tenue uppercase">Nota interna</h3>
          <textarea
            value={nota}
            onChange={(evento) => setNota(evento.target.value)}
            onBlur={() => nota !== (pedido.notaInterna ?? '') && void cambiar({ notaInterna: nota })}
            rows={3}
            maxLength={1000}
            placeholder="Sólo la ves tú: número de guía, acuerdos con el cliente…"
            className="mt-3 w-full resize-y rounded-lg border border-sitio-borde bg-sitio-campo px-3 py-2.5 text-[13px] outline-none placeholder:text-sitio-tenue focus:border-white/40"
          />
        </div>
      </motion.aside>
    </div>
  )
}
