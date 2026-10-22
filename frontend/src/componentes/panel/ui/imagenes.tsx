'use client'

import { useState } from 'react'
/* eslint-disable @next/next/no-img-element -- miniaturas del panel: URLs de
   R2 o locales que no tiene sentido pasar por el optimizador. */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ImagePlus, Plus, X } from 'lucide-react'
import { FORMATOS_IMAGEN, subirImagen } from '@/servicios/panel'
import { cn } from '@/utilidades/clases'
import { CURVA } from './basicos'

const POP = { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.85 } }

function archivosDe(evento: React.DragEvent | React.ChangeEvent<HTMLInputElement>): File[] {
  const lista = 'dataTransfer' in evento ? evento.dataTransfer.files : evento.currentTarget.files
  return Array.from(lista ?? []).filter((archivo) => archivo.type.startsWith('image/'))
}

interface PropsSubida {
  /** Avisa al editor de errores y de cuántas subidas siguen en curso. */
  alError: (mensaje: string) => void
  alSubiendo?: (delta: number) => void
}

async function subir(archivo: File, { alError, alSubiendo }: PropsSubida): Promise<string | null> {
  alSubiendo?.(1)
  try {
    return await subirImagen(archivo)
  } catch (error) {
    alError(error instanceof Error ? error.message : `No se pudo subir ${archivo.name}`)
    return null
  } finally {
    alSubiendo?.(-1)
  }
}

/** Una sola imagen (portada, logo): se arrastra encima o se elige con clic. */
export function ZonaImagen({
  url,
  alCambiar,
  proporcion = 'aspect-[16/10]',
  texto = 'Arrastra la imagen aquí',
  ...subida
}: PropsSubida & {
  url: string | null | undefined
  alCambiar: (url: string | null) => void
  proporcion?: string
  texto?: string
}) {
  const [encima, setEncima] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  async function tomar(archivos: File[]) {
    setEncima(false)
    const [archivo] = archivos
    if (!archivo) return
    setSubiendo(true)
    const nueva = await subir(archivo, subida)
    setSubiendo(false)
    if (nueva) alCambiar(nueva)
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(evento) => {
          evento.preventDefault()
          setEncima(true)
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          void tomar(archivosDe(evento))
        }}
        className={cn(
          'group relative grid cursor-pointer place-items-center overflow-hidden rounded-[10px] border border-dashed transition-colors',
          proporcion,
          encima ? 'border-white/55 bg-sitio-elevado' : 'border-white/[0.18] bg-sitio-modal hover:border-white/55 hover:bg-sitio-elevado',
        )}
      >
        {url ? (
          <>
            <img src={url} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center text-[11px] opacity-0 transition-opacity group-hover:opacity-100">
              Arrastra otra imagen o haz clic para cambiarla
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center px-4 text-center text-[13px] leading-relaxed text-sitio-suave">
            <ImagePlus aria-hidden="true" className="mb-2 h-5 w-5 text-sitio-tenue" />
            {texto}
            <br />
            <small className="text-sitio-tenue">o haz clic para elegirla</small>
          </span>
        )}
        <AnimatePresence>
          {subiendo && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="brillo absolute inset-0 z-[2]"
            />
          )}
        </AnimatePresence>
        <input
          type="file"
          accept={FORMATOS_IMAGEN}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(evento) => {
            const archivos = archivosDe(evento)
            evento.currentTarget.value = '' // así se puede volver a elegir el mismo archivo
            void tomar(archivos)
          }}
        />
      </label>
      {url && (
        <button
          type="button"
          onClick={() => alCambiar(null)}
          className="self-start text-[11.5px] text-sitio-tenue transition-colors hover:text-white"
        >
          Quitar imagen
        </button>
      )}
    </div>
  )
}

function mover<T>(lista: T[], desde: number, hasta: number): T[] {
  if (hasta < 0 || hasta >= lista.length || desde === hasta) return lista
  const copia = [...lista]
  const [elemento] = copia.splice(desde, 1)
  copia.splice(hasta, 0, elemento as T)
  return copia
}

