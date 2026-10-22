'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import {
  ErrorPanel,
  actualizarProducto,
  crearProducto,
  type DatosProducto,
} from '@/servicios/panel'
import type { Producto, ProductoPanel, Tienda } from '@/tipos/tienda'
import { formatearPrecio, generarSlug } from '@/utilidades/formato'
import { limitesDe } from '@/utilidades/planes'
import { useSesion } from '../SesionPanel'
import { Aviso, Campo, CampoArea, Interruptor, Seccion, Segmentado } from '../ui/basicos'
import { Galeria } from '../ui/imagenes'
import { MarcoEditor, useAtajosEditor } from './MarcoEditor'
import { VistaPrevia, type Dispositivo } from './VistaPrevia'

interface Borrador {
  nombre: string
  slug: string
  descripcion: string
  precio: string
  precioComparacion: string
  stock: string
  fotos: string[]
  activo: boolean
}

function borradorDe(producto: ProductoPanel | null): Borrador {
  if (!producto) {
    return { nombre: '', slug: '', descripcion: '', precio: '', precioComparacion: '', stock: '1', fotos: [], activo: true }
  }
  return {
    nombre: producto.nombre,
    slug: producto.slug,
    descripcion: producto.descripcion ?? '',
    // Los importes llegan como "45900.00": en el editor se muestran sin decimales.
    precio: String(Number(producto.precio)),
    precioComparacion: producto.precioComparacion ? String(Number(producto.precioComparacion)) : '',
    stock: String(producto.stock),
    fotos: producto.fotos,
    activo: producto.activo,
  }
}

/** Sólo dígitos: los pesos colombianos se manejan sin decimales. */
const soloDigitos = (valor: string) => valor.replace(/\D/g, '').slice(0, 10)

interface Props {
  producto: ProductoPanel | null
  tienda: Tienda
  /** Productos visibles de la tienda, para la vista "En la tienda". */
  catalogo: Producto[]
  alGuardar: (producto: ProductoPanel) => void
  alCerrar: () => void
}

