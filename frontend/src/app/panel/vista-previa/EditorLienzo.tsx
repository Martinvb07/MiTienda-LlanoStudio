'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as EventoPuntero } from 'react'
import { ArrowDown, ArrowUp, Copy, MoveVertical, Trash2 } from 'lucide-react'
import type { CajaLienzo } from '@/tipos/bloques'
import type { AccionLienzo, MensajeLienzo } from './mensajes'

type Elegido = { bloque: string; elemento: string } | null
type Asa = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const ASAS: { asa: Asa; izquierda: string; arriba: string; cursor: string }[] = [
  { asa: 'nw', izquierda: '0%', arriba: '0%', cursor: 'nwse-resize' },
  { asa: 'n', izquierda: '50%', arriba: '0%', cursor: 'ns-resize' },
  { asa: 'ne', izquierda: '100%', arriba: '0%', cursor: 'nesw-resize' },
  { asa: 'e', izquierda: '100%', arriba: '50%', cursor: 'ew-resize' },
  { asa: 'se', izquierda: '100%', arriba: '100%', cursor: 'nwse-resize' },
  { asa: 's', izquierda: '50%', arriba: '100%', cursor: 'ns-resize' },
  { asa: 'sw', izquierda: '0%', arriba: '100%', cursor: 'nesw-resize' },
  { asa: 'w', izquierda: '0%', arriba: '50%', cursor: 'ew-resize' },
]

/** Distancia en px a la que una pieza se pega a una guía. */
const IMAN = 6

const esMovil = () => window.matchMedia('(max-width: 640px)').matches
const redondear = (valor: number) => Math.round(valor * 10) / 10

function avisar(mensaje: Omit<MensajeLienzo, 'tipo' | 'movil'>) {
  window.parent.postMessage({ tipo: 'mt-lienzo', movil: esMovil(), ...mensaje } satisfies MensajeLienzo, window.location.origin)
}

function lienzoDe(bloque: string) {
  return document.querySelector<HTMLElement>(`[data-bloque="${CSS.escape(bloque)}"] [data-lienzo]`)
}

function piezaDe(bloque: string, elemento: string) {
  return lienzoDe(bloque)?.querySelector<HTMLElement>(`[data-lienzo-el="${CSS.escape(elemento)}"]`) ?? null
}

/** Caja de una pieza en % de su lienzo, tal como se ve ahora (computador o celular). */
function cajaDe(pieza: HTMLElement, lienzo: HTMLElement): CajaLienzo {
  const a = pieza.getBoundingClientRect()
  const b = lienzo.getBoundingClientRect()
  return {
    x: ((a.left - b.left) / b.width) * 100,
    y: ((a.top - b.top) / b.height) * 100,
    w: (a.width / b.width) * 100,
    h: (a.height / b.height) * 100,
  }
}

/** Mueve la pieza en pantalla mientras se arrastra; el editor guarda al soltar. */
function aplicar(pieza: HTMLElement, caja: CajaLienzo) {
  const sufijo = esMovil() ? 'm' : ''
  pieza.style.setProperty(`--x${sufijo}`, `${caja.x}%`)
  pieza.style.setProperty(`--y${sufijo}`, `${caja.y}%`)
  pieza.style.setProperty(`--w${sufijo}`, `${caja.w}%`)
  pieza.style.setProperty(`--h${sufijo}`, `${caja.h}%`)
}

interface Arrastre {
  modo: 'mover' | 'asa' | 'alto'
  bloque: string
  elemento: string | null
  asa?: Asa
  inicioX: number
  inicioY: number
  caja0: CajaLienzo
  ancho: number
  alto: number
  /** Bordes y centros de las otras piezas y del lienzo, en %. */
  guiasX: number[]
  guiasY: number[]
  movido: boolean
  /** La pieza ya estaba elegida: un clic sin mover pasa a la de abajo. */
  yaElegida: boolean
  caja?: CajaLienzo
  altoNuevo?: number
  /** Al mover un grupo: la caja de cada pieza al empezar (caja0 es la que las abarca). */
  grupo0?: { id: string; caja: CajaLienzo }[]
  cajas?: Record<string, CajaLienzo>
}

