'use client'

/* eslint-disable @next/next/no-img-element -- miniaturas del panel */
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Copy, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerTienda,
  type DatosProducto,
} from '@/servicios/panel'
import type { ProductoPanel, Tienda } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { cn } from '@/utilidades/clases'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { useSesion } from './SesionPanel'
import { CabeceraPanel } from './CabeceraPanel'
import { EditorProducto } from './editor/EditorProducto'
import { Aviso, BotonPanel, CURVA, Candado, Etiqueta, Segmentado } from './ui/basicos'
import { MenuAcciones } from './ui/flotantes'
import { Aparecer } from './ui/movimiento'

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos', cumple: () => true },
  { valor: 'visibles', etiqueta: 'Visibles', cumple: (p: ProductoPanel) => p.activo },
  { valor: 'ocultos', etiqueta: 'Ocultos', cumple: (p: ProductoPanel) => !p.activo },
  { valor: 'agotados', etiqueta: 'Agotados', cumple: (p: ProductoPanel) => p.stock === 0 },
  { valor: 'sin-foto', etiqueta: 'Sin foto', cumple: (p: ProductoPanel) => p.fotos.length === 0 },
] as const

type Filtro = (typeof FILTROS)[number]['valor']

const ORDENES = [
  { valor: 'recientes', etiqueta: 'Recientes' },
  { valor: 'nombre', etiqueta: 'A–Z' },
  { valor: 'precio', etiqueta: 'Precio' },
  { valor: 'stock', etiqueta: 'Stock' },
] as const

type Orden = (typeof ORDENES)[number]['valor']

