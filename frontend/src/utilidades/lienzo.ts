import type { CajaLienzo, ElementoLienzo, PropsLienzo, TipoElementoLienzo } from '@/tipos/bloques'
import { TAMANO_INICIAL, tamanoMovil } from '@/componentes/tienda/bloques/Lienzo'

const nuevoId = () => Math.random().toString(36).slice(2, 9)

/** Una pieza nueva, centrada en el lienzo. */
export function nuevoElemento(tipo: TipoElementoLienzo): ElementoLienzo {
  const base = { id: nuevoId(), tipo }
  switch (tipo) {
    case 'titulo':
      return { ...base, x: 20, y: 38, w: 60, h: 18, texto: 'Escribe tu título', tamano: 52, peso: 'negrita', alineacion: 'centro' }
    case 'texto':
      return { ...base, x: 25, y: 42, w: 50, h: 16, texto: 'Un texto corto para contar algo de tu tienda.', tamano: 18, alineacion: 'centro' }
    case 'boton':
      return { ...base, x: 42, y: 45, w: 16, h: 10, texto: 'Ver más', enlace: '#productos', tamano: 17 }
    case 'imagen':
      return { ...base, x: 30, y: 15, w: 40, h: 70, ajuste: 'cubrir', radio: 0 }
    case 'forma':
      return { ...base, x: 35, y: 30, w: 30, h: 40, fondo: '#000000', opacidad: 20, radio: 0 }
    case 'producto':
      return { ...base, x: 40, y: 8, w: 20, h: 84, tarjeta: {}, movil: { x: 20, y: 4, w: 60, h: 92 } }
    case 'productos':
      return { ...base, x: 5, y: 6, w: 90, h: 76, limite: 4, columnas: 4, columnasMovil: 2, tarjeta: {}, movil: { x: 4, y: 3, w: 92, h: 94 } }
    case 'categorias':
      return { ...base, x: 10, y: 42, w: 80, h: 16, alineacion: 'centro', movil: { x: 4, y: 35, w: 92, h: 30 } }
    case 'redes':
      return { ...base, x: 38, y: 44, w: 24, h: 12, alineacion: 'centro', movil: { x: 15, y: 44, w: 70, h: 12 } }
    case 'whatsapp':
      return { ...base, x: 40, y: 44, w: 20, h: 11, texto: 'Escríbenos', movil: { x: 15, y: 45, w: 70, h: 8, tamano: 16 } }
    case 'logo':
      return { ...base, x: 42, y: 35, w: 16, h: 30, alineacion: 'centro', movil: { x: 25, y: 38, w: 50, h: 24 } }
    case 'buscador':
      return { ...base, x: 30, y: 44, w: 40, h: 11, movil: { x: 5, y: 45, w: 90, h: 10 } }
    case 'menu':
      return { ...base, x: 20, y: 44, w: 60, h: 10, alineacion: 'centro', movil: { x: 5, y: 40, w: 90, h: 20 } }
    case 'carrito':
      return { ...base, x: 47, y: 43, w: 6, h: 14, alineacion: 'centro', movil: { x: 42, y: 42, w: 16, h: 16 } }
    case 'icono':
      return { ...base, x: 46, y: 40, w: 8, h: 14, icono: 'estrella', movil: { x: 40, y: 40, w: 20, h: 11 } }
    case 'enlace':
      return { ...base, x: 40, y: 45, w: 20, h: 8, texto: 'Ver más', enlace: '#productos', alineacion: 'centro', movil: { x: 20, y: 45, w: 60, h: 8 } }
    case 'linea':
      return { ...base, x: 20, y: 50, w: 60, h: 0.6, opacidad: 25, movil: { x: 10, y: 50, w: 80, h: 0.5 } }
    case 'video':
      return { ...base, x: 20, y: 8, w: 60, h: 84, radio: 12, movil: { x: 4, y: 20, w: 92, h: 60 } }
    case 'mapa':
      return { ...base, x: 20, y: 8, w: 60, h: 84, radio: 12, movil: { x: 4, y: 10, w: 92, h: 80 } }
    case 'cuenta': {
      const fecha = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16)
      return { ...base, x: 32, y: 38, w: 36, h: 24, fecha, movil: { x: 5, y: 40, w: 90, h: 17, tamano: 18 } }
    }
  }
}

