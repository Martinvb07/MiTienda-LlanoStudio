'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download, Eye, EyeOff, FileUp, FolderInput, Star, StarOff, Trash2, X } from 'lucide-react'
import {
  importarProductos,
  loteProductos,
  renombrarCategoria,
  type AccionLote,
  type FilaImportada,
} from '@/servicios/panel'
import type { ProductoPanel } from '@/tipos/tienda'
import { formatearPrecio } from '@/utilidades/formato'
import { Aviso, BotonPanel, CURVA, Campo } from './ui/basicos'
import { ModalPanel } from './ui/flotantes'
import { confirmar } from './ui/confirmar'

// ─────────────────────────────────────────────────────────────────────────────
// Selección en grupo
// ─────────────────────────────────────────────────────────────────────────────

/** Barra flotante con lo que se puede hacer a los productos seleccionados. */
export function BarraSeleccion({
  ids,
  categorias,
  alTerminar,
  alLimpiar,
  alError,
}: {
  ids: string[]
  categorias: string[]
  alTerminar: () => void
  alLimpiar: () => void
  alError: (mensaje: string) => void
}) {
  const [trabajando, setTrabajando] = useState(false)
  const [moviendo, setMoviendo] = useState(false)
  const [categoria, setCategoria] = useState('')

  async function aplicar(accion: AccionLote, valor?: string | null) {
    if (
      accion === 'eliminar' &&
      !(await confirmar({ titulo: `¿Eliminar ${ids.length} productos?`, mensaje: 'No se puede deshacer.', confirmar: 'Eliminar', peligro: true }))
    )
      return
    setTrabajando(true)
    try {
      await loteProductos(ids, accion, valor)
      setMoviendo(false)
      alTerminar()
    } catch (problema) {
      alError(problema instanceof Error ? problema.message : 'No se pudo aplicar')
    } finally {
      setTrabajando(false)
    }
  }

  const acciones: { accion: AccionLote; etiqueta: string; Icono: typeof Eye; peligro?: boolean }[] = [
    { accion: 'mostrar', etiqueta: 'Mostrar', Icono: Eye },
    { accion: 'ocultar', etiqueta: 'Ocultar', Icono: EyeOff },
    { accion: 'destacar', etiqueta: 'Destacar', Icono: Star },
    { accion: 'quitar-destacado', etiqueta: 'Quitar destacado', Icono: StarOff },
  ]

  return (
    <>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.5, ease: CURVA }}
        className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-fit flex-wrap items-center justify-center gap-1 rounded-2xl border border-white/12 bg-sitio-elevado/95 p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,1)] backdrop-blur-xl md:bottom-6"
      >
        <span className="px-3 text-[13px]">
          <strong className="font-medium">{ids.length}</strong> seleccionados
        </span>
        {acciones.map(({ accion, etiqueta, Icono }) => (
          <BotonPanel key={accion} variante="fantasma" disabled={trabajando} onClick={() => void aplicar(accion)} title={etiqueta}>
            <Icono aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{etiqueta}</span>
          </BotonPanel>
        ))}
        <BotonPanel variante="fantasma" disabled={trabajando} onClick={() => setMoviendo(true)} title="Cambiar categoría">
          <FolderInput aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Categoría</span>
        </BotonPanel>
        <BotonPanel variante="peligro" disabled={trabajando} onClick={() => void aplicar('eliminar')} title="Eliminar">
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
        </BotonPanel>
        <button type="button" onClick={alLimpiar} aria-label="Quitar selección" className="grid h-8 w-8 place-items-center rounded-lg text-sitio-tenue hover:text-white">
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </motion.div>

      <AnimatePresence>
        {moviendo && (
          <ModalPanel titulo="Cambiar categoría" descripcion={`A ${ids.length} productos.`} alCerrar={() => setMoviendo(false)}>
            <div className="flex flex-col gap-3">
              <Campo etiqueta="Categoría" valor={categoria} alCambiar={setCategoria} lista={categorias} marcador="Vacío = sin categoría" autoFoco />
              <BotonPanel variante="primario" disabled={trabajando} onClick={() => void aplicar('categoria', categoria.trim() || null)} className="h-10">
                Aplicar
              </BotonPanel>
            </div>
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Importar
// ─────────────────────────────────────────────────────────────────────────────

/** CSV mínimo: comillas, comas o punto y coma (como lo exporta Excel en español). */
export function leerCsv(texto: string): string[][] {
  const separador = (texto.split('\n')[0] ?? '').split(';').length > (texto.split('\n')[0] ?? '').split(',').length ? ';' : ','
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let comillas = false
  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i]!
    if (comillas) {
      if (caracter === '"' && texto[i + 1] === '"') {
        celda += '"'
        i++
      } else if (caracter === '"') comillas = false
      else celda += caracter
    } else if (caracter === '"') comillas = true
    else if (caracter === separador) {
      fila.push(celda)
      celda = ''
    } else if (caracter === '\n' || caracter === '\r') {
      if (caracter === '\r' && texto[i + 1] === '\n') i++
      fila.push(celda)
      if (fila.some((valor) => valor.trim())) filas.push(fila)
      fila = []
      celda = ''
    } else celda += caracter
  }
  fila.push(celda)
  if (fila.some((valor) => valor.trim())) filas.push(fila)
  return filas
}

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')

