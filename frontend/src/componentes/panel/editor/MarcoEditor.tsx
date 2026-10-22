'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Monitor, Smartphone, Check } from 'lucide-react'
import { cn } from '@/utilidades/clases'
import { BotonPanel, CURVA, Etiqueta, Segmentado } from '../ui/basicos'
import type { Dispositivo } from './VistaPrevia'

const DISPOSITIVOS = [
  {
    valor: 'escritorio',
    titulo: 'Escritorio',
    etiqueta: <Monitor aria-hidden="true" className="h-4 w-4" />,
  },
  {
    valor: 'movil',
    titulo: 'Móvil',
    etiqueta: <Smartphone aria-hidden="true" className="h-4 w-4" />,
  },
] as const

interface Props {
  /** Texto del botón de volver ("Panel", "Productos"). */
  volver: string
  alCerrar: () => void
  titulo: string
  estado: { texto: string; tono: 'verde' | 'ambar' }
  sucio: boolean
  guardadoReciente: boolean
  subiendo: number
  guardando: boolean
  puedeGuardar: boolean
  textoGuardar: string
  alGuardar: () => void
  dispositivo: Dispositivo
  alCambiarDispositivo: (dispositivo: Dispositivo) => void
  /** Selector extra de la barra (p. ej. Página / Tarjeta). */
  extra?: ReactNode
  /** Acciones extra junto a Guardar (p. ej. Ver tienda). */
  acciones?: ReactNode
  lateral: ReactNode
  vista: ReactNode
}

/**
 * Editor a pantalla completa, igual al de proyectos de llanostudio.co: barra
 * arriba, campos por secciones a la izquierda y la página real a la derecha
 * actualizándose mientras se escribe. En celular, pestañas Editar / Vista previa.
 */
export function MarcoEditor(props: Props) {
  const [pestana, setPestana] = useState<'editar' | 'vista'>('editar')

  // Bloquea el scroll de la página de fondo mientras el editor está abierto.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  // Va directo al body: así ningún transform o filtro de las animaciones del
  // panel se vuelve el contenedor de este `fixed`.
  return createPortal(
    <motion.div
      role="dialog"
      aria-label={`Editor: ${props.titulo}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.45, ease: CURVA }}
      className="marco-oscuro fixed inset-0 z-[200] flex flex-col bg-sitio-lateral font-sans text-white"
    >
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-sitio-borde bg-sitio-lateral px-2.5 md:gap-3.5 md:px-4">
        <BotonPanel variante="fantasma" onClick={props.alCerrar}>
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{props.volver}</span>
        </BotonPanel>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <strong className="truncate text-[14.5px] font-medium">{props.titulo}</strong>
          <span className="hidden sm:inline">
            <Etiqueta tono={props.estado.tono}>{props.estado.texto}</Etiqueta>
          </span>
          <AnimatePresence mode="wait">
            {props.sucio ? (
              <motion.span
                key="sucio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden text-[11.5px] whitespace-nowrap text-sitio-ambar md:inline"
              >
                Cambios sin guardar
              </motion.span>
            ) : (
              props.guardadoReciente && (
                <motion.span
                  key="guardado"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: CURVA }}
                  className="text-[11.5px] whitespace-nowrap text-sitio-verde"
                >
                  <Check aria-hidden="true" className="inline h-3 w-3 align-[-1px]" /> Guardado
                </motion.span>
              )
            )}
          </AnimatePresence>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {props.extra}
          <Segmentado
            opciones={DISPOSITIVOS}
            valor={props.dispositivo}
            alCambiar={props.alCambiarDispositivo}
          />
        </div>

        <div className="flex items-center gap-2.5">
          {props.subiendo > 0 && (
            <span className="hidden text-[12.5px] text-sitio-tenue sm:inline">Subiendo {props.subiendo}…</span>
          )}
          {props.acciones}
          <BotonPanel
            variante="primario"
            onClick={props.alGuardar}
            disabled={props.guardando || props.subiendo > 0 || !props.puedeGuardar}
          >
            {props.guardando ? 'Guardando…' : props.textoGuardar}
          </BotonPanel>
        </div>
      </header>

      <div className="flex shrink-0 border-b border-sitio-borde lg:hidden">
        {(['editar', 'vista'] as const).map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => setPestana(opcion)}
            className={cn(
              'h-[42px] flex-1 text-[13px] transition-colors',
              pestana === opcion ? 'text-white shadow-[inset_0_-2px_0_#fff]' : 'text-sitio-tenue',
            )}
          >
            {opcion === 'editar' ? 'Editar' : 'Vista previa'}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[380px_1fr]">
        <aside
          className={cn(
            'overflow-y-auto border-sitio-borde bg-sitio-lateral px-3.5 pt-3.5 pb-16 lg:block lg:border-r',
            pestana === 'vista' && 'hidden',
          )}
        >
          {props.lateral}
        </aside>
        <div className={cn('min-h-0 lg:grid', pestana === 'editar' ? 'hidden' : 'grid')}>{props.vista}</div>
      </div>
    </motion.div>,
    document.body,
  )
}

/**
 * Atajos y salvaguardas comunes a los editores: Ctrl/Cmd+S guarda y cerrar la
 * pestaña con cambios pendientes pide confirmación.
 */
export function useAtajosEditor(sucio: boolean, guardar: () => void) {
  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 's') {
        evento.preventDefault()
        guardar()
      }
    }
    function alSalir(evento: BeforeUnloadEvent) {
      if (sucio) evento.preventDefault()
    }
    window.addEventListener('keydown', alTeclear)
    window.addEventListener('beforeunload', alSalir)
    return () => {
      window.removeEventListener('keydown', alTeclear)
      window.removeEventListener('beforeunload', alSalir)
    }
  }, [sucio, guardar])
}