/** Fotos, formas y piezas vivas guardan su proporción al acomodarse para el celular; el texto se reparte. */
const PIEZAS_DE_TEXTO: readonly TipoElementoLienzo[] = ['titulo', 'texto', 'boton', 'enlace', 'whatsapp', 'buscador', 'menu', 'redes', 'categorias']

/** La caja que se ve según se esté acomodando el computador o el celular. */
export function cajaVisible(elemento: ElementoLienzo, movil: boolean): CajaLienzo {
  if (!movil) return { x: elemento.x, y: elemento.y, w: elemento.w, h: elemento.h }
  return {
    x: elemento.movil?.x ?? elemento.x,
    y: elemento.movil?.y ?? elemento.y,
    w: elemento.movil?.w ?? elemento.w,
    h: elemento.movil?.h ?? elemento.h,
  }
}

/** Guarda una caja en el computador o en el acomodo de celular. */
export function conCaja(elemento: ElementoLienzo, caja: Partial<CajaLienzo>, movil: boolean): ElementoLienzo {
  return movil ? { ...elemento, movil: { ...elemento.movil, ...caja } } : { ...elemento, ...caja }
}

/** Mueve una pieza una capa adelante (+1) o atrás (-1). */
export function cambiarCapa(elementos: ElementoLienzo[], id: string, paso: 1 | -1): ElementoLienzo[] {
  const indice = elementos.findIndex((elemento) => elemento.id === id)
  const destino = indice + paso
  if (indice < 0 || destino < 0 || destino >= elementos.length) return elementos
  const copia = [...elementos]
  const [pieza] = copia.splice(indice, 1)
  copia.splice(destino, 0, pieza!)
  return copia
}

export function duplicarElemento(elementos: ElementoLienzo[], id: string): { elementos: ElementoLienzo[]; nuevo?: string } {
  const indice = elementos.findIndex((elemento) => elemento.id === id)
  const original = elementos[indice]
  if (!original) return { elementos }
  const copia: ElementoLienzo = {
    ...structuredClone(original),
    id: nuevoId(),
    x: Math.min(original.x + 3, 97),
    y: Math.min(original.y + 3, 97),
  }
  const lista = [...elementos]
  lista.splice(indice + 1, 0, copia)
  return { elementos: lista, nuevo: copia.id }
}

/**
 * Acomodo automático para el celular: las piezas quedan una debajo de otra,
 * en el orden en que se leen en el computador. Las fotos guardan su
 * proporción; lo que cubre todo el lienzo (un oscurecido) sigue cubriéndolo, y
 * el texto que en el computador va encima de una foto sigue encima de ella.
 */
