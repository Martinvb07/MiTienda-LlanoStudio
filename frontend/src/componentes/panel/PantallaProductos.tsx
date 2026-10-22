'use client'

/* eslint-disable @next/next/no-img-element -- miniaturas del panel */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  actualizarProducto,
  eliminarProducto,
  listarProductos,
  obtenerTienda,
} from '@/servicios/panel'
import type { ProductoPanel, Tienda } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { cn } from '@/utilidades/clases'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { useSesion } from './SesionPanel'
import { CabeceraPanel } from './CabeceraPanel'
import { EditorProducto } from './editor/EditorProducto'
import { Aviso, BotonPanel, CURVA, Candado, Etiqueta } from './ui/basicos'

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
      reemplazar(
        await actualizarProducto(producto.id, {
          nombre: producto.nombre,
          slug: producto.slug,
          descripcion: producto.descripcion,
          precio: producto.precio,
          precioComparacion: producto.precioComparacion,
          stock: producto.stock,
          fotos: producto.fotos,
          activo: !producto.activo,
        }),
      )
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
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
        descripcion={`Edita cada producto con vista previa en vivo. ${
          limites.productos === null
            ? `Productos ilimitados en tu plan ${limites.nombre}.`
            : `Llevas ${total} de ${limites.productos} en tu plan ${limites.nombre}.`
        }`}
        accion={
          <BotonPanel variante="primario" onClick={() => setAbierto(null)} disabled={!tienda || lleno} className="h-10 px-5">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
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

      {!productos ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
          {[0, 1, 2, 3].map((indice) => (
            <div key={indice} className="brillo aspect-[4/5] rounded-xl border border-sitio-borde" />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="grid place-items-center rounded-[14px] border border-dashed border-white/15 px-6 py-20 text-center">
          <p className="text-xl tracking-[-0.03em]">Todavía no tienes productos</p>
          <p className="mt-2 max-w-sm text-sm text-sitio-tenue">
            Crea el primero: nombre, fotos y precio. Aparece en tu tienda en cuanto lo guardes.
          </p>
          <BotonPanel variante="primario" onClick={() => setAbierto(null)} disabled={!tienda} className="mt-6 h-10 px-5">
            Crear mi primer producto
          </BotonPanel>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
          <AnimatePresence initial={false}>
            {productos.map((producto) => (
              <motion.li
                key={producto.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: CURVA }}
                className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#070707] transition-colors hover:border-white/20"
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
                        'h-full w-full object-cover transition-[transform,opacity] duration-700 ease-salida group-hover:scale-[1.04]',
                        !producto.activo && 'opacity-35 grayscale',
                      )}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-xs text-sitio-tenue">Sin foto</span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-xs tracking-[0.1em] uppercase opacity-0 transition-opacity group-hover:opacity-100">
                    Editar
                  </span>
                </button>
                <div className="flex flex-col gap-2.5 px-3.5 pt-3.5">
                  <div>
                    <strong className="block truncate text-[15px] font-medium">{producto.nombre}</strong>
                    <small className="text-xs text-sitio-tenue">
                      {formatearPrecio(producto.precio, tienda?.moneda)}
                      {producto.precioComparacion && (
                        <s className="ml-1.5 opacity-60">{formatearPrecio(producto.precioComparacion, tienda?.moneda)}</s>
                      )}
                    </small>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Etiqueta tono={producto.activo ? 'verde' : 'ambar'}>{producto.activo ? 'Visible' : 'Oculto'}</Etiqueta>
                    <Etiqueta tono={producto.stock === 0 ? 'ambar' : 'neutro'}>
                      {producto.stock === 0 ? 'Agotado' : `${producto.stock} en stock`}
                    </Etiqueta>
                  </div>
                </div>
                <div className="mt-auto flex gap-1.5 p-3.5">
                  <BotonPanel variante="suave" onClick={() => setAbierto(producto)}>
                    Editar
                  </BotonPanel>
                  <BotonPanel onClick={() => void alternar(producto)}>{producto.activo ? 'Ocultar' : 'Mostrar'}</BotonPanel>
                  <BotonPanel variante="peligro" onClick={() => void eliminar(producto)}>
                    Eliminar
                  </BotonPanel>
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