export function EditorProducto({ producto, tienda, catalogo, alGuardar, alCerrar }: Props) {
  const [actual, setActual] = useState(producto)
  const [borrador, setBorrador] = useState(() => borradorDe(producto))
  const [inicial, setInicial] = useState(() => JSON.stringify(borradorDe(producto)))
  const [slugEditado, setSlugEditado] = useState(Boolean(producto))
  const [dispositivo, setDispositivo] = useState<Dispositivo>('escritorio')
  const [vista, setVista] = useState<'producto' | 'tienda'>('producto')
  const [error, setError] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [guardadoReciente, setGuardadoReciente] = useState(false)
  const [subiendo, setSubiendo] = useState(0)
  const plan = useSesion().sesion.tenant.plan
  const limites = limitesDe(plan)

  const sucio = JSON.stringify(borrador) !== inicial
  const cambiar = (cambios: Partial<Borrador>) => setBorrador((anterior) => ({ ...anterior, ...cambios }))
  const alSubiendo = useCallback((delta: number) => setSubiendo((valor) => valor + delta), [])

  const comoProducto = useMemo<Producto>(
    () => ({
      id: actual?.id ?? 'borrador',
      nombre: borrador.nombre || 'Nombre del producto',
      slug: borrador.slug || 'nuevo',
      descripcion: borrador.descripcion || null,
      precio: borrador.precio || '0',
      precioComparacion: borrador.precioComparacion || null,
      stock: Number(borrador.stock) || 0,
      fotos: borrador.fotos,
    }),
    [actual, borrador],
  )

  const guardar = useCallback(async () => {
    if (guardando || subiendo > 0) return
    const faltantes: Record<string, string> = {}
    if (!borrador.nombre.trim()) faltantes.nombre = 'Escribe el nombre'
    if (!borrador.slug) faltantes.slug = 'Escribe una dirección'
    if (!borrador.precio) faltantes.precio = 'Escribe el precio'
    setErrores(faltantes)
    if (Object.keys(faltantes).length) {
      setError('Revisa los campos marcados.')
      return
    }

    const datos: DatosProducto = {
      nombre: borrador.nombre.trim(),
      slug: borrador.slug,
      descripcion: borrador.descripcion.trim() || null,
      precio: borrador.precio,
      precioComparacion: borrador.precioComparacion || null,
      stock: Number(borrador.stock) || 0,
      fotos: borrador.fotos,
      activo: borrador.activo,
    }

    setError('')
    setGuardando(true)
    try {
      const guardado = actual ? await actualizarProducto(actual.id, datos) : await crearProducto(datos)
      const nuevo = borradorDe(guardado)
      setActual(guardado)
      setBorrador(nuevo)
      setInicial(JSON.stringify(nuevo))
      setSlugEditado(true)
      alGuardar(guardado)
      setGuardadoReciente(true)
      setTimeout(() => setGuardadoReciente(false), 2200)
    } catch (problema) {
      if (problema instanceof ErrorPanel) setErrores(problema.campos)
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }, [actual, alGuardar, borrador, guardando, subiendo])

  useAtajosEditor(sucio, () => void guardar())

  function cerrar() {
    if (sucio && !confirm('Tienes cambios sin guardar. ¿Salir sin guardar?')) return
    alCerrar()
  }

  const datosVista = useMemo(() => {
    const enCatalogo = borrador.activo
      ? [comoProducto, ...catalogo.filter((otro) => otro.id !== comoProducto.id)]
      : catalogo.filter((otro) => otro.id !== comoProducto.id)
    return {
      tienda: {
        nombre: tienda.nombre,
        logoUrl: tienda.logoUrl,
        tema: tienda.tema,
        moneda: tienda.moneda,
        plan,
        // En "En la tienda" sólo interesa la grilla: se omite lo demás.
        configuracionBloques:
          vista === 'tienda'
            ? tienda.configuracionBloques.filter((bloque) => bloque.tipo === 'grilla-productos').slice(0, 1)
            : tienda.configuracionBloques,
      },
      productos: enCatalogo,
      vista: vista === 'producto' ? ('producto' as const) : ('tienda' as const),
      producto: comoProducto,
    }
  }, [borrador.activo, catalogo, comoProducto, plan, tienda, vista])

  const descuento =
    borrador.precioComparacion && Number(borrador.precioComparacion) > Number(borrador.precio)
      ? Math.round((1 - Number(borrador.precio) / Number(borrador.precioComparacion)) * 100)
      : 0

  return (
    <MarcoEditor
      volver="Productos"
      alCerrar={cerrar}
      titulo={borrador.nombre || 'Nuevo producto'}
      estado={borrador.activo ? { texto: 'Visible', tono: 'verde' } : { texto: 'Oculto', tono: 'ambar' }}
      sucio={sucio}
      guardadoReciente={guardadoReciente}
      subiendo={subiendo}
      guardando={guardando}
      puedeGuardar={sucio || !actual}
      textoGuardar={actual ? 'Guardar' : 'Crear producto'}
      alGuardar={() => void guardar()}
      dispositivo={dispositivo}
      alCambiarDispositivo={setDispositivo}
      extra={
        <Segmentado
          opciones={[
            { valor: 'producto', etiqueta: 'Página' },
            { valor: 'tienda', etiqueta: 'En la tienda' },
          ]}
          valor={vista}
          alCambiar={setVista}
        />
      }
      lateral={
        <>
          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

          <Seccion titulo="Información" abierta>
            <Campo
              etiqueta="Nombre"
              valor={borrador.nombre}
              maximo={120}
              marcador="Ej. Sombrero llanero"
              error={errores.nombre}
              autoFoco={!producto}
              alCambiar={(nombre) => cambiar({ nombre, ...(slugEditado ? {} : { slug: generarSlug(nombre).slice(0, 80) }) })}
            />
            <CampoArea
              etiqueta="Descripción"
              valor={borrador.descripcion}
              alCambiar={(descripcion) => cambiar({ descripcion })}
              filas={5}
              maximo={4000}
              marcador="Materiales, medidas, cuidados…"
            />
            <Campo
              etiqueta="Dirección del producto"
              prefijo="/productos/"
              valor={borrador.slug}
              error={errores.slug}
              alCambiar={(slug) => {
                setSlugEditado(true)
                cambiar({ slug: generarSlug(slug).slice(0, 80) })
              }}
            />
          </Seccion>

          <Seccion titulo="Fotos" abierta>
            <span className="text-[11.5px] text-sitio-suave">
              Arrastra para ordenar{' '}
              <small className="text-sitio-tenue">
                (la primera es la portada · hasta {limites.fotosPorProducto} en tu plan {limites.nombre})
              </small>
            </span>
            <Galeria
              urls={borrador.fotos}
              alCambiar={(fotos) => cambiar({ fotos })}
              maximo={limites.fotosPorProducto}
              alError={setError}
              alSubiendo={alSubiendo}
            />
          </Seccion>

          <Seccion titulo="Precio e inventario" abierta>
            <div className="grid grid-cols-2 gap-2.5">
              <Campo
                etiqueta="Precio"
                prefijo="$"
                valor={borrador.precio}
                error={errores.precio}
                marcador="45900"
                alCambiar={(precio) => cambiar({ precio: soloDigitos(precio) })}
                ayuda={borrador.precio ? formatearPrecio(borrador.precio, tienda.moneda) : undefined}
              />
              <Campo
                etiqueta="Precio antes (opcional)"
                prefijo="$"
                valor={borrador.precioComparacion}
                error={errores.precioComparacion}
                alCambiar={(precioComparacion) => cambiar({ precioComparacion: soloDigitos(precioComparacion) })}
                ayuda={descuento > 0 ? `${descuento}% de descuento` : 'Sale tachado'}
              />
            </div>
            <Campo
              etiqueta="Unidades disponibles"
              tipo="number"
              min={0}
              valor={borrador.stock}
              error={errores.stock}
              alCambiar={(stock) => cambiar({ stock: soloDigitos(stock).slice(0, 7) })}
              ayuda={Number(borrador.stock) === 0 ? 'En 0 se muestra como agotado' : undefined}
            />
          </Seccion>

          <Seccion titulo="Publicación" abierta>
            <Interruptor activo={borrador.activo} alCambiar={(activo) => cambiar({ activo })}>
              {borrador.activo ? 'Visible en la tienda' : 'Oculto de la tienda'}
            </Interruptor>
          </Seccion>
        </>
      }
      vista={<VistaPrevia datos={datosVista} dispositivo={dispositivo} />}
    />
  )
}