export function acomodarParaCelular(props: PropsLienzo): PropsLienzo {
  const ANCHO = 390
  const MARGEN = 20
  const esFondo = (elemento: ElementoLienzo) => elemento.w >= 95 && elemento.h >= 95
  const esVisual = (elemento: ElementoLienzo) => !PIEZAS_DE_TEXTO.includes(elemento.tipo) && !esFondo(elemento)
  const area = (a: CajaLienzo, b: CajaLienzo) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

  // A qué foto pertenece cada texto o botón que está encima de una.
  const encimaDe = new Map<string, ElementoLienzo>()
  for (const elemento of props.elementos) {
    if (esVisual(elemento) || esFondo(elemento)) continue
    let mejor: { foto: ElementoLienzo; cubre: number } | null = null
    for (const foto of props.elementos) {
      if (!esVisual(foto)) continue
      const cubre = area(elemento, foto) / Math.max(1, elemento.w * elemento.h)
      if (cubre > 0.3 && (!mejor || cubre > mejor.cubre)) mejor = { foto, cubre }
    }
    if (mejor) encimaDe.set(elemento.id, mejor.foto)
  }

  const altoTexto = (elemento: ElementoLienzo, ancho: number) => {
    const tamano = tamanoMovil(elemento)
    if (['boton', 'whatsapp', 'buscador', 'enlace', 'redes'].includes(elemento.tipo)) return Math.round(tamano * 3)
    const letras = (elemento.texto ?? '').length || 10
    const porLinea = Math.max(8, Math.floor(ancho / (tamano * 0.52)))
    return Math.round(Math.ceil(letras / porLinea) * tamano * (elemento.tipo === 'titulo' ? 1.15 : 1.6) + tamano * 0.6)
  }
  const anchoDe = (elemento: ElementoLienzo, contenedor: number) =>
    elemento.tipo === 'boton' ? Math.round(contenedor * 0.6) : Math.round(contenedor * 0.88)

  const orden = props.elementos.filter((elemento) => !esFondo(elemento) && !encimaDe.has(elemento.id)).sort((a, b) => a.y - b.y || a.x - b.x)
  let y = MARGEN
  const cajas = new Map<string, CajaLienzo>()
  for (const elemento of orden) {
    let ancho: number
    let alto: number
    if (elemento.tipo === 'productos') {
      // Filas de tarjetas según las columnas del celular: foto cuadrada y unos 130 px de texto y botón.
      const columnas = elemento.columnasMovil ?? 2
      const filas = Math.ceil((elemento.limite ?? 4) / columnas)
      ancho = ANCHO - MARGEN * 2
      const tarjeta = (ancho - 12 * (columnas - 1)) / columnas
      alto = Math.round(filas * (tarjeta + 130) + 12 * (filas - 1))
    } else if (elemento.tipo === 'producto') {
      ancho = 240
      alto = 240 + 150
    } else if (elemento.tipo === 'cuenta') {
      ancho = ANCHO - MARGEN * 2
      alto = 110
    } else if (esVisual(elemento)) {
      ancho = elemento.w >= 45 ? ANCHO : ANCHO - MARGEN * 2
      alto = Math.round(ancho * ((elemento.h * props.alto) / (elemento.w * 1200)))
    } else {
      ancho = anchoDe(elemento, ANCHO - MARGEN * 2)
      alto = altoTexto(elemento, ancho)
    }
    cajas.set(elemento.id, { x: (ANCHO - ancho) / 2, y, w: ancho, h: alto })
    y += alto + (ancho === ANCHO ? 0 : 16)
  }

  // Lo que va encima de una foto se reparte dentro de ella, guardando su orden vertical.
  const porFoto = new Map<string, ElementoLienzo[]>()
  for (const [id, foto] of encimaDe) porFoto.set(foto.id, [...(porFoto.get(foto.id) ?? []), props.elementos.find((e) => e.id === id)!])
  for (const [fotoId, piezas] of porFoto) {
    const marco = cajas.get(fotoId)
    if (!marco) continue
    piezas.sort((a, b) => a.y - b.y)
    const altos = piezas.map((pieza) => altoTexto(pieza, anchoDe(pieza, marco.w)))
    const total = altos.reduce((suma, alto) => suma + alto, 0) + (piezas.length - 1) * 14
    let cursor = marco.y + Math.max(12, (marco.h - total) / 2)
    piezas.forEach((pieza, indice) => {
      const ancho = anchoDe(pieza, marco.w)
      cajas.set(pieza.id, { x: marco.x + (marco.w - ancho) / 2, y: cursor, w: ancho, h: altos[indice]! })
      cursor += altos[indice]! + 14
    })
  }

  const altoMovil = Math.max(240, Math.round(y + MARGEN))
  const porcentaje = (valor: number, total: number) => Math.round((valor / total) * 1000) / 10

  return {
    ...props,
    altoMovil,
    elementos: props.elementos.map((elemento) => {
      if (esFondo(elemento)) return { ...elemento, movil: { ...elemento.movil, x: 0, y: 0, w: 100, h: 100, oculto: false } }
      const caja = cajas.get(elemento.id)!
      return {
        ...elemento,
        movil: {
          ...elemento.movil,
          oculto: false,
          x: porcentaje(caja.x, ANCHO),
          y: porcentaje(caja.y, altoMovil),
          w: porcentaje(caja.w, ANCHO),
          h: porcentaje(caja.h, altoMovil),
        },
      }
    }),
  }
}

