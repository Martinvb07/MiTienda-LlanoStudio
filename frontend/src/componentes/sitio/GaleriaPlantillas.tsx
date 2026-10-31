'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, X } from 'lucide-react'
import { ETIQUETAS_BLOQUE } from '@/tipos/bloques'
import { PLANES } from '@/utilidades/planes'
import { PLANTILLAS_TIENDA, type PlantillaTienda } from '@/utilidades/plantillas'
import { esPlantillaPagina, PLANTILLAS_PAGINA, planCompleto } from '@/utilidades/plantillasPagina'
import { PLANTILLAS_ENLACES } from '@/utilidades/plantillasEnlaces'
import { FUENTES_TITULOS } from '@/utilidades/tema'
import type { TipoSitio } from '@/tipos/tienda'

const SALIDA = [0.16, 1, 0.3, 1] as const

/** Las cuatro estilo supermercado: cabecera completa, categorías y grillas por pasillo. */
export const PLANTILLAS_PRO: ReadonlySet<string> = new Set(['mercado', 'ropa', 'vivero', 'megadeporte'])

const textoPlan = (plantilla: PlantillaTienda) =>
  plantilla.plan === 'GRATIS' ? 'Gratis' : `Desde ${PLANES[plantilla.plan].nombre}`

/**
 * Las de página se usan desde Gratis con las secciones del plan; esto dice
 * desde qué plan sale con todas, sin inventar nada.
 */
function notaCompleta(plantilla: PlantillaTienda) {
  if (!esPlantillaPagina(plantilla.clave)) return null
  const plan = planCompleto(plantilla)
  return plan === 'GRATIS' ? null : `Completa desde ${PLANES[plan].nombre}`
}

/**
 * Plantillas con capturas reales de tiendas armadas con ellas. Al hacer clic,
 * la captura crece hasta el modal con todo lo que trae (layoutId de Motion)
 * y al cerrar vuelve a su sitio.
 */
