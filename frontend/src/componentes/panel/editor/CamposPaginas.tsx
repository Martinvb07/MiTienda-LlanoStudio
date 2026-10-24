'use client'

import { motion } from 'motion/react'
import { FileText, Home, Plus, Trash2 } from 'lucide-react'
import type { PaginaExtra } from '@/tipos/tienda'
import { cn } from '@/utilidades/clases'
import { generarSlug } from '@/utilidades/formato'
import { RUTAS_RESERVADAS } from '@/utilidades/paginas'
import { planMinimo } from '@/utilidades/planes'
import { Campo, Candado, CURVA } from '../ui/basicos'

/**
 * Las páginas del sitio: Inicio y las extra (/servicios, /nosotros…). Se elige
 * cuál se edita abajo en Secciones; la elegida muestra su nombre y su dirección.
 */
export function CamposPaginas({
  paginas,
  activa,
  limite,
  dominio,
  alElegir,
  alAgregar,
  alCambiar,
  alQuitar,
}: {
  paginas: PaginaExtra[]
  /** null = la de inicio. */
  activa: string | null
  limite: number
  /** "tunegocio.llanostudio.co", para mostrar la dirección completa. */
  dominio: string
  alElegir: (id: string | null) => void
  alAgregar: () => void
  alCambiar: (id: string, cambios: Partial<Pick<PaginaExtra, 'titulo' | 'ruta'>>) => void
  alQuitar: (id: string) => void
}) {
  const actual = paginas.find((pagina) => pagina.id === activa)
  const opciones = [{ id: null, titulo: 'Inicio', Icono: Home }, ...paginas.map((pagina) => ({ id: pagina.id, titulo: pagina.titulo || 'Sin nombre', Icono: FileText }))]
  const repetida = actual && paginas.some((otra) => otra.id !== actual.id && otra.ruta === actual.ruta)
  const reservada = actual && RUTAS_RESERVADAS.has(actual.ruta)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {opciones.map(({ id, titulo, Icono }) => {
          const elegida = id === activa
          return (
            <button
              key={id ?? 'inicio'}
              type="button"
              aria-pressed={elegida}
              onClick={() => alElegir(id)}
              className={cn(
                'relative inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition-colors',
                elegida ? 'border-white bg-white text-black' : 'border-sitio-borde text-sitio-suave hover:border-white/30 hover:text-white',
              )}
            >
              <Icono aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{titulo}</span>
            </button>
          )
        })}
        {limite > 0 && paginas.length < limite && (
          <button
            type="button"
            onClick={alAgregar}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-sitio-borde px-2.5 text-[12.5px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Nueva página
          </button>
        )}
      </div>

      {limite === 0 ? (
        <Candado plan={planMinimo((plan) => plan.paginasExtra > 0)}>Páginas aparte, como /servicios o /nosotros.</Candado>
      ) : paginas.length >= limite ? (
        <p className="text-[11.5px] text-sitio-tenue">Tu plan incluye hasta {limite} páginas aparte de Inicio.</p>
      ) : null}

      {actual && (
        <motion.div
          key={actual.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: CURVA }}
          className="flex flex-col gap-2.5 rounded-[12px] border border-sitio-borde bg-white/[0.02] p-3"
        >
          <Campo etiqueta="Nombre de la página" valor={actual.titulo} alCambiar={(titulo) => alCambiar(actual.id, { titulo })} maximo={60} />
          <Campo
            etiqueta="Dirección"
            valor={actual.ruta}
            prefijo="/"
            alCambiar={(ruta) => alCambiar(actual.id, { ruta: generarSlug(ruta).slice(0, 40) })}
            error={repetida ? 'Otra página ya tiene esa dirección.' : reservada ? 'Esa dirección ya la usa el sitio.' : !actual.ruta ? 'Escribe una dirección.' : undefined}
            ayuda={`${dominio}/${actual.ruta}`}
          />
          <button
            type="button"
            onClick={() => alQuitar(actual.id)}
            className="inline-flex items-center gap-1.5 self-start text-[12px] text-red-300/80 transition-colors hover:text-red-300"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            Quitar página
          </button>
        </motion.div>
      )}
    </div>
  )
}