/** Diseños de arranque: se ve de una qué se puede armar y se cambia lo que se quiera. */
export const DISENOS_LIENZO: { clave: string; nombre: string; armar: () => Pick<PropsLienzo, 'alto' | 'altoMovil' | 'elementos'> }[] = [
  {
    clave: 'dos-fotos',
    nombre: 'Dos fotos con título encima',
    armar: () => ({
      alto: 560,
      altoMovil: 620,
      elementos: [
        { id: nuevoId(), tipo: 'imagen', x: 0, y: 0, w: 50, h: 100, ajuste: 'cubrir', movil: { x: 0, y: 0, w: 100, h: 50 } },
        { id: nuevoId(), tipo: 'imagen', x: 50, y: 0, w: 50, h: 100, ajuste: 'cubrir', movil: { x: 0, y: 50, w: 100, h: 50 } },
        { id: nuevoId(), tipo: 'forma', x: 0, y: 0, w: 100, h: 100, fondo: '#000000', opacidad: 25 },
        {
          id: nuevoId(),
          tipo: 'titulo',
          x: 15,
          y: 34,
          w: 70,
          h: 22,
          texto: 'Tus favoritos los encuentras aquí',
          color: '#ffffff',
          tamano: 64,
          peso: 'negrita',
          alineacion: 'centro',
          movil: { x: 6, y: 34, w: 88, h: 20, tamano: 34 },
        },
        {
          id: nuevoId(),
          tipo: 'boton',
          x: 42,
          y: 62,
          w: 16,
          h: 10,
          texto: 'Ver productos',
          enlace: '#productos',
          color: '#ffffff',
          contorno: true,
          tamano: 18,
          radio: 14,
          movil: { x: 25, y: 58, w: 50, h: 8, tamano: 16 },
        },
      ],
    }),
  },
  {
    clave: 'foto-texto',
    nombre: 'Foto grande y texto al lado',
    armar: () => ({
      alto: 520,
      altoMovil: 760,
      elementos: [
        { id: nuevoId(), tipo: 'imagen', x: 0, y: 0, w: 55, h: 100, ajuste: 'cubrir', movil: { x: 0, y: 0, w: 100, h: 52 } },
        {
          id: nuevoId(),
          tipo: 'titulo',
          x: 61,
          y: 24,
          w: 34,
          h: 22,
          texto: 'Hecho a mano, pensado para ti',
          tamano: 46,
          peso: 'negrita',
          movil: { x: 6, y: 56, w: 88, h: 14, tamano: 30 },
        },
        {
          id: nuevoId(),
          tipo: 'texto',
          x: 61,
          y: 48,
          w: 32,
          h: 20,
          texto: 'Cuenta en dos líneas qué hace especial a tu tienda y por qué vale la pena comprarte.',
          tamano: 18,
          movil: { x: 6, y: 71, w: 88, h: 14, tamano: 15 },
        },
        { id: nuevoId(), tipo: 'boton', x: 61, y: 72, w: 15, h: 10, texto: 'Conocer más', enlace: '#productos', tamano: 17, movil: { x: 6, y: 88, w: 50, h: 7, tamano: 15 } },
      ],
    }),
  },
  {
    clave: 'collage',
    nombre: 'Collage de tres fotos',
    armar: () => ({
      alto: 620,
      altoMovil: 700,
      elementos: [
        { id: nuevoId(), tipo: 'imagen', x: 3, y: 6, w: 44, h: 88, ajuste: 'cubrir', radio: 18, movil: { x: 4, y: 3, w: 92, h: 46 } },
        { id: nuevoId(), tipo: 'imagen', x: 50, y: 6, w: 47, h: 42, ajuste: 'cubrir', radio: 18, movil: { x: 4, y: 51, w: 45, h: 30 } },
        { id: nuevoId(), tipo: 'imagen', x: 50, y: 52, w: 22, h: 42, ajuste: 'cubrir', radio: 18, movil: { x: 51, y: 51, w: 45, h: 30 } },
        { id: nuevoId(), tipo: 'forma', x: 75, y: 52, w: 22, h: 42, fondo: '#111111', radio: 18, movil: { x: 4, y: 83, w: 92, h: 14 } },
        {
          id: nuevoId(),
          tipo: 'titulo',
          x: 76.5,
          y: 60,
          w: 19,
          h: 16,
          texto: 'Nueva colección',
          color: '#ffffff',
          tamano: 30,
          peso: 'negrita',
          movil: { x: 8, y: 85, w: 60, h: 10, tamano: 22 },
        },
        { id: nuevoId(), tipo: 'boton', x: 76.5, y: 80, w: 14, h: 8, texto: 'Ver', enlace: '#productos', tamano: 15, color: '#111111', fondo: '#ffffff', movil: { x: 68, y: 86, w: 24, h: 7, tamano: 14 } },
      ],
    }),
  },
  {
    clave: 'titular',
    nombre: 'Titular grande sobre color',
    armar: () => ({
      alto: 420,
      altoMovil: 460,
      elementos: [
        {
          id: nuevoId(),
          tipo: 'titulo',
          x: 8,
          y: 22,
          w: 84,
          h: 34,
          texto: '¡Nuevo sabor ya disponible!',
          tamano: 84,
          peso: 'negrita',
          alineacion: 'centro',
          movil: { x: 6, y: 18, w: 88, h: 40, tamano: 40 },
        },
        { id: nuevoId(), tipo: 'boton', x: 41, y: 64, w: 18, h: 12, texto: 'Pedir ahora', enlace: '#productos', tamano: 19, radio: 999, movil: { x: 22, y: 66, w: 56, h: 12, tamano: 17 } },
      ],
    }),
  },
]