/** La caja que abarca a varias. */
function abarcar(cajas: CajaLienzo[]): CajaLienzo {
  const x = Math.min(...cajas.map((caja) => caja.x))
  const y = Math.min(...cajas.map((caja) => caja.y))
  return {
    x,
    y,
    w: Math.max(...cajas.map((caja) => caja.x + caja.w)) - x,
    h: Math.max(...cajas.map((caja) => caja.y + caja.h)) - y,
  }
}

const redondearCaja = ({ x, y, w, h }: CajaLienzo): CajaLienzo => ({ x: redondear(x), y: redondear(y), w: redondear(w), h: redondear(h) })

/**
 * Edición directa del lienzo libre dentro de la vista previa: elegir una pieza,
 * arrastrarla, estirarla por sus asas (con guías que imantan al centro y a los
 * bordes de las demás) y cambiar el alto del lienzo. Con Shift + clic se eligen
 * varias: se mueven juntas (arrastre o flechas), y la barra las duplica, las
 * borra o las cambia de capa a todas. Todo se le avisa al editor por
 * postMessage; aquí sólo se mueve en pantalla mientras dura el gesto.
 */
export function EditorLienzo({ externo, grupoExterno = [] }: { externo: Elegido; grupoExterno?: string[] }) {
  const [elegido, setElegido] = useState<Elegido>(externo)
  const [grupo, setGrupo] = useState<string[]>(grupoExterno)
  const clave = `${externo ? `${externo.bloque}/${externo.elemento}` : ''}|${grupoExterno.join(',')}`
  const [claveAnterior, setClaveAnterior] = useState(clave)
  if (clave !== claveAnterior) {
    setClaveAnterior(clave)
    setElegido(externo)
    setGrupo(grupoExterno)
  }
  // Las piezas elegidas: el grupo si hay varias, si no la única.
  const seleccion = elegido ? (grupo.length > 1 ? grupo : [elegido.elemento]) : []
  const varios = seleccion.length > 1

  const [caja, setCaja] = useState<DOMRect | null>(null)
  const [cajasGrupo, setCajasGrupo] = useState<DOMRect[]>([])
  const [marcoLienzo, setMarcoLienzo] = useState<{ bloque: string; caja: DOMRect } | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)
  const [guias, setGuias] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })
  const arrastre = useRef<Arrastre | null>(null)

  // La caja de la pieza elegida y la del lienzo activo se miden en cada cuadro:
  // así siguen al scroll, a las fotos que cargan y al propio arrastre.
  const bloqueActivo = elegido?.bloque ?? sobre
  useEffect(() => {
    let cuadro = 0
    const medir = () => {
      const pieza = elegido ? piezaDe(elegido.bloque, elegido.elemento) : null
      setCaja(pieza ? pieza.getBoundingClientRect() : null)
      setCajasGrupo(
        elegido && grupo.length > 1
          ? grupo.map((id) => piezaDe(elegido.bloque, id)?.getBoundingClientRect()).filter((rect): rect is DOMRect => Boolean(rect))
          : [],
      )
      const lienzo = bloqueActivo ? lienzoDe(bloqueActivo) : null
      setMarcoLienzo(lienzo && bloqueActivo ? { bloque: bloqueActivo, caja: lienzo.getBoundingClientRect() } : null)
      cuadro = requestAnimationFrame(medir)
    }
    medir()
    return () => cancelAnimationFrame(cuadro)
  }, [elegido, grupo, bloqueActivo])

  useEffect(() => {
    /** Elige ninguna, una o varias piezas de un lienzo y se lo cuenta al editor. */
    function elegirVarias(bloque: string, ids: string[]) {
      setElegido(ids[0] ? { bloque, elemento: ids[0] } : null)
      setGrupo(ids.length > 1 ? ids : [])
      avisar({ bloque, elemento: ids[0] ?? null, accion: 'elegir', ...(ids.length > 1 ? { elementos: ids } : {}) })
    }

    function empezar(evento: PointerEvent, modo: Arrastre['modo'], bloque: string, elemento: string | null, asa?: Asa, conGrupo?: string[]) {
      const lienzo = lienzoDe(bloque)
      if (!lienzo) return
      const marco = lienzo.getBoundingClientRect()
      const pieza = elemento ? piezaDe(bloque, elemento) : null
      const moviendo = new Set(conGrupo && conGrupo.length > 1 ? conGrupo : elemento ? [elemento] : [])
      const otras = Array.from(lienzo.querySelectorAll<HTMLElement>('[data-lienzo-el]')).filter(
        (nodo) => !moviendo.has(nodo.dataset.lienzoEl!) && getComputedStyle(nodo).display !== 'none',
      )
      const cajas = otras.map((nodo) => cajaDe(nodo, lienzo))
      const grupo0 =
        conGrupo && conGrupo.length > 1
          ? conGrupo.flatMap((id) => {
              const nodo = piezaDe(bloque, id)
              return nodo ? [{ id, caja: cajaDe(nodo, lienzo) }] : []
            })
          : undefined
      arrastre.current = {
        modo,
        bloque,
        elemento,
        asa,
        grupo0,
        inicioX: evento.clientX,
        inicioY: evento.clientY,
        caja0: grupo0 ? abarcar(grupo0.map((otra) => otra.caja)) : pieza ? cajaDe(pieza, lienzo) : { x: 0, y: 0, w: 100, h: 100 },
        ancho: marco.width,
        alto: marco.height,
        guiasX: [0, 50, 100, ...cajas.flatMap((otra) => [otra.x, otra.x + otra.w / 2, otra.x + otra.w])],
        guiasY: [0, 50, 100, ...cajas.flatMap((otra) => [otra.y, otra.y + otra.h / 2, otra.y + otra.h])],
        movido: false,
        yaElegida: Boolean(elemento && elegido?.bloque === bloque && elegido.elemento === elemento),
      }
    }

    function alPresionar(evento: PointerEvent) {
      const objetivo = evento.target as HTMLElement
      if (objetivo.closest('[data-controles-lienzo]')) return
      const nodoPieza = objetivo.closest<HTMLElement>('[data-lienzo-el]')
      const lienzo = objetivo.closest<HTMLElement>('[data-lienzo]')
      if (!lienzo) {
        return
      }
      const bloque = lienzo.closest<HTMLElement>('[data-bloque]')?.dataset.bloque
      if (!bloque) return
      evento.preventDefault()
      if (!nodoPieza?.dataset.lienzoEl) {
        // Clic en el fondo del lienzo: se suelta lo elegido (con Shift se conserva).
        if (!evento.shiftKey) elegirVarias(bloque, [])
        return
      }
      const elemento = nodoPieza.dataset.lienzoEl
      const actuales = elegido?.bloque === bloque ? seleccion : []
      if (evento.shiftKey) {
        // Shift + clic suma la pieza al grupo, o la quita si ya estaba.
        elegirVarias(bloque, actuales.includes(elemento) ? actuales.filter((id) => id !== elemento) : [...actuales, elemento])
        return
      }
      if (actuales.length > 1 && actuales.includes(elemento)) {
        // Arrastrar una del grupo mueve a todas.
        empezar(evento, 'mover', bloque, elemento, undefined, actuales)
        return
      }
      setElegido({ bloque, elemento })
      setGrupo([])
      empezar(evento, 'mover', bloque, elemento)
    }

    function alMover(evento: PointerEvent) {
      const objetivo = evento.target as HTMLElement | null
      const lienzo = objetivo?.closest?.<HTMLElement>('[data-lienzo]')
      setSobre(lienzo?.closest<HTMLElement>('[data-bloque]')?.dataset.bloque ?? null)

      const actual = arrastre.current
      if (!actual) return
      const dx = evento.clientX - actual.inicioX
      const dy = evento.clientY - actual.inicioY
      if (!actual.movido && Math.hypot(dx, dy) < 3) return
      actual.movido = true
      const px = (dx / actual.ancho) * 100
      const py = (dy / actual.alto) * 100

      if (actual.modo === 'alto') {
        const lienzo = lienzoDe(actual.bloque)
        if (!lienzo) return
        const base = esMovil() ? 390 : 1200
        const nuevo = Math.max(base * 0.12, Math.round(((actual.alto + dy) / actual.ancho) * base))
        lienzo.style.setProperty(esMovil() ? '--arm' : '--ar', `${base} / ${nuevo}`)
        actual.altoNuevo = nuevo
        return
      }

      const pieza = actual.elemento ? piezaDe(actual.bloque, actual.elemento) : null
      if (!pieza && !actual.grupo0) return
      const { x, y, w, h } = actual.caja0
      let caja: CajaLienzo

      if (actual.modo === 'mover') {
        caja = { x: x + px, y: y + py, w, h }
        // Imán: borde izquierdo, centro o borde derecho contra las guías.
        const tolX = (IMAN / actual.ancho) * 100
        const tolY = (IMAN / actual.alto) * 100
        const pegadasX: number[] = []
        const pegadasY: number[] = []
        let mejorX = { distancia: tolX, ajuste: 0, guia: -1 }
        for (const guia of actual.guiasX) {
          for (const borde of [caja.x, caja.x + w / 2, caja.x + w]) {
            const distancia = Math.abs(guia - borde)
            if (distancia < mejorX.distancia) mejorX = { distancia, ajuste: guia - borde, guia }
          }
        }
        let mejorY = { distancia: tolY, ajuste: 0, guia: -1 }
        for (const guia of actual.guiasY) {
          for (const borde of [caja.y, caja.y + h / 2, caja.y + h]) {
            const distancia = Math.abs(guia - borde)
            if (distancia < mejorY.distancia) mejorY = { distancia, ajuste: guia - borde, guia }
          }
        }
        if (mejorX.guia >= 0 && !evento.altKey) {
          caja.x += mejorX.ajuste
          pegadasX.push(mejorX.guia)
        }
        if (mejorY.guia >= 0 && !evento.altKey) {
          caja.y += mejorY.ajuste
          pegadasY.push(mejorY.guia)
        }
        setGuias({ x: pegadasX, y: pegadasY })
      } else {
        const asa = actual.asa ?? 'se'
        caja = { x, y, w, h }
        if (asa.includes('e')) caja.w = w + px
        if (asa.includes('w')) {
          caja.x = x + px
          caja.w = w - px
        }
        if (asa.includes('s')) caja.h = h + py
        if (asa.includes('n')) {
          caja.y = y + py
          caja.h = h - py
        }
        // Con Shift, las esquinas guardan la proporción.
        if (evento.shiftKey && asa.length === 2) {
          const nuevoAlto = caja.w * (h / w)
          if (asa.includes('n')) caja.y = y + h - nuevoAlto
          caja.h = nuevoAlto
        }
        caja.w = Math.max(2, caja.w)
        caja.h = Math.max(2, caja.h)
      }
      actual.caja = caja
      if (actual.grupo0) {
        // El grupo se corre lo mismo que la caja que lo abarca (ya imantada).
        const dx2 = caja.x - x
        const dy2 = caja.y - y
        actual.cajas = {}
        for (const { id, caja: inicial } of actual.grupo0) {
          const nueva = { ...inicial, x: inicial.x + dx2, y: inicial.y + dy2 }
          actual.cajas[id] = nueva
          const nodo = piezaDe(actual.bloque, id)
          if (nodo) aplicar(nodo, nueva)
        }
        return
      }
      if (pieza) aplicar(pieza, caja)
    }

    function alSoltar() {
      const actual = arrastre.current
      arrastre.current = null
      setGuias({ x: [], y: [] })
      if (!actual) return
      if (actual.modo === 'alto') {
        if (actual.altoNuevo) avisar({ bloque: actual.bloque, elemento: null, accion: 'alto', alto: actual.altoNuevo })
        return
      }
      if (!actual.elemento) return
      if (actual.grupo0) {
        if (actual.movido && actual.cajas) {
          const cajas = Object.fromEntries(Object.entries(actual.cajas).map(([id, caja]) => [id, redondearCaja(caja)]))
          avisar({ bloque: actual.bloque, elemento: actual.elemento, accion: 'mover', elementos: Object.keys(cajas), cajas })
        } else {
          // Un clic sin mover sobre una del grupo deja elegida sólo esa.
          elegirVarias(actual.bloque, [actual.elemento])
        }
        return
      }
      if (!actual.movido || !actual.caja) {
        let elemento = actual.elemento
        if (actual.yaElegida) {
          // Otro clic en el mismo punto elige la pieza de abajo (y luego vuelve a la de arriba).
          const lienzo = lienzoDe(actual.bloque)
          const pila = [
            ...new Set(
              document
                .elementsFromPoint(actual.inicioX, actual.inicioY)
                .map((nodo) => nodo.closest<HTMLElement>('[data-lienzo-el]'))
                .filter((nodo): nodo is HTMLElement => Boolean(nodo && lienzo?.contains(nodo)))
                .map((nodo) => nodo.dataset.lienzoEl!),
            ),
          ]
          const indice = pila.indexOf(actual.elemento)
          elemento = pila[(indice + 1) % pila.length] ?? actual.elemento
        }
        setElegido({ bloque: actual.bloque, elemento })
        avisar({ bloque: actual.bloque, elemento, accion: 'elegir' })
        return
      }
      const { x, y, w, h } = actual.caja
      avisar({
        bloque: actual.bloque,
        elemento: actual.elemento,
        accion: 'mover',
        caja: { x: redondear(x), y: redondear(y), w: redondear(w), h: redondear(h) },
      })
    }

    function alTeclear(evento: KeyboardEvent) {
      if (!elegido) return
      const objetivo = evento.target as HTMLElement
      if (objetivo.closest('input, textarea, [contenteditable="true"]')) return
      if (evento.key === 'Escape') {
        elegirVarias(elegido.bloque, [])
        return
      }
      if (evento.key === 'Delete' || evento.key === 'Backspace') {
        evento.preventDefault()
        avisar({ ...elegido, accion: 'eliminar', ...(varios ? { elementos: seleccion } : {}) })
        setElegido(null)
        setGrupo([])
        return
      }
      const paso = evento.shiftKey ? 5 : 0.5
      const delta = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[evento.key]
      if (!delta) return
      evento.preventDefault()
      const lienzo = lienzoDe(elegido.bloque)
      if (!lienzo) return
      // Las flechas mueven todas las elegidas.
      const cajas: Record<string, CajaLienzo> = {}
      for (const id of seleccion) {
        const pieza = piezaDe(elegido.bloque, id)
        if (!pieza) continue
        const actual = cajaDe(pieza, lienzo)
        cajas[id] = redondearCaja({ ...actual, x: actual.x + delta[0]!, y: actual.y + delta[1]! })
        aplicar(pieza, cajas[id])
      }
      if (varios) avisar({ ...elegido, accion: 'mover', elementos: Object.keys(cajas), cajas })
      else if (cajas[elegido.elemento]) avisar({ ...elegido, accion: 'mover', caja: cajas[elegido.elemento] })
    }

    // Arranque de asas y del alto: los controles viven fuera del lienzo.
    function alPresionarControl(evento: Event) {
      const detalle = (evento as CustomEvent<{ evento: PointerEvent; modo: 'asa' | 'alto'; asa?: Asa; bloque: string; elemento: string | null }>).detail
      empezar(detalle.evento, detalle.modo, detalle.bloque, detalle.elemento, detalle.asa)
    }

    document.addEventListener('pointerdown', alPresionar, true)
    window.addEventListener('pointermove', alMover)
    window.addEventListener('pointerup', alSoltar)
    window.addEventListener('keydown', alTeclear)
    window.addEventListener('mt-lienzo-control', alPresionarControl)
    return () => {
      document.removeEventListener('pointerdown', alPresionar, true)
      window.removeEventListener('pointermove', alMover)
      window.removeEventListener('pointerup', alSoltar)
      window.removeEventListener('keydown', alTeclear)
      window.removeEventListener('mt-lienzo-control', alPresionarControl)
    }
    // seleccion y varios salen de elegido y grupo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegido, grupo])

  function control(evento: EventoPuntero, modo: 'asa' | 'alto', bloque: string, elemento: string | null, asa?: Asa) {
    evento.preventDefault()
    evento.stopPropagation()
    window.dispatchEvent(new CustomEvent('mt-lienzo-control', { detail: { evento: evento.nativeEvent, modo, asa, bloque, elemento } }))
  }

  function accion(nombre: AccionLienzo) {
    if (!elegido) return
    avisar({ ...elegido, accion: nombre, ...(varios ? { elementos: seleccion } : {}) })
    if (nombre === 'eliminar') {
      setElegido(null)
      setGrupo([])
    }
  }

  const barra = (posicion: CSSProperties) => (
    <div
      className="pointer-events-auto absolute left-0 flex items-center gap-0.5 rounded-lg bg-[#111] p-1 text-white shadow-[0_10px_30px_-6px_rgba(0,0,0,0.6)]"
      style={posicion}
    >
      {varios && <span className="px-2 text-[11px] whitespace-nowrap text-white/70">{seleccion.length} piezas</span>}
      {herramientas.map(({ nombre, etiqueta, Icono }) => (
        <button
          key={nombre}
          type="button"
          title={etiqueta}
          onClick={() => accion(nombre)}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-white/15 ${nombre === 'eliminar' ? 'hover:!bg-red-500/80' : ''}`}
        >
          <Icono className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
  const marcoGrupo =
    cajasGrupo.length > 1
      ? (() => {
          const izquierda = Math.min(...cajasGrupo.map((rect) => rect.left))
          const arriba = Math.min(...cajasGrupo.map((rect) => rect.top))
          return {
            left: izquierda,
            top: arriba,
            width: Math.max(...cajasGrupo.map((rect) => rect.right)) - izquierda,
            height: Math.max(...cajasGrupo.map((rect) => rect.bottom)) - arriba,
          }
        })()
      : null

  const herramientas: { nombre: AccionLienzo; etiqueta: string; Icono: typeof ArrowUp }[] = [
    { nombre: 'adelante', etiqueta: 'Traer adelante', Icono: ArrowUp },
    { nombre: 'atras', etiqueta: 'Enviar atrás', Icono: ArrowDown },
    { nombre: 'duplicar', etiqueta: 'Duplicar', Icono: Copy },
    { nombre: 'eliminar', etiqueta: 'Eliminar', Icono: Trash2 },
  ]

  return (
    <div data-controles-lienzo className="pointer-events-none fixed inset-0 z-[95] font-sans">
      {/* Mientras se edita, el navegador no arrastra fotos ni enlaces del lienzo por su cuenta. */}
      <style>{`[data-lienzo] *{-webkit-user-drag:none;user-select:none}[data-lienzo-el]{cursor:move}[data-lienzo] img{pointer-events:none}`}</style>
      {/* Guías del imán */}
      {marcoLienzo &&
        guias.x.map((guia) => (
          <span
            key={`x${guia}`}
            className="absolute w-px bg-[#ff3d7f]"
            style={{ left: marcoLienzo.caja.left + (guia / 100) * marcoLienzo.caja.width, top: marcoLienzo.caja.top, height: marcoLienzo.caja.height }}
          />
        ))}
      {marcoLienzo &&
        guias.y.map((guia) => (
          <span
            key={`y${guia}`}
            className="absolute h-px bg-[#ff3d7f]"
            style={{ top: marcoLienzo.caja.top + (guia / 100) * marcoLienzo.caja.height, left: marcoLienzo.caja.left, width: marcoLienzo.caja.width }}
          />
        ))}

      {/* Alto del lienzo: se arrastra la barrita de abajo */}
      {marcoLienzo && (
        <button
          type="button"
          title="Arrastra para cambiar el alto del lienzo"
          onPointerDown={(evento) => control(evento, 'alto', marcoLienzo.bloque, null)}
          className="pointer-events-auto absolute flex h-6 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize items-center gap-1 rounded-full bg-[#3b60ff] px-2.5 text-[10.5px] font-medium text-white shadow-lg"
          style={{ left: marcoLienzo.caja.left + marcoLienzo.caja.width / 2, top: marcoLienzo.caja.bottom }}
        >
          <MoveVertical aria-hidden="true" className="h-3 w-3" />
          Alto
        </button>
      )}

      {/* Varias elegidas: el marco de cada una, uno punteado que las abarca y la barra */}
      {varios &&
        cajasGrupo.map((rect, indice) => (
          <span
            key={indice}
            className="absolute outline-2 outline-[#3b60ff]"
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          />
        ))}
      {varios && marcoGrupo && (
        <div className="absolute outline-1 outline-offset-4 outline-[#3b60ff] outline-dashed" style={marcoGrupo}>
          {barra(marcoGrupo.top > 52 ? { bottom: 'calc(100% + 12px)' } : { top: 'calc(100% + 12px)' })}
        </div>
      )}

      {/* Pieza elegida: marco, asas y herramientas */}
      {elegido && caja && !varios && (
        <div
          className="absolute outline-2 outline-[#3b60ff]"
          style={{ left: caja.left, top: caja.top, width: caja.width, height: caja.height }}
        >
          {ASAS.map(({ asa, izquierda, arriba, cursor }) => (
            <span
              key={asa}
              onPointerDown={(evento) => control(evento, 'asa', elegido.bloque, elegido.elemento, asa)}
              className="pointer-events-auto absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#3b60ff] bg-white shadow"
              style={{ left: izquierda, top: arriba, cursor }}
            />
          ))}
          {barra(caja.top > 52 ? { bottom: 'calc(100% + 10px)' } : { top: 'calc(100% + 10px)' })}
        </div>
      )}
    </div>
  )
}
