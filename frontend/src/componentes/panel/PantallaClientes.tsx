'use client'

/* eslint-disable @next/next/no-img-element -- fotos de productos subidas por la tienda */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Check, Download, Mail, MessageCircle, Receipt, Search, ShoppingCart, Users, X } from 'lucide-react'
import {
  actualizarCarrito,
  listarCarritos,
  listarClientes,
  type CarritoPanel,
  type ClientePanel,
} from '@/servicios/panel'
import { formatearPrecio } from '@/utilidades/formato'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { urlTienda } from '@/utilidades/dominios'
import { vendeEnLinea } from '@/utilidades/sitio'
import { enlaceWhatsapp } from '@/utilidades/whatsapp'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useAvisos } from './Avisos'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, CLASES_ENTRADA, CURVA, Etiqueta, Segmentado } from './ui/basicos'
import { ModalPanel } from './ui/flotantes'
import { Aparecer } from './ui/movimiento'

type Orden = 'recientes' | 'gasto' | 'pedidos'

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric' })

function hace(iso: string) {
  const horas = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (horas < 24) return `hace ${Math.max(1, horas)} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

function exportarCsv(clientes: ClientePanel[]) {
  const filas = [
    ['Nombre', 'Correo', 'Celular', 'Ciudad', 'Pedidos', 'Citas', 'Total comprado', 'Primera vez', 'Última vez'],
    ...clientes.map((cliente) => [
      cliente.nombre,
      cliente.email ?? '',
      cliente.telefono ?? '',
      cliente.ciudad ?? '',
      cliente.pedidos,
      cliente.citas,
      cliente.gastado,
      cliente.primeraVez.slice(0, 10),
      cliente.ultimaVez.slice(0, 10),
    ]),
  ]
  const csv = filas.map((fila) => fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(',')).join('\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

/**
 * Quiénes te compran o te agendan, con lo que llevan gastado, y los carritos
 * que se quedaron a medias para escribirles por WhatsApp.
 */
export function PantallaClientes() {
  const { sesion } = useSesion()
  const { recargar } = useAvisos()
  const vende = vendeEnLinea(sesion.tienda?.tipo)
  const limites = limitesDe(sesion.tenant.plan)
  const [pestana, setPestana] = useState<'clientes' | 'carritos'>('clientes')
  const [clientes, setClientes] = useState<ClientePanel[] | null>(null)
  const [carritos, setCarritos] = useState<CarritoPanel[] | null>(null)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [abierto, setAbierto] = useState<ClientePanel | null>(null)

  useEffect(() => {
    listarClientes()
      .then(setClientes)
      .catch((problema: Error) => setError(problema.message))
    if (vende)
      listarCarritos()
        .then(setCarritos)
        .catch((problema: Error) => setError(problema.message))
  }, [vende])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const filtrados = (clientes ?? []).filter(
      (cliente) => !texto || [cliente.nombre, cliente.email, cliente.telefono, cliente.ciudad].some((dato) => dato?.toLowerCase().includes(texto)),
    )
    return [...filtrados].sort((a, b) =>
      orden === 'gasto' ? b.gastado - a.gastado : orden === 'pedidos' ? b.pedidos + b.citas - (a.pedidos + a.citas) : b.ultimaVez.localeCompare(a.ultimaVez),
    )
  }, [clientes, busqueda, orden])

  const recurrentes = (clientes ?? []).filter((cliente) => cliente.pedidos + cliente.citas > 1).length
  const abiertos = (carritos ?? []).filter((carrito) => carrito.estado === 'ABIERTO')
  const recuperados = (carritos ?? []).filter((carrito) => carrito.estado === 'RECUPERADO')

  async function cambiarCarrito(carrito: CarritoPanel, cambios: { estado?: CarritoPanel['estado']; contactado?: boolean }) {
    setError('')
    setCarritos((lista) =>
      (lista ?? []).map((otro) =>
        otro.id === carrito.id
          ? {
              ...otro,
              ...(cambios.estado ? { estado: cambios.estado } : {}),
              ...(cambios.contactado !== undefined ? { contactadoEn: cambios.contactado ? new Date().toISOString() : null } : {}),
            }
          : otro,
      ),
    )
    try {
      await actualizarCarrito(carrito.id, cambios)
      recargar()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    }
  }

  function mensajeCarrito(carrito: CarritoPanel) {
    const nombre = carrito.nombre?.split(' ')[0]
    const lista = carrito.items.map((item) => `• ${item.cantidad} × ${item.nombre}${item.variante ? ` (${item.variante})` : ''}`).join('\n')
    return `Hola${nombre ? ` ${nombre}` : ''}, te escribo de ${sesion.tienda?.nombre ?? 'la tienda'}. Vimos que dejaste esto en el carrito:\n${lista}\n¿Te ayudo a terminar el pedido? ${urlTienda(sesion.tenant.subdominio)}`
  }

  return (
    <>
      <CabeceraPanel
        titulo="Clientes"
        descripcion={
          clientes
            ? `${clientes.length} ${clientes.length === 1 ? 'persona' : 'personas'}${recurrentes ? ` · ${recurrentes} volvieron más de una vez` : ''}${
                recuperados.length ? ` · ${recuperados.length} carritos recuperados` : ''
              }`
            : 'Quiénes te compran y te agendan.'
        }
        accion={
          pestana === 'clientes' && (clientes?.length ?? 0) > 0 ? (
            <BotonPanel
              onClick={() => exportarCsv(visibles)}
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

      {vende && (
        <div className="mb-6">
          <Segmentado
            opciones={[
              { valor: 'clientes', etiqueta: 'Clientes' },
              { valor: 'carritos', etiqueta: `Carritos abandonados${abiertos.length ? ` (${abiertos.length})` : ''}` },
            ]}
            valor={pestana}
            alCambiar={setPestana}
          />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {pestana === 'clientes' ? (
          <motion.div key="clientes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: CURVA }}>
            {!clientes ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((indice) => (
                  <div key={indice} className="brillo h-16 rounded-[16px]" />
                ))}
              </div>
            ) : clientes.length === 0 ? (
              <Aparecer>
                <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]" />
                  <Users aria-hidden="true" className="h-9 w-9 text-sitio-tenue" strokeWidth={1.4} />
                  <p className="mt-4 text-2xl tracking-[-0.03em]">Aquí verás a tus clientes</p>
                  <p className="mt-2 max-w-md text-sm text-sitio-tenue">
                    Cada persona que te compre o agende aparece una sola vez, con todo lo que ha hecho contigo.
                  </p>
                </div>
              </Aparecer>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="relative flex-1">
                    <Search aria-hidden="true" className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-sitio-tenue" />
                    <input
                      value={busqueda}
                      onChange={(evento) => setBusqueda(evento.target.value)}
                      placeholder="Buscar por nombre, correo, celular o ciudad"
                      aria-label="Buscar clientes"
                      className={cn(CLASES_ENTRADA, 'pl-9')}
                    />
                  </label>
                  <Segmentado
                    opciones={[
                      { valor: 'recientes', etiqueta: 'Recientes' },
                      { valor: 'gasto', etiqueta: 'Más compran' },
                      { valor: 'pedidos', etiqueta: 'Más vuelven' },
                    ]}
                    valor={orden}
                    alCambiar={setOrden}
                    chico
                  />
                </div>
                <ul className="overflow-hidden rounded-[16px] border border-sitio-borde bg-sitio-superficie">
                  {visibles.map((cliente) => (
                    <li key={cliente.clave} className="border-b border-sitio-borde last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setAbierto(cliente)}
                        className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_140px_120px] sm:px-5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[14px]">{cliente.nombre}</span>
                          <span className="block truncate text-[12px] text-sitio-tenue">
                            {[cliente.email, cliente.telefono, cliente.ciudad].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="hidden text-[12.5px] text-sitio-suave sm:block">
                          {[cliente.pedidos && `${cliente.pedidos} ${cliente.pedidos === 1 ? 'pedido' : 'pedidos'}`, cliente.citas && `${cliente.citas} ${cliente.citas === 1 ? 'cita' : 'citas'}`]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </span>
                        <span className="text-right text-[13.5px] tabular-nums">{cliente.gastado ? formatearPrecio(cliente.gastado) : <span className="text-sitio-tenue">—</span>}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {visibles.length === 0 && <p className="mt-6 text-center text-sm text-sitio-tenue">Nadie coincide con “{busqueda}”.</p>}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="carritos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: CURVA }}>
            <p className="mb-4 max-w-2xl text-[13px] text-sitio-tenue">
              Personas que escribieron su correo o celular al pagar y no terminaron. Escríbeles: muchas sólo tenían una duda. Si después compran, el
              carrito pasa solo a recuperado.
            </p>
            {!carritos ? (
              <div className="brillo h-24 rounded-[16px]" />
            ) : carritos.length === 0 ? (
              <p className="rounded-[16px] border border-sitio-borde px-6 py-14 text-center text-sm text-sitio-tenue">
                <ShoppingCart aria-hidden="true" className="mx-auto mb-3 h-7 w-7" strokeWidth={1.4} />
                No hay carritos abandonados. ¡Bien!
              </p>
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {carritos.map((carrito) => (
                  <li key={carrito.id} className={cn('flex flex-col rounded-[16px] border border-sitio-borde bg-sitio-superficie p-5', carrito.estado !== 'ABIERTO' && 'opacity-60')}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-[14px]">{carrito.nombre || carrito.email || carrito.telefono}</span>
                        <span className="block truncate text-[12px] text-sitio-tenue">
                          {[carrito.email, carrito.telefono].filter(Boolean).join(' · ')} · {hace(carrito.actualizadoEn)}
                        </span>
                      </span>
                      {carrito.estado === 'RECUPERADO' ? (
                        <Etiqueta tono="verde">Compró</Etiqueta>
                      ) : carrito.estado === 'DESCARTADO' ? (
                        <Etiqueta>Descartado</Etiqueta>
                      ) : carrito.contactadoEn ? (
                        <Etiqueta tono="azul">{carrito.recordatorioEnviado ? 'Correo enviado' : 'Contactado'}</Etiqueta>
                      ) : (
                        <Etiqueta tono="ambar">Sin contactar</Etiqueta>
                      )}
                    </div>
                    <ul className="mt-4 flex flex-col gap-2">
                      {carrito.items.map((item) => (
                        <li key={`${item.productoId}-${item.variante ?? ''}`} className="flex items-center gap-3 text-[13px]">
                          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                            {item.foto && <img src={item.foto} alt="" className="h-full w-full object-cover" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sitio-suave">
                            {item.cantidad} × {item.nombre}
                            {item.variante && <span className="text-sitio-tenue"> · {item.variante}</span>}
                          </span>
                          <span className="tabular-nums text-sitio-tenue">{formatearPrecio(item.precio * item.cantidad)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t border-sitio-borde pt-3 text-[13px]">
                      <span className="text-sitio-tenue">Total</span>
                      <span className="tabular-nums">{formatearPrecio(carrito.subtotal)}</span>
                    </div>
                    {carrito.estado === 'ABIERTO' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {carrito.telefono && (
                          <a
                            href={enlaceWhatsapp(carrito.telefono, mensajeCarrito(carrito))}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => void cambiarCarrito(carrito, { contactado: true })}
                            className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/[0.08] px-3 text-[12.5px] text-[#4ee28a] transition-colors hover:bg-[#25d366]/[0.15]"
                          >
                            <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" /> Escribirle por WhatsApp
                          </a>
                        )}
                        {carrito.email && (
                          <a
                            href={`mailto:${carrito.email}?subject=${encodeURIComponent(`Tu carrito en ${sesion.tienda?.nombre ?? 'la tienda'}`)}&body=${encodeURIComponent(mensajeCarrito(carrito))}`}
                            onClick={() => void cambiarCarrito(carrito, { contactado: true })}
                            className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.04] px-3 text-[12.5px] text-sitio-suave transition-colors hover:text-white"
                          >
                            <Mail aria-hidden="true" className="h-3.5 w-3.5" /> Correo
                          </a>
                        )}
                        <span className="flex-1" />
                        <BotonPanel variante="fantasma" onClick={() => void cambiarCarrito(carrito, { estado: 'RECUPERADO' })} title="Ya compró por otro lado">
                          <Check aria-hidden="true" className="h-3.5 w-3.5" />
                        </BotonPanel>
                        <BotonPanel variante="fantasma" onClick={() => void cambiarCarrito(carrito, { estado: 'DESCARTADO' })} title="Descartar">
                          <X aria-hidden="true" className="h-3.5 w-3.5" />
                        </BotonPanel>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {abierto && (
          <ModalPanel
            titulo={abierto.nombre}
            descripcion={`Desde ${fechaCorta(abierto.primeraVez)}${abierto.gastado ? ` · ${formatearPrecio(abierto.gastado)} en compras` : ''}`}
            alCerrar={() => setAbierto(null)}
          >
            <div className="flex flex-wrap gap-2">
              {abierto.telefono && (
                <a
                  href={enlaceWhatsapp(abierto.telefono, `Hola ${abierto.nombre.split(' ')[0]}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/[0.08] px-3 text-[12.5px] text-[#4ee28a] transition-colors hover:bg-[#25d366]/[0.15]"
                >
                  <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" /> {abierto.telefono}
                </a>
              )}
              {abierto.email && (
                <a href={`mailto:${abierto.email}`} className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.04] px-3 text-[12.5px] text-sitio-suave hover:text-white">
                  <Mail aria-hidden="true" className="h-3.5 w-3.5" /> {abierto.email}
                </a>
              )}
            </div>
            <ul className="mt-5 flex max-h-[50vh] flex-col overflow-y-auto rounded-xl border border-sitio-borde">
              {abierto.historial.map((paso) => (
                <li key={`${paso.tipo}-${paso.id}`} className="flex items-center gap-3 border-b border-sitio-borde px-4 py-3 text-[13px] last:border-b-0">
                  {paso.tipo === 'pedido' ? (
                    <Receipt aria-hidden="true" className="h-4 w-4 shrink-0 text-sitio-tenue" />
                  ) : (
                    <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-sitio-tenue" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{paso.titulo}</span>
                    <span className="text-[11.5px] text-sitio-tenue">
                      {fechaCorta(paso.fecha)} · {paso.estado.toLowerCase().replace('_', ' ')}
                    </span>
                  </span>
                  {paso.total && <span className="tabular-nums text-sitio-suave">{formatearPrecio(paso.total)}</span>}
                </li>
              ))}
            </ul>
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}
