import Image from 'next/image'
import type { CSSProperties } from 'react'
import { ImageIcon } from 'lucide-react'
import type { ElementoLienzo, PropsLienzo } from '@/tipos/bloques'
import { esMedioLocal } from '@/utilidades/medios'

/** Tamaño de letra por defecto de cada pieza, en px sobre un lienzo de 1200. */
export const TAMANO_INICIAL: Record<ElementoLienzo['tipo'], number> = {
  titulo: 56,
  texto: 18,
  boton: 17,
  imagen: 16,
  forma: 16,
}

/** En el celular la letra baja a algo más de la mitad, salvo que se haya fijado. */
export const tamanoMovil = (elemento: ElementoLienzo) =>
  elemento.movil?.tamano ?? Math.max(12, Math.round((elemento.tamano ?? TAMANO_INICIAL[elemento.tipo]) * 0.58))

const ALINEAR = { izquierda: 'flex-start', centro: 'center', derecha: 'flex-end' } as const

/**
 * Las posiciones viajan como variables CSS (computador y celular) y la hoja de
 * estilos elige según el ancho: el lienzo se pinta igual en el servidor, en la
 * tienda y en la vista previa, sin JavaScript.
 */
function variables(elemento: ElementoLienzo, capa: number): CSSProperties {
  const movil = elemento.movil ?? {}
  return {
    '--x': `${elemento.x}%`,
    '--y': `${elemento.y}%`,
    '--w': `${elemento.w}%`,
    '--h': `${elemento.h}%`,
    '--xm': `${movil.x ?? elemento.x}%`,
    '--ym': `${movil.y ?? elemento.y}%`,
    '--wm': `${movil.w ?? elemento.w}%`,
    '--hm': `${movil.h ?? elemento.h}%`,
    '--t': elemento.tamano ?? TAMANO_INICIAL[elemento.tipo],
    '--tm': tamanoMovil(elemento),
    '--dm': movil.oculto ? 'none' : 'flex',
    zIndex: capa + 1,
  } as CSSProperties
}

function Pieza({ elemento }: { elemento: ElementoLienzo }) {
  const radio = elemento.radio ? `${elemento.radio}px` : undefined
  const opacidad = elemento.opacidad !== undefined ? elemento.opacidad / 100 : undefined
  const alineacion = elemento.alineacion ?? (elemento.tipo === 'boton' ? 'centro' : 'izquierda')

  switch (elemento.tipo) {
    case 'titulo':
    case 'texto':
      return (
        <div
          className={`h-full w-full overflow-hidden whitespace-pre-line ${elemento.tipo === 'titulo' ? 'font-display leading-[1.05] tracking-tight' : 'leading-relaxed'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: ALINEAR[alineacion],
            textAlign: alineacion === 'izquierda' ? 'left' : alineacion === 'derecha' ? 'right' : 'center',
            color: elemento.color,
            fontWeight: elemento.peso === 'negrita' ? 700 : elemento.tipo === 'titulo' ? 600 : 400,
          }}
        >
          <span className="w-full">{elemento.texto}</span>
        </div>
      )
    case 'boton':
      return (
        <a
          href={elemento.enlace || '#'}
          className="flex h-full w-full items-center justify-center px-[0.8em] text-center font-medium whitespace-nowrap transition hover:opacity-85"
          style={{
            color: elemento.color ?? (elemento.contorno ? 'var(--tinta)' : 'var(--marca-contraste)'),
            background: elemento.contorno ? 'transparent' : (elemento.fondo ?? 'var(--marca)'),
            border: elemento.contorno ? `2px solid ${elemento.color ?? 'currentColor'}` : undefined,
            borderRadius: radio ?? 'var(--radio-boton, var(--radio))',
            fontWeight: elemento.peso === 'negrita' ? 700 : 500,
          }}
        >
          {elemento.texto || 'Botón'}
        </a>
      )
    case 'imagen':
      return (
        <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: radio, opacity: opacidad }}>
          {elemento.imagenUrl ? (
            <Image
              src={elemento.imagenUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 60vw"
              unoptimized={esMedioLocal(elemento.imagenUrl)}
              className={elemento.ajuste === 'contener' ? 'object-contain' : 'object-cover'}
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-tinta/[0.06] text-[0.8em] text-tinta/40">
              <ImageIcon aria-hidden="true" className="h-[1.8em] w-[1.8em]" strokeWidth={1.4} />
              Foto
            </span>
          )}
        </div>
      )
    case 'forma':
      return (
        <div className="h-full w-full" style={{ background: elemento.fondo ?? 'var(--marca)', borderRadius: radio, opacity: opacidad }} />
      )
  }
}

/** Lienzo libre: piezas sueltas con posición y tamaño propios, una encima de otra. */
export function Lienzo({ alto, altoMovil, fondo, elementos }: PropsLienzo) {
  return (
    <section
      data-lienzo
      className="lienzo"
      style={{ '--ar': `1200 / ${alto}`, '--arm': `390 / ${altoMovil}`, background: fondo } as CSSProperties}
    >
      {elementos.map((elemento, capa) => (
        <div key={elemento.id} data-lienzo-el={elemento.id} className="lienzo-el" style={variables(elemento, capa)}>
          <Pieza elemento={elemento} />
        </div>
      ))}
    </section>
  )
}