export function GaleriaPlantillas({ limite, pro, tipo = 'tienda' }: { limite?: number; pro?: boolean; tipo?: TipoSitio }) {
  const [abierta, setAbierta] = useState<PlantillaTienda | null>(null)
  const filtradas =
    tipo === 'pagina'
      ? PLANTILLAS_PAGINA
      : tipo === 'enlaces'
        ? PLANTILLAS_ENLACES
        : pro === undefined
        ? PLANTILLAS_TIENDA
        : PLANTILLAS_TIENDA.filter((plantilla) => PLANTILLAS_PRO.has(plantilla.clave) === pro)
  const plantillas = limite ? filtradas.slice(0, limite) : filtradas

  return (
    <>
      <div className="grid gap-x-5 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {plantillas.map((plantilla, indice) => (
          <motion.button
            key={plantilla.clave}
            type="button"
            onClick={() => setAbierta(plantilla)}
            data-revelar=""
            initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.1, delay: (indice % 3) * 0.08, ease: SALIDA }}
            className="group text-left"
          >
            <motion.div
              layoutId={`plantilla-${plantilla.clave}`}
              transition={{ duration: 0.7, ease: SALIDA }}
              className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-sitio-lateral"
            >
              <Image
                src={plantilla.captura}
                alt={`Ejemplo ${plantilla.ejemplo}, plantilla ${plantilla.nombre}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-top transition-transform duration-[1.4s] ease-salida group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/25" />
            </motion.div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <div>
                <h3 className="text-[19px] tracking-[-0.02em] text-white">{plantilla.nombre}</h3>
                <p className="mt-1 text-[13px] text-white/45">
                  {PLANTILLAS_PRO.has(plantilla.clave) && 'Pro · '}
                  {plantilla.categoria}
                </p>
              </div>
              <span className="shrink-0 text-[11px] tracking-[0.12em] text-white/45 uppercase">{textoPlan(plantilla)}</span>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {abierta && <ModalPlantilla plantilla={abierta} alCerrar={() => setAbierta(null)} />}
      </AnimatePresence>
    </>
  )
}

function ModalPlantilla({ plantilla, alCerrar }: { plantilla: PlantillaTienda; alCerrar: () => void }) {
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', alTeclear)
    }
  }, [alCerrar])

  const secciones = [
    ...(plantilla.ajustes?.cabecera === 'completa' ? ['Cabecera completa con buscador, menú y WhatsApp'] : []),
    ...new Set(plantilla.bloques('').map((bloque) => ETIQUETAS_BLOQUE[bloque.tipo])),
    ...(plantilla.tema.colorPrecio ? ['Precios destacados en color'] : []),
    ...(plantilla.ajustes?.fondoBio === 'degradado' ? ['Fondo degradado con tu color'] : []),
    ...(plantilla.ajustes?.fondoBio === 'malla' ? ['Fondo de malla de color'] : []),
    ...(plantilla.bloques('').some((bloque) => bloque.tipo === 'enlaces' && bloque.props.items.some((enlace) => enlace.destacado))
      ? ['Enlace destacado con brillo']
      : []),
  ]
  const colores = [plantilla.tema.colorMarca, plantilla.tema.colorFondo, plantilla.tema.colorTexto]

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-end justify-center md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Plantilla ${plantilla.nombre}`}
    >
      <motion.div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: SALIDA }}
        onClick={alCerrar}
      />

      <motion.div
        className="relative flex max-h-[92dvh] w-full max-w-[1180px] flex-col overflow-hidden rounded-t-[14px] border border-white/10 bg-sitio-lateral md:rounded-[14px]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
        transition={{ duration: 0.7, ease: SALIDA }}
      >
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur transition-colors hover:bg-white hover:text-black"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        {/* En celular todo el modal desliza junto; en escritorio cada columna tiene su scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[1.45fr_1fr] lg:overflow-hidden">
          {/* La tienda completa */}
          <div className="relative min-h-[300px] bg-sitio-lienzo p-4 md:p-6 lg:max-h-[92dvh] lg:overflow-y-auto lg:overscroll-contain">
            <motion.div
              layoutId={`plantilla-${plantilla.clave}`}
              transition={{ duration: 0.7, ease: SALIDA }}
              className="overflow-hidden rounded-[8px] bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
            >
              <div className="flex h-8 items-center gap-1.5 border-b border-white/10 bg-sitio-elevado px-3">
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="ml-3 truncate font-mono text-[10.5px] text-white/40">
                  {plantilla.ejemplo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}
                  .llanostudio.co
                </span>
              </div>
              <Image
                src={plantilla.captura.replace('.webp', '-completa.webp')}
                alt={`Página completa de ${plantilla.ejemplo}`}
                width={1100}
                height={2400}
                sizes="(max-width: 1024px) 100vw, 680px"
                className="h-auto w-full"
              />
            </motion.div>
          </div>

          {/* Ficha */}
          <motion.div
            className="flex flex-col border-t border-white/10 p-7 md:p-9 lg:max-h-[92dvh] lg:overflow-y-auto lg:overscroll-contain lg:border-t-0 lg:border-l"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: SALIDA }}
          >
            <span className="antetitulo">
              {PLANTILLAS_PRO.has(plantilla.clave) && 'Plantilla pro · '}
              {textoPlan(plantilla)}
            </span>
            <h3 className="mt-3 text-[34px] leading-[1.02] tracking-[-0.04em]">{plantilla.nombre}</h3>
            <p className="mt-2 text-[13px] text-white/45">
              {plantilla.categoria} · Ejemplo: {plantilla.ejemplo}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">{plantilla.descripcion}</p>

            <div className="mt-7 flex items-end gap-5">
              <div className="relative h-[230px] w-[112px] shrink-0 overflow-hidden rounded-[18px] border-[5px] border-sitio-elevado bg-black shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
                <Image src={plantilla.capturaMovil} alt="" fill sizes="112px" className="object-cover object-top" />
              </div>
              <div className="pb-1">
                <p className="text-[11px] tracking-[0.12em] text-white/45 uppercase">Estilo</p>
                <div className="mt-2.5 flex gap-1.5">
                  {colores.map((color, indice) => (
                    <span
                      key={`${indice}-${color}`}
                      className="h-6 w-6 rounded-full ring-1 ring-white/15"
                      style={{ background: color }}
                    />
                  ))}
                </div>
                <p className="mt-2.5 text-[13px] text-white/60">
                  Letra {FUENTES_TITULOS[plantilla.tema.fuenteTitulos].etiqueta.toLowerCase()}
                </p>
              </div>
            </div>

            <p className="mt-8 text-[11px] tracking-[0.12em] text-white/45 uppercase">Qué trae</p>
            <ul className="mt-3 border-b border-white/10">
              {secciones.map((seccion) => (
                <li key={seccion} className="flex items-center gap-3 border-t border-white/10 py-3 text-[14px] text-white/80">
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-white/40" />
                  {seccion}
                </li>
              ))}
              <li className="flex items-center gap-3 border-t border-white/10 py-3 text-[14px] text-white/80">
                <Check aria-hidden="true" className="h-3.5 w-3.5 text-white/40" />
                Textos de ejemplo listos para cambiar
              </li>
            </ul>

            <div className="mt-auto pt-8">
              <Link href={`/panel/crear-cuenta?plantilla=${plantilla.clave}`} className="group boton boton-primario w-full">
                Usar esta plantilla
                <ArrowRight aria-hidden="true" className="h-[15px] w-[15px] transition-transform duration-500 ease-salida group-hover:translate-x-1" />
              </Link>
              <p className="mt-3 text-center text-[12px] text-white/40">
                {esPlantillaPagina(plantilla.clave)
                  ? [notaCompleta(plantilla), 'La cambias cuando quieras.'].filter(Boolean).join('. ')
                  : 'La cambias cuando quieras sin perder productos ni textos.'}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