/** Nombres de columna que se aceptan para cada campo. */
const COLUMNAS: Record<keyof FilaImportada, string[]> = {
  nombre: ['nombre', 'producto', 'titulo'],
  precio: ['precio', 'valor', 'precioventa'],
  precioComparacion: ['precioantes', 'preciocomparacion', 'precioanterior', 'antes'],
  stock: ['stock', 'unidades', 'cantidad', 'inventario'],
  categoria: ['categoria', 'coleccion'],
  presentacion: ['presentacion', 'talla', 'tamano'],
  descripcion: ['descripcion', 'detalle'],
  fotos: ['fotos', 'foto', 'imagen', 'imagenes', 'urlfoto'],
}

const numero = (texto: string | undefined) => {
  const limpio = Number((texto ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(limpio) ? limpio : 0
}

export function filasDesdeCsv(texto: string): { filas: FilaImportada[]; problemas: string[] } {
  const [encabezado, ...resto] = leerCsv(texto)
  if (!encabezado) return { filas: [], problemas: ['El archivo está vacío.'] }
  const indice = Object.fromEntries(
    Object.entries(COLUMNAS).map(([campo, nombres]) => [campo, encabezado.findIndex((columna) => nombres.includes(normalizar(columna)))]),
  ) as Record<keyof FilaImportada, number>
  if (indice.nombre < 0 || indice.precio < 0) {
    return { filas: [], problemas: ['Faltan las columnas "nombre" y "precio" en la primera fila.'] }
  }
  const problemas: string[] = []
  const celda = (fila: string[], campo: keyof FilaImportada) => (indice[campo] >= 0 ? (fila[indice[campo]] ?? '').trim() : '')
  const filas = resto
    .map((fila, posicion) => {
      const nombre = celda(fila, 'nombre')
      const precio = numero(celda(fila, 'precio'))
      if (!nombre) {
        problemas.push(`Fila ${posicion + 2}: sin nombre, se omite.`)
        return null
      }
      const antes = numero(celda(fila, 'precioComparacion'))
      return {
        nombre: nombre.slice(0, 120),
        precio,
        precioComparacion: antes > precio ? antes : null,
        stock: numero(celda(fila, 'stock')),
        categoria: celda(fila, 'categoria') || null,
        presentacion: celda(fila, 'presentacion') || null,
        descripcion: celda(fila, 'descripcion') || null,
        fotos: celda(fila, 'fotos')
          .split(/[|\s]+/)
          .filter((url) => /^https?:\/\//.test(url)),
      }
    })
    .filter((fila): fila is NonNullable<typeof fila> => fila !== null)
  return { filas, problemas }
}

const PLANTILLA = 'nombre,precio,precio_antes,stock,categoria,presentacion,descripcion,fotos\nGorra llanera,45000,60000,12,Gorras,Talla única,Gorra bordada a mano,https://…/foto1.jpg|https://…/foto2.jpg\n'

export function ModalImportar({ alTerminar, alCerrar }: { alTerminar: (creados: number) => void; alCerrar: () => void }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { filas, problemas } = useMemo(() => (texto.trim() ? filasDesdeCsv(texto) : { filas: [], problemas: [] }), [texto])

  async function leerArchivo(archivo: File | undefined) {
    if (archivo) setTexto(await archivo.text())
  }

  function descargarPlantilla() {
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob(['﻿' + PLANTILLA], { type: 'text/csv;charset=utf-8' }))
    enlace.download = 'plantilla-productos.csv'
    enlace.click()
  }

  async function importar() {
    setEnviando(true)
    setError('')
    try {
      const { creados } = await importarProductos(filas)
      alTerminar(creados)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo importar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalPanel
      titulo="Importar productos"
      descripcion="Desde Excel o Google Sheets: guarda la hoja como CSV. Los productos se crean visibles, con su stock."
      alCerrar={alCerrar}
    >
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border border-dashed border-white/20 px-4 py-6 text-center text-[13px] text-sitio-suave transition-colors hover:border-white/40">
          <FileUp aria-hidden="true" className="h-5 w-5" />
          Elige el archivo .csv
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(evento) => void leerArchivo(evento.target.files?.[0])} />
        </label>
        <textarea
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          rows={4}
          placeholder="…o pega aquí las filas, con la de títulos primero"
          className="w-full resize-y rounded-lg border border-sitio-borde bg-sitio-campo px-3 py-2.5 font-mono text-[12px] outline-none placeholder:text-sitio-tenue focus:border-white/40"
        />
        <button type="button" onClick={descargarPlantilla} className="inline-flex items-center gap-1.5 self-start text-[12px] text-sitio-suave hover:text-white">
          <Download aria-hidden="true" className="h-3.5 w-3.5" />
          Descargar plantilla
        </button>

        {filas.length > 0 && (
          <div className="overflow-hidden rounded-[10px] border border-sitio-borde">
            <p className="border-b border-sitio-borde bg-white/[0.03] px-3 py-2 text-[12px]">{filas.length} productos listos</p>
            <ul className="max-h-40 divide-y divide-sitio-borde overflow-y-auto text-[12.5px]">
              {filas.slice(0, 50).map((fila, indice) => (
                <li key={indice} className="flex justify-between gap-3 px-3 py-1.5">
                  <span className="truncate">{fila.nombre}</span>
                  <span className="shrink-0 text-sitio-tenue">
                    {formatearPrecio(fila.precio)} · {fila.stock} u.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {problemas.slice(0, 4).map((problema) => (
          <p key={problema} className="text-[11.5px] text-sitio-ambar">
            {problema}
          </p>
        ))}
        <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
        <BotonPanel variante="primario" disabled={enviando || filas.length === 0} onClick={() => void importar()} className="h-10">
          {enviando ? 'Importando…' : `Importar ${filas.length || ''} productos`}
        </BotonPanel>
      </div>
    </ModalPanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────────────────────────────────────

export function ModalCategorias({
  productos,
  alTerminar,
  alCerrar,
}: {
  productos: ProductoPanel[]
  alTerminar: () => void
  alCerrar: () => void
}) {
  const conteo = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const producto of productos) {
      if (producto.categoria) mapa.set(producto.categoria, (mapa.get(producto.categoria) ?? 0) + 1)
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
  }, [productos])
  const [nombres, setNombres] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)

  async function cambiar(de: string, a: string | null) {
    if (
      a === null &&
      !(await confirmar({ titulo: `¿Quitar la categoría "${de}"?`, mensaje: 'Sus productos quedan sin categoría.', confirmar: 'Quitar', peligro: true }))
    )
      return
    setTrabajando(true)
    setError('')
    try {
      await renombrarCategoria(de, a)
      alTerminar()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <ModalPanel
      titulo="Categorías"
      descripcion="Renombra una para cambiarla en todos sus productos. Si le pones el nombre de otra, se juntan."
      alCerrar={alCerrar}
    >
      {conteo.length === 0 ? (
        <p className="text-[13px] text-sitio-tenue">Ningún producto tiene categoría todavía. Asígnalas al editar cada producto.</p>
      ) : (
        <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {conteo.map(([categoria, cantidad]) => {
            const nuevo = nombres[categoria] ?? categoria
            return (
              <li key={categoria} className="flex items-center gap-1.5">
                <input
                  value={nuevo}
                  onChange={(evento) => setNombres((actuales) => ({ ...actuales, [categoria]: evento.target.value.slice(0, 60) }))}
                  aria-label={`Nombre de ${categoria}`}
                  className="min-w-0 flex-1 rounded-lg border border-sitio-borde bg-sitio-campo px-3 py-2 text-[13px] outline-none focus:border-white/40"
                />
                <span className="w-10 shrink-0 text-right text-[11.5px] text-sitio-tenue">{cantidad}</span>
                <BotonPanel
                  variante="suave"
                  disabled={trabajando || !nuevo.trim() || nuevo.trim() === categoria}
                  onClick={() => void cambiar(categoria, nuevo.trim())}
                >
                  Guardar
                </BotonPanel>
                <button
                  type="button"
                  aria-label={`Quitar ${categoria}`}
                  disabled={trabajando}
                  onClick={() => void cambiar(categoria, null)}
                  className="grid h-[34px] w-8 place-items-center text-sitio-tenue hover:text-red-300"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
    </ModalPanel>
  )
}
