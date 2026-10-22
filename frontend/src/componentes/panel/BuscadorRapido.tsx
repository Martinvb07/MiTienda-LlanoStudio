'use client'

/* eslint-disable @next/next/no-img-element -- miniaturas subidas por el usuario */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  BarChart3,
  CornerDownLeft,
  LayoutGrid,
  Package,
  Paintbrush,
  Plus,
  Receipt,
  Search,
  Settings,
  Ticket,
} from 'lucide-react'
import { listarPedidos, listarProductos } from '@/servicios/panel'
import type { Pedido } from '@/tipos/pedidos'
import type { ProductoPanel } from '@/tipos/tienda'
import { urlTienda } from '@/utilidades/dominios'
import { formatearPrecio } from '@/utilidades/formato'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'
import { CURVA } from './ui/basicos'

interface Resultado {
  id: string
  grupo: 'Ir a' | 'Acciones' | 'Productos' | 'Pedidos'
  titulo: string
  detalle?: string
  icono: ReactNode
  ir: () => void
}

const Contexto = createContext<() => void>(() => undefined)

/** Abre el buscador desde cualquier botón del panel. */
export const useAbrirBuscador = () => useContext(Contexto)

const sinTildes = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/**
 * Buscador rápido, como el de las herramientas grandes: Ctrl/⌘+K desde
 * cualquier pantalla para saltar a una sección, crear algo o encontrar un
 * producto o un pedido por nombre, número o cliente.
 */
export function ProveedorBuscador({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const abrir = useCallback(() => setAbierto(true), [])

  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setAbierto((valor) => !valor)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  return (
    <Contexto.Provider value={abrir}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(<AnimatePresence>{abierto && <Buscador alCerrar={() => setAbierto(false)} />}</AnimatePresence>, document.body)}
    </Contexto.Provider>
  )
}