/** Varias imágenes en cuadrícula: se suman arrastrando y se ordenan arrastrando. */
export function Galeria({
  urls,
  alCambiar,
  maximo = 10,
  ...subida
}: PropsSubida & { urls: string[]; alCambiar: (urls: string[]) => void; maximo?: number }) {
  const [arrastrando, setArrastrando] = useState(-1)
  const [encima, setEncima] = useState(false)
  const [pendientes, setPendientes] = useState(0)

  async function sumar(archivos: File[]) {
    setEncima(false)
    const cupo = archivos.slice(0, Math.max(0, maximo - urls.length - pendientes))
    if (cupo.length < archivos.length) subida.alError(`Tu plan admite hasta ${maximo} fotos por producto.`)
    setPendientes((valor) => valor + cupo.length)
    let actuales = urls
    for (const archivo of cupo) {
      const url = await subir(archivo, subida)
      setPendientes((valor) => valor - 1)
      if (url) {
        actuales = [...actuales, url]
        alCambiar(actuales)
      }
    }
  }

  function soltar(evento: React.DragEvent, hasta: number) {
    evento.preventDefault()
    if (arrastrando >= 0) {
      alCambiar(mover(urls, arrastrando, hasta))
      setArrastrando(-1)
    } else {
      void sumar(archivosDe(evento))
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <AnimatePresence initial={false}>
        {urls.map((url, indice) => (
          <motion.figure
            key={url}
            layout
            {...POP}
            transition={{ duration: 0.3, ease: CURVA }}
            draggable
            onDragStart={() => setArrastrando(indice)}
            onDragEnd={() => setArrastrando(-1)}
            onDragOver={(evento) => evento.preventDefault()}
            onDrop={(evento) => soltar(evento, indice)}
            className={cn(
              'group relative m-0 aspect-square cursor-grab overflow-hidden rounded-lg border border-sitio-borde',
              arrastrando === indice && 'opacity-35',
            )}
          >
            <img src={url} alt={`Foto ${indice + 1}`} draggable={false} className="h-full w-full object-cover" />
            {indice === 0 && (
              <span className="absolute top-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9.5px] font-medium">
                Portada
              </span>
            )}
            <div className="absolute right-1 bottom-1 flex gap-[3px] opacity-0 transition-opacity group-hover:opacity-100">
              {[
                { Icono: ArrowLeft, accion: () => alCambiar(mover(urls, indice, indice - 1)), etiqueta: 'Antes' },
                { Icono: ArrowRight, accion: () => alCambiar(mover(urls, indice, indice + 1)), etiqueta: 'Después' },
                { Icono: X, accion: () => alCambiar(urls.filter((_, otro) => otro !== indice)), etiqueta: 'Quitar' },
              ].map((boton) => (
                <button
                  key={boton.etiqueta}
                  type="button"
                  aria-label={boton.etiqueta}
                  onClick={boton.accion}
                  className="grid h-[22px] w-[22px] place-items-center rounded-md bg-black/75 text-white transition-colors hover:bg-white hover:text-black"
                >
                  <boton.Icono aria-hidden="true" className="h-3 w-3" />
                </button>
              ))}
            </div>
          </motion.figure>
        ))}
        {Array.from({ length: pendientes }, (_, indice) => (
          <motion.div key={`pendiente-${indice}`} {...POP} className="brillo aspect-square rounded-lg border border-sitio-borde" />
        ))}
      </AnimatePresence>

      {urls.length + pendientes < maximo && (
        <label
          onDragOver={(evento) => {
            evento.preventDefault()
            setEncima(true)
          }}
          onDragLeave={() => setEncima(false)}
          onDrop={(evento) => soltar(evento, urls.length - 1)}
          className={cn(
            'relative grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed transition-colors',
            encima ? 'border-white/55 bg-sitio-elevado' : 'border-white/[0.18] bg-sitio-modal hover:border-white/55',
          )}
        >
          <span className="flex flex-col items-center gap-1 text-sitio-suave">
            <Plus aria-hidden="true" className="h-4 w-4" />
            <small className="text-[10.5px]">Agregar</small>
          </span>
          <input
            type="file"
            multiple
            accept={FORMATOS_IMAGEN}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(evento) => {
              const archivos = archivosDe(evento)
              evento.currentTarget.value = ''
              void sumar(archivos)
            }}
          />
        </label>
      )}
    </div>
  )
}
