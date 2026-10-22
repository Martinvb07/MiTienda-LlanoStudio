'use client'

/* eslint-disable @next/next/no-img-element -- miniaturas subidas por el usuario */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  EyeOff,
  ImageOff,
  LayoutTemplate,
  Package,
  PackageX,
  Palette,
  Plus,
  Share2,
  Sparkles,
} from 'lucide-react'
import { listarPedidos, listarProductos } from '@/servicios/panel'
import type { Pedido } from '@/tipos/pedidos'
import type { ProductoPanel } from '@/tipos/tienda'
import { urlTienda } from '@/utilidades/dominios'
import { formatearPrecio } from '@/utilidades/formato'
import { limitesDe } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'
import { Aparecer, Contador, SALIDA } from './ui/movimiento'
import { ESTADOS, fechaCorta } from './PantallaPedidos'
import { Etiqueta } from './ui/basicos'

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function haceCuanto(fecha: string) {
  const minutos = Math.round((Date.now() - new Date(fecha).getTime()) / 60000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

const TARJETA = 'rounded-[16px] border border-sitio-borde bg-sitio-superficie'

/** Portada del panel: cómo va la tienda, qué falta y qué hacer ahora. */
export function PantallaResumen() {
  const { sesion } = useSesion()
  const [productos, setProductos] = useState<ProductoPanel[] | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    listarProductos()
      .then(setProductos)
      .catch(() => setProductos([]))
    listarPedidos()
      .then(setPedidos)
      .catch(() => setPedidos([]))
  }, [])

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const ventasMes = pedidos
    .filter((pedido) => !['CANCELADO', 'REEMBOLSADO'].includes(pedido.estado) && new Date(pedido.creadoEn).getTime() >= inicioMes)
    .reduce((suma, pedido) => suma + Number(pedido.total), 0)
  const nuevos = pedidos.filter((pedido) => pedido.estado === 'PENDIENTE').length

  const lista = productos ?? []
  const visibles = lista.filter((producto) => producto.activo)
  const agotados = lista.filter((producto) => producto.activo && producto.stock === 0)
  const sinFoto = lista.filter((producto) => producto.fotos.length === 0)
  const ocultos = lista.filter((producto) => !producto.activo)
  const recientes = [...lista]
    .sort((a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime())
    .slice(0, 4)

  const plan = limitesDe(sesion.tenant.plan)
  const publicada = sesion.tienda?.publicada ?? false
  const direccion = urlTienda(sesion.tenant.subdominio)
  const direccionCorta = direccion.replace(/^https?:\/\//, '')
  const nombreTienda = sesion.tienda?.nombre ?? 'Tu tienda'

  const pasos = [
    {
      hecho: Boolean(sesion.tienda?.logoUrl),
      titulo: 'Dale tu identidad',
      texto: 'Sube tu logo, elige colores y arma la portada.',
      href: '/panel/plantillas?editar=1',
      accion: 'Abrir editor',
    },
    {
      hecho: visibles.length > 0,
      titulo: 'Agrega tus productos',
      texto: 'Nombre, fotos y precio. Puedes ocultarlos mientras los terminas.',
      href: '/panel/productos?nuevo=1',
      accion: 'Agregar',
    },
    {
      hecho: publicada,
      titulo: 'Publica tu tienda',
      texto: 'Actívala en el editor, sección Publicación, y comparte tu dirección.',
      href: '/panel/plantillas?editar=1',
      accion: 'Publicar',
    },
  ]
  const hechos = pasos.filter((paso) => paso.hecho).length

  const atencion = [
    { cantidad: agotados.length, texto: ['agotado y visible', 'agotados y visibles'], filtro: 'agotados', Icono: PackageX },
    { cantidad: sinFoto.length, texto: ['sin foto', 'sin foto'], filtro: 'sin-foto', Icono: ImageOff },
    { cantidad: ocultos.length, texto: ['oculto', 'ocultos'], filtro: 'ocultos', Icono: EyeOff },
  ].filter((item) => item.cantidad > 0)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(direccion)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      // Sin permiso de portapapeles: el enlace sigue visible para copiarlo a mano.
    }
  }

  const mensaje = encodeURIComponent(`¡Mira mi tienda ${nombreTienda}! ${direccion}`)

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* ── Portada ── */}
      <Aparecer>
        <section className={cn(TARJETA, 'relative isolate overflow-hidden px-6 py-8 md:px-10 md:py-11')}>
          <motion.div
            aria-hidden="true"
            className="absolute -top-40 -right-24 -z-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(59,96,255,0.28),transparent_65%)] blur-2xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)] bg-[size:44px_44px]"
          />

          <span className="antetitulo">
            {saludo()}, {sesion.usuario.nombre.split(' ')[0]}
          </span>
          <h1 className="mt-3 max-w-[16ch] text-[clamp(34px,5vw,64px)] leading-[0.98] font-normal tracking-[-0.05em]">
            {nombreTienda}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                publicada
                  ? 'border-sitio-verde/30 bg-sitio-verde/[0.08] text-sitio-verde'
                  : 'border-sitio-ambar/30 bg-sitio-ambar/[0.08] text-sitio-ambar',
              )}
            >
              <span className="relative flex h-1.5 w-1.5">
                {publicada && <span className="absolute h-full w-full animate-ping rounded-full bg-current opacity-60" />}
                <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              {publicada ? 'En línea' : 'Borrador'}
            </span>
            <button
              type="button"
              onClick={() => void copiar()}
              className="group inline-flex min-w-0 items-center gap-2 rounded-full border border-sitio-borde bg-black/30 py-1 pr-2.5 pl-3 font-mono text-[12px] text-sitio-suave transition-colors hover:border-white/25 hover:text-white"
            >
              <span className="truncate">{direccionCorta}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copiado ? 'si' : 'no'}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.25 }}
                >
                  {copiado ? (
                    <Check aria-label="Copiado" className="h-3.5 w-3.5 text-sitio-verde" />
                  ) : (
                    <Copy aria-label="Copiar enlace" className="h-3.5 w-3.5" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            <Link href="/panel/plantillas?editar=1" className="group boton boton-primario boton-chico col-span-2">
              Editar diseño
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:translate-x-1"
              />
            </Link>
            <Link href="/panel/productos?nuevo=1" className="boton boton-contorno boton-chico">
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Nuevo producto
            </Link>
            <a href={direccion} target="_blank" rel="noopener noreferrer" className="boton boton-contorno boton-chico">
              Ver tienda
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      </Aparecer>

      {/* ── Cifras ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        {[
          {
            etiqueta: 'Productos',
            valor: lista.length,
            pie: plan.productos === null ? 'Sin límite en tu plan' : `de ${plan.productos} en plan ${plan.nombre}`,
            uso: plan.productos === null ? null : lista.length / plan.productos,
          },
          {
            etiqueta: 'Ventas del mes',
            valor: ventasMes,
            pie: `${pedidos.length} pedidos en total`,
            formato: (numero: number) => formatearPrecio(Math.round(numero)),
          },
          { etiqueta: 'Pedidos nuevos', valor: nuevos, pie: nuevos ? 'Por confirmar y preparar' : 'Todo al día', alerta: nuevos > 0 },
          {
            etiqueta: 'Agotados',
            valor: agotados.length,
            pie: agotados.length ? 'Repón stock u ocúltalos' : 'Todo con stock',
            alerta: agotados.length > 0,
          },
        ].map((cifra, indice) => (
          <Aparecer key={cifra.etiqueta} orden={indice + 1}>
            <div className={cn(TARJETA, 'group h-full p-5 transition-colors duration-300 hover:border-white/15')}>
              <p className="text-[11.5px] text-sitio-tenue">{cifra.etiqueta}</p>
              <p
                className={cn(
                  'mt-3 truncate text-[clamp(22px,3vw,38px)] leading-none tracking-[-0.045em]',
                  cifra.alerta && 'text-sitio-ambar',
                )}
              >
                {productos ? <Contador valor={cifra.valor} formato={cifra.formato} /> : '—'}
              </p>
              {'uso' in cifra && cifra.uso !== null && cifra.uso !== undefined ? (
                <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className={cn('h-full rounded-full', cifra.uso >= 0.9 ? 'bg-sitio-ambar' : 'bg-white')}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(cifra.uso, 1) * 100}%` }}
                    transition={{ duration: 1.4, delay: 0.3, ease: SALIDA }}
                  />
                </div>
              ) : null}
              <p className="mt-2.5 text-[11.5px] text-sitio-tenue">{cifra.pie}</p>
            </div>
          </Aparecer>
        ))}
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* ── Pasos o tienda lista ── */}
        <Aparecer orden={5}>
          <section className={cn(TARJETA, 'h-full p-6')}>
            {hechos < pasos.length ? (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-[15px] font-medium">Para empezar a vender</h2>
                  <span className="text-xs text-sitio-tenue">
                    {hechos} de {pasos.length}
                  </span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-sitio-verde"
                    initial={{ width: 0 }}
                    animate={{ width: `${(hechos / pasos.length) * 100}%` }}
                    transition={{ duration: 1.4, delay: 0.4, ease: SALIDA }}
                  />
                </div>
                <ol className="mt-2">
                  {pasos.map((paso, indice) => (
                    <li
                      key={paso.titulo}
                      className="grid grid-cols-[32px_1fr_auto] items-center gap-4 border-b border-sitio-borde py-4 last:border-0"
                    >
                      <span
                        className={cn(
                          'grid h-7 w-7 place-items-center rounded-full border text-[11px]',
                          paso.hecho
                            ? 'border-sitio-verde/40 bg-sitio-verde/10 text-sitio-verde'
                            : 'border-sitio-borde text-sitio-tenue',
                        )}
                      >
                        {paso.hecho ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : String(indice + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className={cn('text-sm', paso.hecho && 'text-sitio-tenue line-through')}>{paso.titulo}</p>
                        <p className="mt-0.5 text-[12.5px] text-sitio-tenue">{paso.texto}</p>
                      </div>
                      {!paso.hecho && (
                        <Link href={paso.href} className="enlace-flecha !text-[11px] text-sitio-suave hover:text-white">
                          <span className="hidden sm:inline">{paso.accion}</span>
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-sitio-verde/40 bg-sitio-verde/10 text-sitio-verde">
                    <Check aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-medium">Tu tienda está lista para vender</h2>
                    <p className="text-[12.5px] text-sitio-tenue">Ahora lo importante es que la gente la conozca.</p>
                  </div>
                </div>
                <h3 className="mt-7 text-[11px] tracking-[0.14em] text-sitio-tenue uppercase">Editados hace poco</h3>
                <ul className="mt-2">
                  {recientes.map((producto) => (
                    <li key={producto.id} className="border-b border-sitio-borde last:border-0">
                      <Link href="/panel/productos" className="group flex items-center gap-3 py-3">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sitio-superficie-2">
                          {producto.fotos[0] && <img src={producto.fotos[0]} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] group-hover:text-white">{producto.nombre}</span>
                          <span className="text-[11.5px] text-sitio-tenue">
                            {formatearPrecio(producto.precio)} · {haceCuanto(producto.actualizadoEn)}
                          </span>
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="h-4 w-4 text-sitio-tenue transition-transform duration-500 ease-salida group-hover:translate-x-1 group-hover:text-white"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </Aparecer>

        <div className="flex flex-col gap-4 md:gap-5">
          {/* ── Compartir ── */}
          <Aparecer orden={6}>
            <section className={cn(TARJETA, 'p-6')}>
              <div className="flex items-center gap-2">
                <Share2 aria-hidden="true" className="h-4 w-4 text-sitio-tenue" />
                <h2 className="text-[15px] font-medium">Comparte tu tienda</h2>
              </div>
              <p className="mt-1.5 text-[12.5px] text-sitio-tenue">
                {publicada ? 'Mándala a tus clientes o ponla en tu bio.' : 'Publícala primero para que los demás la vean.'}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void copiar()}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.03] text-[12.5px] transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                >
                  {copiado ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-sitio-verde" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
                  {copiado ? 'Copiado' : 'Copiar enlace'}
                </button>
                <a
                  href={`https://wa.me/?text=${mensaje}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/[0.08] text-[12.5px] text-[#4ee28a] transition-colors hover:bg-[#25d366]/[0.15]"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(direccion)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.03] text-[12.5px] transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                >
                  Facebook
                </a>
                <a
                  href={`https://x.com/intent/post?text=${mensaje}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.03] text-[12.5px] transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                >
                  X
                </a>
              </div>
            </section>
          </Aparecer>

          {/* ── Atención ── */}
          <Aparecer orden={7}>
            <section className={cn(TARJETA, 'p-6')}>
              <h2 className="text-[15px] font-medium">Revisa tu catálogo</h2>
              {!productos ? (
                <div className="brillo mt-4 h-16 rounded-lg" />
              ) : atencion.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 text-[12.5px] text-sitio-tenue">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-sitio-verde" />
                  {lista.length ? 'Todo en orden: fotos, stock y visibilidad.' : 'Aún no hay productos que revisar.'}
                </p>
              ) : (
                <ul className="mt-3">
                  {atencion.map((item) => (
                    <li key={item.filtro}>
                      <Link
                        href={`/panel/productos?filtro=${item.filtro}`}
                        className="group flex items-center gap-3 border-b border-sitio-borde py-3 text-[13px] last:border-0"
                      >
                        <item.Icono aria-hidden="true" className="h-4 w-4 text-sitio-ambar" strokeWidth={1.6} />
                        <span className="flex-1 text-sitio-suave group-hover:text-white">
                          <strong className="font-medium text-white">{item.cantidad}</strong>{' '}
                          {item.cantidad === 1 ? `producto ${item.texto[0]}` : `productos ${item.texto[1]}`}
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="h-4 w-4 text-sitio-tenue transition-transform duration-500 ease-salida group-hover:translate-x-1"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Aparecer>
        </div>
      </div>

      {/* ── Últimos pedidos ── */}
      {pedidos.length > 0 && (
        <Aparecer orden={8}>
          <section className={cn(TARJETA, 'p-6')}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[15px] font-medium">Últimos pedidos</h2>
              <Link href="/panel/pedidos" className="enlace-flecha !text-[11px] text-sitio-suave hover:text-white">
                Ver todos
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-sitio-borde">
              {pedidos.slice(0, 5).map((pedido) => {
                const estado = ESTADOS.find((opcion) => opcion.valor === pedido.estado)!
                return (
                  <li key={pedido.id}>
                    <Link href="/panel/pedidos" className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
                      <span className="font-mono text-[12.5px] text-sitio-tenue">#{pedido.numero}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] group-hover:text-white">{pedido.clienteNombre}</span>
                        <span className="text-[11.5px] text-sitio-tenue">{fechaCorta(pedido.creadoEn)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="hidden sm:inline">
                          <Etiqueta tono={estado.tono}>{estado.etiqueta}</Etiqueta>
                        </span>
                        <span className="text-[13.5px] tabular-nums">{formatearPrecio(pedido.total)}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </Aparecer>
      )}

      {/* ── Accesos rápidos ── */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[
          { href: '/panel/plantillas', titulo: 'Cambiar plantilla', texto: 'Seis diseños listos', Icono: LayoutTemplate },
          { href: '/panel/plantillas?editar=1', titulo: 'Logo y colores', texto: 'Tu marca en la tienda', Icono: Palette },
          { href: '/panel/productos', titulo: 'Catálogo', texto: 'Precios, stock y fotos', Icono: Package },
          { href: '/precios', titulo: 'Planes', texto: `Estás en ${plan.nombre}`, Icono: Sparkles, externo: true },
        ].map((acceso, indice) => (
          <Aparecer key={acceso.titulo} orden={8 + indice}>
            <Link
              href={acceso.href}
              target={acceso.externo ? '_blank' : undefined}
              className={cn(
                TARJETA,
                'group flex h-full flex-col gap-6 p-5 transition-[border-color,background,transform] duration-500 ease-salida hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#121214]',
              )}
            >
              <span className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-sitio-borde bg-white/[0.03]">
                  <acceso.Icono aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 text-sitio-tenue transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                />
              </span>
              <span>
                <span className="block text-[14px]">{acceso.titulo}</span>
                <span className="mt-0.5 block text-[12px] text-sitio-tenue">{acceso.texto}</span>
              </span>
            </Link>
          </Aparecer>
        ))}
      </div>
    </div>
  )
}