const ORDENAR: Record<Orden, (a: ProductoPanel, b: ProductoPanel) => number> = {
  recientes: (a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime(),
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  precio: (a, b) => Number(a.precio) - Number(b.precio),
  stock: (a, b) => a.stock - b.stock,
}

/** Todo lo que el backend espera de un producto, para reenviarlo sin perder campos. */
function datosDe(producto: ProductoPanel): DatosProducto {
  return {
    nombre: producto.nombre,
    slug: producto.slug,
    descripcion: producto.descripcion,
    precio: producto.precio,
    precioComparacion: producto.precioComparacion,
    stock: producto.stock,
    fotos: producto.fotos,
    categoria: producto.categoria ?? null,
    presentacion: producto.presentacion ?? null,
    activo: producto.activo,
  }
}

const sinTildes = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Catálogo: tarjetas con portada, precio y estado, y el editor a pantalla completa. */
export function PantallaProductos() {
  const [productos, setProductos] = useState<ProductoPanel[] | null>(null)
  const [tienda, setTienda] = useState<Tienda | null>(null)
  const [error, setError] = useState('')
  // undefined = cerrado, null = producto nuevo
  const [abierto, setAbierto] = useState<ProductoPanel | null | undefined>(undefined)
  const limites = limitesDe(useSesion().sesion.tenant.plan)
  const total = productos?.length ?? 0
  const lleno = limites.productos !== null && total >= limites.productos

  const parametros = useSearchParams()
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>(() => {
    const pedido = parametros.get('filtro')
    return FILTROS.some((opcion) => opcion.valor === pedido) ? (pedido as Filtro) : 'todos'
  })
  const [orden, setOrden] = useState<Orden>('recientes')

  // "Nuevo producto" desde el resumen abre el editor en cuanto hay tienda.
  useEffect(() => {
    if (tienda && parametros.get('nuevo') === '1' && !lleno) {
      setAbierto(null)
      router.replace('/panel/productos', { scroll: false })
    }
  }, [tienda, parametros, lleno, router])

  const filtrados = useMemo(() => {
    const termino = sinTildes(busqueda.trim())
    const cumple = FILTROS.find((opcion) => opcion.valor === filtro)!.cumple
    return (productos ?? [])
      .filter((producto) => cumple(producto))
      .filter(
        (producto) =>
          !termino ||
          sinTildes(producto.nombre).includes(termino) ||
          sinTildes(producto.categoria ?? '').includes(termino),
      )
      .sort(ORDENAR[orden])
  }, [productos, busqueda, filtro, orden])

  useEffect(() => {
    Promise.all([listarProductos(), obtenerTienda()])
      .then(([lista, datos]) => {
        setProductos(lista)
        setTienda(datos.tienda)
      })
      .catch((problema: Error) => setError(problema.message))
  }, [])

  function reemplazar(producto: ProductoPanel) {
    setProductos((lista) => {
      const actual = lista ?? []
      return actual.some((otro) => otro.id === producto.id)
        ? actual.map((otro) => (otro.id === producto.id ? producto : otro))
        : [producto, ...actual]
    })
  }

  async function alternar(producto: ProductoPanel) {
    try {
      reemplazar(await actualizarProducto(producto.id, { ...datosDe(producto), activo: !producto.activo }))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    }
  }

  /** Copia oculta, con un slug libre, para armar variantes rápido. */
  async function duplicar(producto: ProductoPanel) {
    const usados = new Set((productos ?? []).map((otro) => otro.slug))
    let slug = `${producto.slug}-copia`.slice(0, 80)
    for (let numero = 2; usados.has(slug); numero++) slug = `${producto.slug}-copia-${numero}`.slice(0, 80)
    try {
      reemplazar(
        await crearProducto({ ...datosDe(producto), nombre: `${producto.nombre} (copia)`.slice(0, 120), slug, activo: false }),
      )
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo duplicar')
    }
  }

  async function eliminar(producto: ProductoPanel) {
    if (!confirm(`¿Eliminar "${producto.nombre}"? No se puede deshacer.`)) return
    try {
      await eliminarProducto(producto.id)
      setProductos((lista) => (lista ?? []).filter((otro) => otro.id !== producto.id))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo eliminar')
    }
  }

  return (
    <>
      <CabeceraPanel
        titulo="Productos"
        descripcion={
          limites.productos === null
            ? `Productos ilimitados en tu plan ${limites.nombre}.`
            : `Llevas ${total} de ${limites.productos} en tu plan ${limites.nombre}.`
        }
        accion={
          <BotonPanel variante="primario" onClick={() => setAbierto(null)} disabled={!tienda || lleno} className="h-10 px-5">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Nuevo producto
          </BotonPanel>
        }
      />

      <AnimatePresence>{error && abierto === undefined && <Aviso>{error}</Aviso>}</AnimatePresence>

      {lleno && (
        <div className="mb-5">
          <Candado plan={planMinimo((plan) => plan.productos === null || plan.productos > total)}>
            Llegaste al límite de {limites.productos} productos de tu plan {limites.nombre}.
          </Candado>
        </div>
      )}

      {productos && productos.length > 0 && (
        <Aparecer className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {FILTROS.map((opcion) => {
              const cantidad = productos.filter((producto) => opcion.cumple(producto)).length
              const activo = filtro === opcion.valor
              return (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => setFiltro(opcion.valor)}
                  aria-pressed={activo}
                  className={cn(
                    'relative flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] transition-colors duration-300',
                    activo ? 'text-black' : 'text-sitio-suave hover:text-white',
                  )}
                >
                  {activo && (
                    <motion.span
                      layoutId="filtro-productos"
                      transition={{ duration: 0.5, ease: CURVA }}
                      className="absolute inset-0 rounded-full bg-white"
                    />
                  )}
                  {!activo && <span className="absolute inset-0 rounded-full border border-sitio-borde" />}
                  <span className="relative">{opcion.etiqueta}</span>
                  <span className={cn('relative text-[11px]', activo ? 'text-black/50' : 'text-sitio-tenue')}>{cantidad}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-[36px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-sitio-borde bg-[#121214] px-3 transition-colors focus-within:border-white/40 lg:w-64 lg:flex-none">
              <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-sitio-tenue" />
              <input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por nombre o categoría"
                aria-label="Buscar productos"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-sitio-tenue"
              />
              {busqueda && (
                <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="text-sitio-tenue hover:text-white">
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
            <Segmentado opciones={ORDENES} valor={orden} alCambiar={setOrden} chico />
          </div>
        </Aparecer>
      )}

      {!productos ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-3.5">
          {[0, 1, 2, 3].map((indice) => (
            <div key={indice} className="brillo aspect-[4/5] rounded-xl border border-sitio-borde" />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <Aparecer>
          <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]"
            />
            <p className="text-2xl tracking-[-0.03em]">Todavía no tienes productos</p>
            <p className="mt-2 max-w-sm text-sm text-sitio-tenue">
              Crea el primero: nombre, fotos y precio. Aparece en tu tienda en cuanto lo guardes.
            </p>
            <BotonPanel variante="primario" onClick={() => setAbierto(null)} disabled={!tienda} className="mt-6 h-10 px-5">
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              Crear mi primer producto
            </BotonPanel>
          </div>
        </Aparecer>
      ) : filtrados.length === 0 ? (
        <p className="rounded-[14px] border border-sitio-borde px-6 py-14 text-center text-sm text-sitio-tenue">
          Nada coincide con {busqueda ? `“${busqueda}”` : 'este filtro'}.{' '}
          <button
            type="button"
            onClick={() => {
              setBusqueda('')
              setFiltro('todos')
            }}
            className="text-white underline-offset-4 hover:underline"
          >
            Ver todos
          </button>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-3.5">
          <AnimatePresence initial={false} mode="popLayout">
            {filtrados.map((producto, indice) => (
              <motion.li
                key={producto.id}
                layout
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
                transition={{ duration: 0.7, delay: Math.min(indice, 8) * 0.04, ease: CURVA }}
                className="group/tarjeta relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#070707] transition-colors duration-300 hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => setAbierto(producto)}
                  aria-label={`Editar ${producto.nombre}`}
                  className="group relative block aspect-square overflow-hidden bg-sitio-superficie-2"
                >
                  {producto.fotos[0] ? (
                    <img
                      src={producto.fotos[0]}
                      alt=""
                      loading="lazy"
                      className={cn(
                        'h-full w-full object-cover transition-[transform,opacity] duration-[1.2s] ease-salida group-hover:scale-[1.06]',
                        !producto.activo && 'opacity-35 grayscale',
                      )}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-xs text-sitio-tenue">Sin foto</span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 backdrop-blur-[2px] transition-opacity duration-500 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[11px] tracking-[0.1em] text-black uppercase">
                      <Pencil aria-hidden="true" className="h-3 w-3" />
                      Editar
                    </span>
                  </span>
                  {producto.precioComparacion && Number(producto.precioComparacion) > Number(producto.precio) && (
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-black">
                      -{Math.round((1 - Number(producto.precio) / Number(producto.precioComparacion)) * 100)}%
                    </span>
                  )}
                </button>

                <div className="absolute top-2 right-2">
                  <MenuAcciones
                    disparador={
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur">
                        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                      </span>
                    }
                    acciones={[
                      { etiqueta: 'Editar', icono: <Pencil aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => setAbierto(producto) },
                      {
                        etiqueta: producto.activo ? 'Ocultar de la tienda' : 'Mostrar en la tienda',
                        icono: producto.activo ? <EyeOff aria-hidden="true" className="h-3.5 w-3.5" /> : <Eye aria-hidden="true" className="h-3.5 w-3.5" />,
                        alElegir: () => void alternar(producto),
                      },
                      ...(lleno
                        ? []
                        : [{ etiqueta: 'Duplicar', icono: <Copy aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => void duplicar(producto) }]),
                      { etiqueta: 'Eliminar', icono: <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />, peligro: true, alElegir: () => void eliminar(producto) },
                    ]}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2.5 p-3 md:p-3.5">
                  <div className="min-w-0">
                    <strong className="block truncate text-[14px] font-medium md:text-[15px]">{producto.nombre}</strong>
                    <small className="text-xs text-sitio-tenue">
                      {formatearPrecio(producto.precio, tienda?.moneda)}
                      {producto.precioComparacion && (
                        <s className="ml-1.5 opacity-60">{formatearPrecio(producto.precioComparacion, tienda?.moneda)}</s>
                      )}
                    </small>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void alternar(producto)}
                      title={producto.activo ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}
                      className="rounded-full transition-opacity hover:opacity-75"
                    >
                      <Etiqueta tono={producto.activo ? 'verde' : 'ambar'}>{producto.activo ? 'Visible' : 'Oculto'}</Etiqueta>
                    </button>
                    <Etiqueta tono={producto.stock === 0 ? 'ambar' : 'neutro'}>
                      {producto.stock === 0 ? 'Agotado' : `${producto.stock} en stock`}
                    </Etiqueta>
                    {producto.categoria && (
                      <span className="hidden truncate text-[11px] text-sitio-tenue sm:inline">{producto.categoria}</span>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {abierto !== undefined && tienda && (
          <EditorProducto
            key={abierto?.id ?? 'nuevo'}
            producto={abierto}
            tienda={tienda}
            catalogo={(productos ?? []).filter((producto) => producto.activo)}
            alGuardar={reemplazar}
            alCerrar={() => setAbierto(undefined)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