export { TAMANO_INICIAL }

/**
 * Agrega una pieza debajo de lo que ya hay, en vez de encima. Si no cabe, el
 * lienzo crece lo justo y lo demás se queda donde estaba: las posiciones van
 * en % del alto, así que se reescalan al nuevo alto. Igual en el celular.
 */
export function agregarAlLienzo(props: PropsLienzo, pieza: ElementoLienzo): PropsLienzo {
  const AIRE = 3
  const esFondo = (elemento: ElementoLienzo) => elemento.w >= 95 && elemento.h >= 95
  const colocar = (movil: boolean, altoActual: number) => {
    const cajas = props.elementos.filter((elemento) => !esFondo(elemento) && !(movil && elemento.movil?.oculto)).map((elemento) => cajaVisible(elemento, movil))
    const nueva = cajaVisible(pieza, movil)
    if (cajas.length === 0) return { alto: altoActual, y: nueva.y, escala: 1 }
    // Piso de lo que hay, en px, y dónde iría la pieza nueva.
    const piso = Math.max(...cajas.map((caja) => ((caja.y + caja.h) / 100) * altoActual))
    // El tamaño de una pieza nueva no depende de cuánto haya crecido el lienzo:
    // sus % de arranque están pensados para un lienzo de 520 (o 640 en el celular).
    const altoPieza = (nueva.h / 100) * (movil ? 640 : 520)
    const arriba = piso + (AIRE / 100) * altoActual
    const alto = Math.max(altoActual, Math.round(arriba + altoPieza + (AIRE / 100) * altoActual))
    return { alto, y: (arriba / alto) * 100, escala: altoActual / alto, h: (altoPieza / alto) * 100 }
  }
  const pc = colocar(false, props.alto)
  const cel = colocar(true, props.altoMovil)
  const reescalar = (elemento: ElementoLienzo): ElementoLienzo => {
    const cambio: Partial<ElementoLienzo> = {}
    // Lo que cubre todo el lienzo (una foto de fondo) lo sigue cubriendo.
    if (pc.escala !== 1 && !esFondo(elemento)) Object.assign(cambio, { y: elemento.y * pc.escala, h: elemento.h * pc.escala })
    const caja = cajaVisible(elemento, true)
    if (cel.escala !== 1 && !(caja.w >= 95 && caja.h >= 95)) cambio.movil = { ...elemento.movil, y: caja.y * cel.escala, h: caja.h * cel.escala }
    return { ...elemento, ...cambio }
  }
  const nuevaMovil = cajaVisible(pieza, true)
  return {
    ...props,
    alto: pc.alto,
    altoMovil: cel.alto,
    elementos: [
      ...props.elementos.map(reescalar),
      {
        ...pieza,
        y: pc.y,
        ...(pc.h !== undefined ? { h: pc.h } : {}),
        movil: { ...pieza.movil, x: nuevaMovil.x, w: nuevaMovil.w, y: cel.y, h: cel.h ?? nuevaMovil.h },
      },
    ],
  }
}