function Buscador({ alCerrar }: { alCerrar: () => void }) {
  const router = useRouter()
  const { sesion } = useSesion()
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(0)
  const [productos, setProductos] = useState<ProductoPanel[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const lista = useRef<HTMLUListElement>(null)

  useEffect(() => {
    listarProductos().then(setProductos).catch(() => undefined)
    listarPedidos().then(setPedidos).catch(() => undefined)
  }, [])

  const ir = useCallback(
    (ruta: string) => {
      alCerrar()
      router.push(ruta)
    },
    [alCerrar, router],
  )

  const resultados = useMemo<Resultado[]>(() => {
    const termino = sinTildes(texto.trim())
    const coincide = (...campos: (string | undefined | null)[]) => !termino || campos.some((campo) => sinTildes(campo ?? '').includes(termino))
    const icono = (Icono: typeof Search) => <Icono aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />

    const paginas: Resultado[] = (
      [
        ['/panel', 'Resumen', LayoutGrid],
        ['/panel/plantillas?editar=1', 'Editar diseño de la tienda', Paintbrush],
        ['/panel/productos', 'Productos', Package],
        ['/panel/pedidos', 'Pedidos', Receipt],
        ['/panel/descuentos', 'Descuentos', Ticket],
        ['/panel/estadisticas', 'Estadísticas', BarChart3],
        ['/panel/configuracion', 'Configuración', Settings],
      ] as const
    )
      .filter(([, titulo]) => coincide(titulo))
      .map(([ruta, titulo, Icono]) => ({ id: ruta, grupo: 'Ir a', titulo, icono: icono(Icono), ir: () => ir(ruta) }))

    const acciones: Resultado[] = [
      { id: 'nuevo-producto', titulo: 'Nuevo producto', ruta: '/panel/productos?nuevo=1', Icono: Plus },
      { id: 'nuevo-cupon', titulo: 'Nuevo cupón de descuento', ruta: '/panel/descuentos', Icono: Ticket },
    ]
      .filter((accion) => coincide(accion.titulo, 'crear agregar'))
      .map((accion) => ({ id: accion.id, grupo: 'Acciones' as const, titulo: accion.titulo, icono: icono(accion.Icono), ir: () => ir(accion.ruta) }))
    if (coincide('Ver mi tienda', 'abrir')) {
      acciones.push({
        id: 'ver-tienda',
        grupo: 'Acciones',
        titulo: 'Ver mi tienda',
        detalle: urlTienda(sesion.tenant.subdominio).replace(/^https?:\/\//, ''),
        icono: icono(ArrowUpRight),
        ir: () => {
          alCerrar()
          window.open(urlTienda(sesion.tenant.subdominio), '_blank')
        },
      })
    }

    const encontrados: Resultado[] = termino
      ? productos
          .filter((producto) => coincide(producto.nombre, producto.categoria, producto.slug))
          .slice(0, 6)
          .map((producto) => ({
            id: producto.id,
            grupo: 'Productos',
            titulo: producto.nombre,
            detalle: `${formatearPrecio(producto.precio)} · ${producto.stock} en stock`,
            icono: producto.fotos[0] ? (
              <img src={producto.fotos[0]} alt="" className="h-6 w-6 rounded object-cover" />
            ) : (
              icono(Package)
            ),
            ir: () => ir('/panel/productos'),
          }))
      : []

    const pedidosEncontrados: Resultado[] = termino
      ? pedidos
          .filter((pedido) => coincide(String(pedido.numero), `#${pedido.numero}`, pedido.clienteNombre, pedido.clienteTelefono))
          .slice(0, 5)
          .map((pedido) => ({
            id: pedido.id,
            grupo: 'Pedidos',
            titulo: `#${pedido.numero} · ${pedido.clienteNombre}`,
            detalle: formatearPrecio(pedido.total),
            icono: icono(Receipt),
            ir: () => ir('/panel/pedidos'),
          }))
      : []

    return [...paginas, ...acciones, ...encontrados, ...pedidosEncontrados]
  }, [texto, productos, pedidos, ir, alCerrar, sesion.tenant.subdominio])

  useEffect(() => setActivo(0), [texto])
  useEffect(() => {
    lista.current?.querySelector(`[data-indice="${activo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  function alTeclear(evento: React.KeyboardEvent) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setActivo((valor) => Math.min(resultados.length - 1, valor + 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setActivo((valor) => Math.max(0, valor - 1))
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      resultados[activo]?.ir()
    } else if (evento.key === 'Escape') {
      alCerrar()
    }
  }

  let grupoAnterior = ''

  return (
    <div className="marco-oscuro fixed inset-0 z-[400] flex items-start justify-center px-4 pt-[12vh] font-sans" role="dialog" aria-modal="true" aria-label="Buscar">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={alCerrar}
      />
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } }}
        transition={{ duration: 0.4, ease: CURVA }}
        className="relative w-full max-w-[580px] overflow-hidden rounded-[14px] border border-white/12 bg-[#0e0e0f] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search aria-hidden="true" className="h-4 w-4 text-sitio-tenue" />
          <input
            autoFocus
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={alTeclear}
            placeholder="Busca una sección, un producto o un pedido…"
            aria-label="Buscar"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-sitio-tenue"
          />
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10.5px] text-sitio-tenue">Esc</kbd>
        </div>
        <ul ref={lista} className="max-h-[52vh] overflow-y-auto p-1.5">
          {resultados.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-sitio-tenue">Nada coincide con “{texto}”.</li>}
          {resultados.map((resultado, indice) => {
            const cabecera = resultado.grupo !== grupoAnterior ? resultado.grupo : null
            grupoAnterior = resultado.grupo
            return (
              <li key={`${resultado.grupo}-${resultado.id}`}>
                {cabecera && <p className="px-3 pt-2.5 pb-1 text-[10px] tracking-[0.16em] text-sitio-tenue uppercase">{cabecera}</p>}
                <button
                  type="button"
                  data-indice={indice}
                  onMouseMove={() => setActivo(indice)}
                  onClick={resultado.ir}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors',
                    indice === activo ? 'bg-white/[0.08] text-white' : 'text-sitio-suave',
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center">{resultado.icono}</span>
                  <span className="min-w-0 flex-1 truncate">{resultado.titulo}</span>
                  {resultado.detalle && <span className="shrink-0 text-[12px] text-sitio-tenue">{resultado.detalle}</span>}
                  {indice === activo && <CornerDownLeft aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-sitio-tenue" />}
                </button>
              </li>
            )
          })}
        </ul>
      </motion.div>
    </div>
  )
}
