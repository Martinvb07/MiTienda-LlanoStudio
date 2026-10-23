import type {
  Bloque,
  BloqueLienzo,
  ElementoLienzo,
  EstiloSeccion,
  PropsBannerDoble,
  PropsCarrusel,
  PropsHero,
  PropsImagenTexto,
  PropsLlamado,
  PropsTexto,
  TipoBloque,
} from '@/tipos/bloques'
import type { TemaTienda } from '@/tipos/tienda'
import { esquemasIniciales } from './tema'

/**
 * "Editar libre": pasa una sección armada a un Lienzo libre con las mismas
 * piezas, ubicadas como se ven.
 *
 * Cada conversor dice qué piezas tiene su sección y dónde van. Con las medidas
 * de la sección pintada (utilidades/medirSecciones, a 1440 y a 390 px) cada
 * pieza toma su caja real; sin ellas, la calcula con las medidas de su
 * componente (componentes/tienda/bloques). El lienzo escala con el ancho, así
 * que a 1440 y a 390 queda igual y en otros anchos, proporcional.
 */

const ANCHO = 1440
const ANCHO_MOVIL = 390
/** El lienzo mide la letra sobre 1200 de ancho. */
const A_LIENZO = 1200 / ANCHO

/** Las que muestran datos vivos: pasarlas a piezas fijas las dejaría desactualizadas. */
const DATOS_VIVOS: readonly TipoBloque[] = [
  'grilla-productos',
  'categorias',
  'pie',
  'preguntas',
  'testimonios',
  'mapa',
  'video',
  'cuenta-regresiva',
]

/** Por qué una sección no se puede pasar a libre, o null si se puede. */
export function motivoNoLibre(tipo: TipoBloque): string | null {
  return tipo === 'lienzo' ? 'Ya es un lienzo libre.' : null
}

/** Las que muestran datos vivos: al pasar a libre, esa parte queda como pieza viva. */
export const tieneDatosVivos = (tipo: TipoBloque) => DATOS_VIVOS.includes(tipo)

export const esConvertible = (tipo: TipoBloque) => motivoNoLibre(tipo) === null

// ─────────────────────────────────────────────────────────────────────────────
// Colores y medidas
// ─────────────────────────────────────────────────────────────────────────────

interface Paleta {
  fondo?: string
  texto: string
  marca: string
  contraste: string
}

/** Los colores con que se pinta la sección: tema, esquema y estilo propio. */
function paletaDe(tema: TemaTienda, estilo?: EstiloSeccion): Paleta {
  const esquema = estilo?.esquema ? (tema.esquemas ?? esquemasIniciales(tema)).find((opcion) => opcion.id === estilo.esquema) : undefined
  return {
    fondo: estilo?.fondo ?? esquema?.fondo,
    texto: estilo?.imagenFondo ? '#ffffff' : (estilo?.texto ?? esquema?.texto ?? tema.colorTexto ?? '#0f172a'),
    marca: esquema?.marca ?? tema.colorMarca ?? '#0f172a',
    contraste: esquema?.contraste ?? tema.colorContraste ?? '#ffffff',
  }
}

const aRgb = (hex: string) => {
  const limpio = hex.replace('#', '')
  const largo = limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio.slice(0, 6)
  const valor = Number.parseInt(largo, 16)
  return Number.isNaN(valor) ? [0, 0, 0] : [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255]
}

/** `color` con opacidad sobre `fondo`, como un hex: así lo entiende el selector de color. */
export function mezclar(color: string, fondo: string, opacidad: number): string {
  const [r1, g1, b1] = aRgb(color)
  const [r2, g2, b2] = aRgb(fondo)
  const canal = (a: number, b: number) => Math.round(a * opacidad + b * (1 - opacidad)).toString(16).padStart(2, '0')
  return `#${canal(r1!, r2!)}${canal(g1!, g2!)}${canal(b1!, b2!)}`
}

/** El radio del tema ("0.75rem", "8px") en px. */
function radioPx(tema: TemaTienda): number {
  const valor = Number.parseFloat(tema.radio ?? '0.75rem')
  if (Number.isNaN(valor)) return 12
  return tema.radio?.endsWith('px') ? valor : valor * 16
}

/**
 * Alto de un texto que se parte en líneas. Se calcula de más a propósito: el
 * lienzo centra el texto en su caja y lo corta si no cabe.
 */
function altoTexto(texto: string, tamano: number, ancho: number, interlineado: number, anchoLetra = 0.5): number {
  const porLinea = Math.max(1, Math.floor(ancho / (tamano * anchoLetra)))
  const lineas = texto.split('\n').reduce((total, parrafo) => total + Math.max(1, Math.ceil(parrafo.length / porLinea)), 0)
  return Math.ceil(lineas * tamano * interlineado)
}

const altoTitulo = (texto: string, tamano: number, ancho: number) => altoTexto(texto, tamano, ancho, 1.1, 0.5)
/** Ancho aproximado de un texto de una línea, para centrar su caja. */
const anchoLinea = (texto: string, tamano: number) => Math.ceil(texto.length * tamano * 0.5) + tamano
const altoCuerpo = (texto: string, tamano: number, ancho: number) => altoTexto(texto, tamano, ancho, 1.625)
const anchoBoton = (texto: string, tamano: number, relleno: number) => Math.ceil(texto.length * tamano * 0.56 + relleno * 2)

// ─────────────────────────────────────────────────────────────────────────────
// Armado: cada pieza con su caja en px en el computador y en el celular
// ─────────────────────────────────────────────────────────────────────────────

interface Caja {
  x: number
  y: number
  w: number
  h: number
}

type Base = Omit<ElementoLienzo, 'id' | 'x' | 'y' | 'w' | 'h' | 'movil' | 'tamano'>

interface Pieza {
  base: Base
  pc: Caja
  movil: Caja
  /** Letra en px reales a 1440 y a 390. */
  letra?: number
  letraMovil?: number
  /** Qué es en la sección original ('titulo', 'boton', 'item0'…), para tomar su medida real. */
  rol?: string
  /** Cubre toda la sección (foto u oscurecido de fondo). */
  cubre?: boolean
  /** No se ve en el celular (la sección original la escondía ahí). */
  ocultoMovil?: boolean
}

type Alineacion = NonNullable<ElementoLienzo['alineacion']>

/** Dónde quedó cada pieza en la sección real, relativa a ella, en px. */
export interface MedidaRol extends Caja {
  letra?: number
  /** Esquinas en px, tal como se pintan. */
  radio?: number
  alineacion?: Alineacion
  /** La caja del texto mismo (sin el ancho sobrante del bloque). */
  texto?: Caja
}

/**
 * Una pieza encontrada al recorrer la sección pintada (para las secciones sin
 * conversor propio). `clave` es su camino en el HTML: con ella se empareja la
 * misma pieza en el computador y en el celular.
 */
export interface NodoMedido extends Caja {
  clave: string
  tipo: 'titulo' | 'texto' | 'boton' | 'enlace' | 'imagen' | 'forma' | 'icono' | 'video' | 'mapa' | 'vivo'
  texto?: string
  letra?: number
  color?: string
  fondo?: string
  opacidad?: number
  radio?: number
  negrita?: boolean
  alineacion?: Alineacion
  enlace?: string
  imagenUrl?: string
  ajuste?: 'cubrir' | 'contener'
  contorno?: boolean
  icono?: string
  url?: string
  direccion?: string
  /** Lo que sigue vivo: la grilla de productos, el reloj o las redes. */
  vivo?: 'productos' | 'cuenta' | 'redes'
  relleno?: boolean
  sinSubrayado?: boolean
}

/** Medidas de la sección pintada a 1440 y a 390 (utilidades/medirSecciones). */
export interface MedidasSeccion {
  pc: { alto: number; roles: Record<string, MedidaRol>; nodos?: NodoMedido[] }
  movil: { alto: number; roles: Record<string, MedidaRol>; nodos?: NodoMedido[] }
}

const nuevoId = () => Math.random().toString(36).slice(2, 9)
const redondear = (valor: number) => Math.round(valor * 100) / 100

/**
 * El lienzo centra el texto en su caja y corta lo que no cabe. A los títulos y
 * textos se les da media línea de aire arriba y abajo: el centro queda donde
 * estaba y, si la estimación se queda corta en una línea, no se corta nada.
 */
function conHolgura(pieza: Pieza): Pieza {
  if (pieza.base.tipo !== 'titulo' && pieza.base.tipo !== 'texto') return pieza
  const extra = (letra = 16) => Math.round(letra * 0.6)
  // Y apenas unos px a lo ancho, hacia donde crece el texto: así un redondeo no lo parte en otra línea.
  const lado = (letra = 16) => Math.max(1.5, Math.round(letra * 0.08 * 10) / 10)
  const correr = { izquierda: 0, centro: 0.5, derecha: 1 }[pieza.base.alineacion ?? 'izquierda']
  const ampliar = (caja: Caja, letra?: number) => ({
    x: caja.x - lado(letra) * 2 * correr,
    y: caja.y - extra(letra),
    w: caja.w + lado(letra) * 2,
    h: caja.h + extra(letra) * 2,
  })
  return { ...pieza, pc: ampliar(pieza.pc, pieza.letra), movil: ampliar(pieza.movil, pieza.letraMovil) }
}

/**
 * Con medidas reales, cada pieza toma la caja, la letra y la alineación de su
 * rol en la sección pintada; sin ellas se queda con lo calculado.
 */
function conMedidas(pieza: Pieza, medidas: MedidasSeccion, alto: number, altoMovil: number): Pieza {
  if (pieza.cubre) return { ...pieza, pc: { x: 0, y: 0, w: ANCHO, h: alto }, movil: { x: 0, y: 0, w: ANCHO_MOVIL, h: altoMovil } }
  if (!pieza.rol) return pieza
  const pc = medidas.pc.roles[pieza.rol]
  const movil = medidas.movil.roles[pieza.rol]
  const caja = (medida: MedidaRol): Caja => ({ x: medida.x, y: medida.y, w: medida.w, h: medida.h })
  const esTexto = pieza.base.tipo === 'titulo' || pieza.base.tipo === 'texto'
  const alineacion = esTexto ? (pc?.alineacion ?? pieza.base.alineacion) : undefined
  // Un texto tiene una sola alineación: si en el celular va distinta, la caja se ajusta al texto mismo.
  const cajaMovil = movil && (esTexto && movil.alineacion !== alineacion && movil.texto ? movil.texto : caja(movil))
  const esCaja = pieza.base.tipo === 'imagen' || pieza.base.tipo === 'forma'
  const radio = esCaja && pc?.radio !== undefined && !pieza.cubre ? { radio: pc.radio } : {}
  return {
    ...pieza,
    base: { ...pieza.base, ...(alineacion ? { alineacion } : {}), ...radio },
    pc: pc ? caja(pc) : pieza.pc,
    movil: cajaMovil ?? pieza.movil,
    letra: pc?.letra ?? pieza.letra,
    letraMovil: movil?.letra ?? pieza.letraMovil,
  }
}

function armar(lista: Pieza[], altoCalculado: number, altoMovilCalculado: number, fondo?: string, medidas?: MedidasSeccion): BloqueLienzo['props'] {
  const alto = medidas?.pc.alto || altoCalculado
  const altoMovil = medidas?.movil.alto || altoMovilCalculado
  const piezas = (medidas ? lista.map((pieza) => conMedidas(pieza, medidas, alto, altoMovil)) : lista).map(conHolgura)
  return {
    alto: Math.round(alto * A_LIENZO),
    altoMovil: Math.round(altoMovil),
    ...(fondo ? { fondo } : {}),
    elementos: piezas.map(({ base, pc, movil, letra, letraMovil, ocultoMovil }) => ({
      ...base,
      id: nuevoId(),
      x: redondear((pc.x / ANCHO) * 100),
      y: redondear((pc.y / alto) * 100),
      w: redondear((pc.w / ANCHO) * 100),
      h: redondear((pc.h / alto) * 100),
      ...(letra ? { tamano: Math.round(letra * A_LIENZO * 10) / 10 } : {}),
      movil: {
        x: redondear((movil.x / ANCHO_MOVIL) * 100),
        y: redondear((movil.y / altoMovil) * 100),
        w: redondear((movil.w / ANCHO_MOVIL) * 100),
        h: redondear((movil.h / altoMovil) * 100),
        ...(letraMovil ? { tamano: Math.round(letraMovil * 10) / 10 } : {}),
        ...(ocultoMovil ? { oculto: true } : {}),
      },
    })),
  }
}

const TODO: Caja = { x: 0, y: 0, w: ANCHO, h: 0 }

/** Imagen de fondo y su oscurecido, del estilo de la sección: van debajo de todo. */
function fondoDeEstilo(estilo: EstiloSeccion | undefined, alto: number, altoMovil: number): Pieza[] {
  if (!estilo?.imagenFondo) return []
  const pc = { ...TODO, h: alto }
  const movil = { x: 0, y: 0, w: ANCHO_MOVIL, h: altoMovil }
  return [
    { base: { tipo: 'imagen', imagenUrl: estilo.imagenFondo, ajuste: 'cubrir' }, pc, movil, cubre: true },
    { base: { tipo: 'forma', fondo: '#000000', opacidad: estilo.oscurecer ?? 40 }, pc, movil, cubre: true },
  ]
}

/** Lo que el tema hace con títulos y botones y el lienzo no sabe por su cuenta. */
const comoTitulo = (texto: string, tema: TemaTienda) => (tema.titulosMayusculas ? texto.toUpperCase() : texto)
const comoBoton = (texto: string, tema: TemaTienda) => (tema.botonMayusculas ? texto.toUpperCase() : texto)

/** Botón de marca como los de la tienda, relleno o de contorno según el tema. */
function botonMarca(texto: string, enlace: string, tema: TemaTienda, paleta: Paleta): Base {
  return tema.botonEstilo === 'contorno'
    ? { tipo: 'boton', texto: comoBoton(texto, tema), enlace, contorno: true, color: paleta.marca }
    : { tipo: 'boton', texto: comoBoton(texto, tema), enlace, fondo: paleta.marca, color: paleta.contraste }
}

/** Relleno vertical de la sección según su espaciado. */
function relleno(estilo: EstiloSeccion | undefined, normal: number): number {
  switch (estilo?.espaciado) {
    case 'ninguno':
      return 0
    case 'compacto':
      return 32
    case 'amplio':
      return 112
    default:
      return normal
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversores
// ─────────────────────────────────────────────────────────────────────────────

type Conversor<P> = (props: P, tema: TemaTienda, estilo?: EstiloSeccion, medidas?: MedidasSeccion) => BloqueLienzo['props']

/** Portada: titular, bajada y botón, sobre una foto oscurecida o sobre el fondo. */
const desdeHero: Conversor<PropsHero> = (props, tema, estilo, medidas) => {
  const paleta = paletaDe(tema, estilo)
  const conFoto = Boolean(props.imagenUrl)
  const centrado = (props.alineacion ?? 'centro') === 'centro'
  const colorTitulo = conFoto ? '#ffffff' : paleta.texto
  const colorBajada = conFoto ? '#e6e6e6' : mezclar(paleta.texto, paleta.fondo ?? tema.colorFondo ?? '#ffffff', 0.7)

  // Computador: py-32, título 60 px (máx. 768), bajada 18 px (máx. 672), botón 48 de alto.
  const pad = relleno(estilo, 128)
  const contenedor = centrado ? 768 : 1152
  const x0 = (ANCHO - contenedor) / 2
  const anchoTitulo = 768
  const titulo = comoTitulo(props.titulo, tema)
  const hT = altoTitulo(titulo, 60, anchoTitulo)
  const hB = props.subtitulo ? altoCuerpo(props.subtitulo, 18, 672) : 0
  const wBoton = props.textoBoton ? anchoBoton(props.textoBoton, 16, 24) : 0
  let y = pad
  const cajaTitulo = { x: x0, y, w: anchoTitulo, h: hT }
  y += hT
  const cajaBajada = { x: centrado ? (ANCHO - 672) / 2 : x0, y: y + 24, w: 672, h: hB }
  if (props.subtitulo) y += 24 + hB
  const cajaBoton = { x: centrado ? (ANCHO - wBoton) / 2 : x0, y: y + 40, w: wBoton, h: 48 }
  if (props.textoBoton) y += 40 + 48
  const alto = y + pad

  // Celular: py-24 y px-6, título 36 px, todo a 342 de ancho.
  const padM = relleno(estilo, 96)
  const anchoM = ANCHO_MOVIL - 48
  const hTM = altoTitulo(titulo, 36, anchoM)
  const hBM = props.subtitulo ? altoCuerpo(props.subtitulo, 18, anchoM) : 0
  let yM = padM
  const movilTitulo = { x: 24, y: yM, w: anchoM, h: hTM }
  yM += hTM
  const movilBajada = { x: 24, y: yM + 24, w: anchoM, h: hBM }
  if (props.subtitulo) yM += 24 + hBM
  const movilBoton = { x: centrado ? (ANCHO_MOVIL - wBoton) / 2 : 24, y: yM + 40, w: wBoton, h: 48 }
  if (props.textoBoton) yM += 40 + 48
  const altoMovil = yM + padM

  const alinear = centrado ? 'centro' : 'izquierda'
  const piezas: Pieza[] = [
    ...fondoDeEstilo(estilo, alto, altoMovil),
    ...(conFoto
      ? ([
          { base: { tipo: 'imagen', imagenUrl: props.imagenUrl, ajuste: 'cubrir' }, pc: { ...TODO, h: alto }, movil: { x: 0, y: 0, w: ANCHO_MOVIL, h: altoMovil }, cubre: true },
          { base: { tipo: 'forma', fondo: '#000000', opacidad: 40 }, pc: { ...TODO, h: alto }, movil: { x: 0, y: 0, w: ANCHO_MOVIL, h: altoMovil }, cubre: true },
        ] satisfies Pieza[])
      : []),
    { base: { tipo: 'titulo', texto: titulo, color: colorTitulo, alineacion: alinear }, pc: cajaTitulo, movil: movilTitulo, letra: 60, letraMovil: 36, rol: 'titulo' },
  ]
  if (props.subtitulo)
    piezas.push({ base: { tipo: 'texto', texto: props.subtitulo, color: colorBajada, alineacion: alinear }, pc: cajaBajada, movil: movilBajada, letra: 18, letraMovil: 18, rol: 'bajada' })
  if (props.textoBoton)
    piezas.push({ base: botonMarca(props.textoBoton, props.enlaceBoton ?? '#productos', tema, paleta), pc: cajaBoton, movil: movilBoton, letra: 16, letraMovil: 16, rol: 'boton' })
  return armar(piezas, alto, altoMovil, paleta.fondo, medidas)
}

const ALTOS_CARRUSEL = { bajo: [340, 260], medio: [440, 340], alto: [560, 420] } as const

/** Carrusel: la primera diapositiva, con su foto, titular y botón. */
const desdeCarrusel: Conversor<PropsCarrusel> = (props, tema, estilo, medidas) => {
  const paleta = paletaDe(tema, estilo)
  const diapositiva = props.diapositivas[0]
  const [alto, altoMovil] = ALTOS_CARRUSEL[props.alto ?? 'medio']
  const piezas: Pieza[] = []
  const todo = { pc: { ...TODO, h: alto }, movil: { x: 0, y: 0, w: ANCHO_MOVIL, h: altoMovil } }
  if (!diapositiva) return armar(piezas, alto, altoMovil, paleta.fondo, medidas)

  const conFoto = Boolean(diapositiva.imagenUrl)
  if (conFoto) {
    piezas.push({ base: { tipo: 'imagen', imagenUrl: diapositiva.imagenUrl, ajuste: 'cubrir' }, ...todo, cubre: true })
    // El lienzo no tiene degradados: un oscurecido parejo para que el texto se lea.
    if (diapositiva.titulo || diapositiva.subtitulo) piezas.push({ base: { tipo: 'forma', fondo: '#000000', opacidad: 28 }, ...todo, cubre: true })
  } else {
    piezas.push({ base: { tipo: 'forma', fondo: paleta.marca }, ...todo, cubre: true })
  }

  const colorTexto = conFoto ? '#ffffff' : paleta.contraste
  const colorBajada = conFoto ? '#e0e0e0' : mezclar(paleta.contraste, paleta.marca, 0.85)
  const titulo = diapositiva.titulo ? comoTitulo(diapositiva.titulo, tema) : ''

  // Computador: contenido en max-w-6xl con px-6, centrado en alto. Título 48 px (máx. 576).
  const x0 = (ANCHO - 1152) / 2 + 24
  const hT = titulo ? altoTitulo(titulo, 48, 576) : 0
  const hB = diapositiva.subtitulo ? altoCuerpo(diapositiva.subtitulo, 18, 512) : 0
  const conBoton = Boolean(diapositiva.textoBoton)
  const total = hT + (hB ? (hT ? 16 : 0) + hB : 0) + (conBoton ? 28 + 48 : 0)
  let y = (alto - total) / 2
  // Celular: título 36 px, a 342 de ancho.
  const anchoM = ANCHO_MOVIL - 48
  const hTM = titulo ? altoTitulo(titulo, 36, anchoM) : 0
  const hBM = diapositiva.subtitulo ? altoCuerpo(diapositiva.subtitulo, 18, anchoM) : 0
  const totalM = hTM + (hBM ? (hTM ? 16 : 0) + hBM : 0) + (conBoton ? 28 + 48 : 0)
  let yM = Math.max(16, (altoMovil - totalM) / 2)

  if (titulo) {
    piezas.push({ base: { tipo: 'titulo', texto: titulo, color: colorTexto }, pc: { x: x0, y, w: 576, h: hT }, movil: { x: 24, y: yM, w: anchoM, h: hTM }, letra: 48, letraMovil: 36, rol: 'titulo' })
    y += hT + 16
    yM += hTM + 16
  }
  if (diapositiva.subtitulo) {
    piezas.push({ base: { tipo: 'texto', texto: diapositiva.subtitulo, color: colorBajada }, pc: { x: x0, y, w: 512, h: hB }, movil: { x: 24, y: yM, w: anchoM, h: hBM }, letra: 18, letraMovil: 18, rol: 'bajada' })
    y += hB
    yM += hBM
  }
  if (diapositiva.textoBoton) {
    const ancho = anchoBoton(diapositiva.textoBoton, 16, 24)
    piezas.push({
      base: { tipo: 'boton', texto: comoBoton(diapositiva.textoBoton, tema), enlace: diapositiva.enlaceBoton || '#productos', fondo: '#ffffff', color: '#000000' },
      pc: { x: x0, y: y + 28, w: ancho, h: 48 },
      movil: { x: 24, y: yM + 28, w: ancho, h: 48 },
      letra: 16,
      letraMovil: 16,
      rol: 'boton',
    })
  }
  return armar(piezas, alto, altoMovil, paleta.fondo, medidas)
}

/** Imagen con texto: foto 4:3 a un lado y titular, texto y botón al otro. */
const desdeImagenTexto: Conversor<PropsImagenTexto> = (props, tema, estilo, medidas) => {
  const paleta = paletaDe(tema, estilo)
  const radio = radioPx(tema)
  const colorCuerpo = mezclar(paleta.texto, paleta.fondo ?? tema.colorFondo ?? '#ffffff', 0.75)
  const titulo = comoTitulo(props.titulo, tema)

  // Computador: max-w-6xl con px-6 (1104 útiles), dos columnas de 520 con 64 entre ellas.
  const pad = relleno(estilo, 64)
  const columna = 520
  const izquierda = (ANCHO - 1104) / 2
  const xFoto = props.lado === 'derecha' ? izquierda + columna + 64 : izquierda
  const xTexto = props.lado === 'derecha' ? izquierda : izquierda + columna + 64
  const altoFoto = columna * 0.75
  const hT = altoTitulo(titulo, 30, columna)
  const hC = props.contenido ? altoCuerpo(props.contenido, 18, columna) : 0
  const hTexto = hT + (props.contenido ? 16 + hC : 0) + (props.textoBoton ? 32 + 48 : 0)
  const altoFila = Math.max(altoFoto, hTexto)
  const alto = pad * 2 + altoFila
  let y = pad + (altoFila - hTexto) / 2

  // Celular: una columna de 342: foto, 40 de aire y el texto.
  const padM = relleno(estilo, 64)
  const anchoM = ANCHO_MOVIL - 48
  const altoFotoM = anchoM * 0.75
  const hTM = altoTitulo(titulo, 30, anchoM)
  const hCM = props.contenido ? altoCuerpo(props.contenido, 18, anchoM) : 0
  let yM = padM + altoFotoM + 40

  const piezas: Pieza[] = [
    {
      base: props.imagenUrl ? { tipo: 'imagen', imagenUrl: props.imagenUrl, ajuste: 'cubrir', radio } : { tipo: 'forma', fondo: mezclar(paleta.texto, paleta.fondo ?? tema.colorFondo ?? '#ffffff', 0.05), radio },
      pc: { x: xFoto, y: pad + (altoFila - altoFoto) / 2, w: columna, h: altoFoto },
      movil: { x: 24, y: padM, w: anchoM, h: altoFotoM },
      rol: 'foto',
    },
    { base: { tipo: 'titulo', texto: titulo, color: paleta.texto }, pc: { x: xTexto, y, w: columna, h: hT }, movil: { x: 24, y: yM, w: anchoM, h: hTM }, letra: 30, letraMovil: 30, rol: 'titulo' },
  ]
  y += hT
  yM += hTM
  if (props.contenido) {
    piezas.push({ base: { tipo: 'texto', texto: props.contenido, color: colorCuerpo }, pc: { x: xTexto, y: y + 16, w: columna, h: hC }, movil: { x: 24, y: yM + 16, w: anchoM, h: hCM }, letra: 18, letraMovil: 18, rol: 'bajada' })
    y += 16 + hC
    yM += 16 + hCM
  }
  if (props.textoBoton) {
    const ancho = anchoBoton(props.textoBoton, 16, 24)
    piezas.push({ base: botonMarca(props.textoBoton, props.enlaceBoton || '#productos', tema, paleta), pc: { x: xTexto, y: y + 32, w: ancho, h: 48 }, movil: { x: 24, y: yM + 32, w: ancho, h: 48 }, letra: 16, letraMovil: 16, rol: 'boton' })
    yM += 32 + 48
  }
  const altoMovil = yM + padM
  return armar([...fondoDeEstilo(estilo, alto, altoMovil), ...piezas], alto, altoMovil, paleta.fondo, medidas)
}

const ALTOS_BANNER = { bajo: 220, medio: 320, alto: 440 } as const

/** Banners lado a lado: cada uno con su foto, oscurecido abajo, título, bajada y llamado. */
const desdeBannerDoble: Conversor<PropsBannerDoble> = (props, tema, estilo, medidas) => {
  const paleta = paletaDe(tema, estilo)
  const radio = radioPx(tema)
  const items = props.items.slice(0, 3)
  const minimo = ALTOS_BANNER[props.alto ?? 'medio']

  // Computador: max-w-6xl con px-6, py-10 y 16 entre tarjetas; relleno interno de 28.
  const pad = relleno(estilo, 40)
  const columnas = Math.max(1, items.length >= 3 ? 3 : 2)
  const izquierda = (ANCHO - 1104) / 2
  const ancho = (1104 - 16 * (columnas - 1)) / columnas
  const anchoM = ANCHO_MOVIL - 48

  const contenido = (item: (typeof items)[number], anchoInterno: number, letra: number) => {
    const hT = item.titulo ? altoTitulo(item.titulo, letra, anchoInterno) : 0
    const hS = item.subtitulo ? altoCuerpo(item.subtitulo, 16, anchoInterno) : 0
    return { hT, hS, total: hT + (hS ? 6 + hS : 0) + (item.textoBoton ? 20 + 20 : 0) }
  }
  const altoTarjeta = Math.max(minimo, ...items.map((item) => contenido(item, ancho - 56, 30).total + 56))
  const alto = pad * 2 + altoTarjeta
  const altosM = items.map((item) => Math.max(minimo, contenido(item, anchoM - 56, 24).total + 56))
  const altoMovil = pad * 2 + altosM.reduce((suma, valor) => suma + valor, 0) + 16 * Math.max(0, items.length - 1)

  const piezas: Pieza[] = []
  let yM = pad
  items.forEach((item, indice) => {
    const pc = { x: izquierda + indice * (ancho + 16), y: pad, w: ancho, h: altoTarjeta }
    const movil = { x: 24, y: yM, w: anchoM, h: altosM[indice]! }
    const color = item.imagenUrl ? '#ffffff' : paleta.contraste
    if (item.imagenUrl) {
      const rol = `item${indice}`
      piezas.push({ base: { tipo: 'imagen', imagenUrl: item.imagenUrl, ajuste: 'cubrir', radio }, pc, movil, rol })
      // El lienzo no tiene degradados: un oscurecido parejo, sin franjas, para que el texto se lea.
      piezas.push({ base: { tipo: 'forma', fondo: '#000000', opacidad: 30, radio }, pc, movil, rol })
    } else {
      piezas.push({ base: { tipo: 'forma', fondo: paleta.marca, radio }, pc, movil, rol: `item${indice}` })
    }

    const medida = contenido(item, ancho - 56, 30)
    const medidaM = contenido(item, anchoM - 56, 24)
    let y = pc.y + pc.h - 28 - medida.total
    let yI = movil.y + movil.h - 28 - medidaM.total
    if (item.titulo) {
      piezas.push({ base: { tipo: 'titulo', texto: comoTitulo(item.titulo, tema), color }, pc: { x: pc.x + 28, y, w: ancho - 56, h: medida.hT }, movil: { x: 52, y: yI, w: anchoM - 56, h: medidaM.hT }, letra: 30, letraMovil: 24, rol: `item${indice}.titulo` })
      y += medida.hT
      yI += medidaM.hT
    }
    if (item.subtitulo) {
      const tono = item.imagenUrl ? '#dadada' : mezclar(paleta.contraste, paleta.marca, 0.85)
      piezas.push({ base: { tipo: 'texto', texto: item.subtitulo, color: tono }, pc: { x: pc.x + 28, y: y + 6, w: ancho - 56, h: medida.hS }, movil: { x: 52, y: yI + 6, w: anchoM - 56, h: medidaM.hS }, letra: 16, letraMovil: 16, rol: `item${indice}.bajada` })
      y += 6 + medida.hS
      yI += 6 + medidaM.hS
    }
    if (item.textoBoton) {
      const texto = `${item.textoBoton.toUpperCase()} →`
      const anchoTexto = anchoBoton(texto, 14, 12)
      // Como en la tienda: un enlace en mayúsculas sin fondo.
      piezas.push({
        base: { tipo: 'boton', texto, enlace: item.enlace || '#productos', fondo: 'transparent', color, peso: 'negrita' },
        pc: { x: pc.x + 28 - 11, y: y + 20 - 6, w: anchoTexto, h: 32 },
        movil: { x: 52 - 11, y: yI + 20 - 6, w: anchoTexto, h: 32 },
        letra: 14,
        letraMovil: 14,
        rol: `item${indice}.boton`,
      })
    }
    yM += altosM[indice]! + 16
  })
  return armar([...fondoDeEstilo(estilo, alto, altoMovil), ...piezas], alto, altoMovil, paleta.fondo, medidas)
}

/**
 * En el celular el llamado va centrado, pero una pieza tiene una sola
 * alineación: la caja se ajusta al texto y se centra, así una línea se ve
 * centrada; un texto más largo ocupa todo el ancho.
 */
function centradoEn(texto: string, letra: number, interno: number, { y, h }: { y: number; h: number }): Caja {
  const ancho = Math.min(interno, anchoLinea(texto, letra))
  return { x: (ANCHO_MOVIL - ancho) / 2, y, w: ancho, h }
}

/** Llamado: franja de color de marca con mensaje a la izquierda y botón a la derecha. */
const desdeLlamado: Conversor<PropsLlamado> = (props, tema, estilo, medidas) => {
  const paleta = paletaDe(tema, estilo)
  const radio = radioPx(tema)
  const colorTexto = mezclar(paleta.contraste, paleta.marca, 0.85)
  const titulo = comoTitulo(props.titulo, tema)

  // Computador: franja de 1152 con relleno de 56, texto hasta 672, botón de 52 de alto.
  const pad = relleno(estilo, 40)
  const x0 = (ANCHO - 1152) / 2
  const hT = altoTitulo(titulo, 30, 672)
  const hC = props.texto ? altoCuerpo(props.texto, 18, 672) : 0
  const hTexto = hT + (props.texto ? 12 + hC : 0)
  const altoFranja = 112 + Math.max(hTexto, props.textoBoton ? 52 : 0)
  const alto = pad * 2 + altoFranja
  const yTexto = pad + (altoFranja - hTexto) / 2
  const wBoton = props.textoBoton ? anchoBoton(props.textoBoton, 16, 28) : 0

  // Celular: franja de 342 con relleno de 32 y 56, todo centrado y en columna.
  const anchoM = ANCHO_MOVIL - 48
  const interno = anchoM - 64
  const hTM = altoTitulo(titulo, 30, interno)
  const hCM = props.texto ? altoCuerpo(props.texto, 18, interno) : 0
  const altoFranjaM = 112 + hTM + (props.texto ? 12 + hCM : 0) + (props.textoBoton ? 24 + 52 : 0)
  const altoMovil = pad * 2 + altoFranjaM

  const piezas: Pieza[] = [
    { base: { tipo: 'forma', fondo: paleta.marca, radio }, pc: { x: x0, y: pad, w: 1152, h: altoFranja }, movil: { x: 24, y: pad, w: anchoM, h: altoFranjaM }, rol: 'franja' },
    {
      base: { tipo: 'titulo', texto: titulo, color: paleta.contraste, alineacion: 'izquierda' },
      pc: { x: x0 + 56, y: yTexto, w: 672, h: hT },
      movil: centradoEn(titulo, 30, interno, { y: pad + 56, h: hTM }),
      letra: 30,
      letraMovil: 30,
      rol: 'titulo',
    },
  ]
  let yM = pad + 56 + hTM
  if (props.texto) {
    piezas.push({ base: { tipo: 'texto', texto: props.texto, color: colorTexto }, pc: { x: x0 + 56, y: yTexto + hT + 12, w: 672, h: hC }, movil: centradoEn(props.texto, 18, interno, { y: yM + 12, h: hCM }), letra: 18, letraMovil: 18, rol: 'bajada' })
    yM += 12 + hCM
  }
  if (props.textoBoton) {
    piezas.push({
      base: { tipo: 'boton', texto: comoBoton(props.textoBoton, tema), enlace: props.enlaceBoton || '#productos', fondo: paleta.contraste, color: paleta.marca, peso: 'negrita' },
      pc: { x: x0 + 1152 - 56 - wBoton, y: pad + (altoFranja - 52) / 2, w: wBoton, h: 52 },
      movil: { x: (ANCHO_MOVIL - wBoton) / 2, y: yM + 24, w: wBoton, h: 52 },
      letra: 16,
      letraMovil: 16,
      rol: 'boton',
    })
  }
  return armar([...fondoDeEstilo(estilo, alto, altoMovil), ...piezas], alto, altoMovil, paleta.fondo, medidas)
}

/** Texto: titular y párrafo en una columna angosta. */
const desdeTexto: Conversor<PropsTexto> = (props, tema, estilo, medidas) => {
  const paleta = paletaDe(tema, estilo)
  const centrado = props.alineacion === 'centro'
  const alinear = centrado ? 'centro' : 'izquierda'
  const colorCuerpo = mezclar(paleta.texto, paleta.fondo ?? tema.colorFondo ?? '#ffffff', 0.8)
  const titulo = props.titulo ? comoTitulo(props.titulo, tema) : ''

  // Computador: max-w-3xl con px-6 (720 útiles) y py-16. Título 24 px, párrafo 18 px.
  const pad = relleno(estilo, 64)
  const x0 = (ANCHO - 768) / 2 + 24
  const hT = titulo ? altoTitulo(titulo, 24, 720) : 0
  const hC = altoCuerpo(props.contenido, 18, 720)
  const alto = pad * 2 + (titulo ? hT + 16 : 0) + hC
  const anchoM = ANCHO_MOVIL - 48
  const hTM = titulo ? altoTitulo(titulo, 24, anchoM) : 0
  const hCM = altoCuerpo(props.contenido, 18, anchoM)
  const padM = relleno(estilo, 64)
  const altoMovil = padM * 2 + (titulo ? hTM + 16 : 0) + hCM

  const piezas: Pieza[] = []
  if (titulo)
    piezas.push({ base: { tipo: 'titulo', texto: titulo, color: paleta.texto, alineacion: alinear }, pc: { x: x0, y: pad, w: 720, h: hT }, movil: { x: 24, y: padM, w: anchoM, h: hTM }, letra: 24, letraMovil: 24, rol: 'titulo' })
  piezas.push({
    base: { tipo: 'texto', texto: props.contenido, color: colorCuerpo, alineacion: alinear },
    pc: { x: x0, y: pad + (titulo ? hT + 16 : 0), w: 720, h: hC },
    movil: { x: 24, y: padM + (titulo ? hTM + 16 : 0), w: anchoM, h: hCM },
    letra: 18,
    letraMovil: 18,
    rol: 'bajada',
  })
  return armar([...fondoDeEstilo(estilo, alto, altoMovil), ...piezas], alto, altoMovil, paleta.fondo, medidas)
}

/** De un iframe de YouTube (youtube-nocookie.com/embed/ID) vuelve al enlace normal. */
function enlaceVideo(src: string): string {
  const id = src.match(/\/embed\/([\w-]{11})/)?.[1]
  return id ? `https://youtu.be/${id}` : src
}

/**
 * Cualquier sección, pieza por pieza, a partir de lo que se recorrió en la
 * sección pintada (utilidades/medirSecciones). Lo vivo (la grilla de
 * productos, el reloj, las redes) sale como pieza viva con los datos de la
 * sección; lo demás, como textos, botones, fotos y formas fijas.
 */
function desdeNodos(bloque: Bloque, tema: TemaTienda, medidas: MedidasSeccion): BloqueLienzo['props'] {
  const paleta = paletaDe(tema, bloque.estilo)
  const enCelular = new Map((medidas.movil.nodos ?? []).map((nodo) => [nodo.clave, nodo]))
  const props = bloque.props as unknown as Record<string, unknown>

  const piezas: Pieza[] = []
  for (const nodo of medidas.pc.nodos ?? []) {
    const movil = enCelular.get(nodo.clave)
    const cajaPc = { x: nodo.x, y: nodo.y, w: nodo.w, h: nodo.h }
    const cajaMovil = movil ? { x: movil.x, y: movil.y, w: movil.w, h: movil.h } : { x: 0, y: 0, w: 10, h: 10 }
    const comun = { pc: cajaPc, movil: cajaMovil, letra: nodo.letra, letraMovil: movil?.letra ?? nodo.letra, ocultoMovil: !movil }
    const negrita = nodo.negrita ? ({ peso: 'negrita' } as const) : {}
    let base: Base | null = null
    switch (nodo.tipo) {
      case 'titulo':
      case 'texto':
        base = { tipo: nodo.tipo, texto: nodo.texto, color: nodo.color, alineacion: nodo.alineacion, ...negrita }
        break
      case 'enlace':
        base = { tipo: 'enlace', texto: nodo.texto, enlace: nodo.enlace, color: nodo.color, alineacion: nodo.alineacion, sinSubrayado: nodo.sinSubrayado }
        break
      case 'boton':
        base = { tipo: 'boton', texto: nodo.texto, enlace: nodo.enlace, color: nodo.color, fondo: nodo.fondo, contorno: nodo.contorno, radio: nodo.radio, ...negrita }
        break
      case 'imagen':
        base = { tipo: 'imagen', imagenUrl: nodo.imagenUrl, ajuste: nodo.ajuste, radio: nodo.radio, opacidad: nodo.opacidad, enlace: nodo.enlace }
        break
      case 'forma':
        base = { tipo: 'forma', fondo: nodo.fondo, opacidad: nodo.opacidad, radio: nodo.radio }
        break
      case 'icono':
        base = { tipo: 'icono', icono: nodo.icono, color: nodo.color, relleno: nodo.relleno }
        break
      case 'video':
        base = { tipo: 'video', url: nodo.url ? enlaceVideo(nodo.url) : undefined, radio: nodo.radio }
        break
      case 'mapa':
        base = { tipo: 'mapa', direccion: nodo.direccion, radio: nodo.radio }
        break
      case 'vivo':
        if (nodo.vivo === 'productos')
          base = {
            tipo: 'productos',
            categoria: props.categoria as string | undefined,
            limite: (props.limite as number | undefined) ?? 8,
            columnas: (props.columnas as number | undefined) ?? 3,
            columnasMovil: 2,
            soloDestacados: props.soloDestacados as boolean | undefined,
            tarjeta: { estilo: props.estilo === 'tarjeta' ? 'tarjeta' : 'simple' },
          }
        else if (nodo.vivo === 'cuenta') base = { tipo: 'cuenta', fecha: props.fecha as string | undefined, fondo: paleta.marca, color: paleta.contraste }
        else base = { tipo: 'redes', color: nodo.color, alineacion: 'izquierda' }
        break
    }
    if (base) piezas.push({ base, ...comun })
  }
  return armar(piezas, medidas.pc.alto, medidas.movil.alto, paleta.fondo, undefined)
}

const CONVERSORES: Partial<Record<TipoBloque, Conversor<never>>> = {
  hero: desdeHero as Conversor<never>,
  carrusel: desdeCarrusel as Conversor<never>,
  'imagen-texto': desdeImagenTexto as Conversor<never>,
  'banner-doble': desdeBannerDoble as Conversor<never>,
  llamado: desdeLlamado as Conversor<never>,
  texto: desdeTexto as Conversor<never>,
}

/**
 * La sección como Lienzo libre, con el mismo id para que siga abierta y en su
 * lugar. Del estilo se queda lo que no es medida: colores, ancla, animación,
 * dispositivos y forma; la imagen de fondo ya va como pieza.
 */
export function aLienzo(bloque: Bloque, tema: TemaTienda, medidas?: MedidasSeccion): BloqueLienzo | null {
  const conversor = CONVERSORES[bloque.tipo]
  let props: BloqueLienzo['props'] | null
  if (conversor) props = (conversor as Conversor<Bloque['props']>)(bloque.props, tema, bloque.estilo, medidas)
  // Sin conversor propio hace falta la sección medida: se arma pieza por pieza.
  else props = medidas?.pc.nodos ? desdeNodos(bloque, tema, medidas) : null
  if (!props) return null
  const { esquema, fondo, texto, ancla, animacion, dispositivos, forma } = bloque.estilo ?? {}
  const estilo = Object.fromEntries(
    Object.entries({ esquema, fondo, texto, ancla, animacion, dispositivos, forma }).filter(([, valor]) => valor !== undefined),
  ) as EstiloSeccion
  return {
    id: bloque.id,
    tipo: 'lienzo',
    props,
    ...(bloque.visible === false ? { visible: false } : {}),
    ...(Object.keys(estilo).length ? { estilo } : {}),
  }
}

/** Aviso extra antes de convertir, cuando algo no pasa tal cual. */
export function avisoConversion(bloque: Bloque): string | null {
  if (bloque.tipo === 'carrusel' && bloque.props.diapositivas.length > 1)
    return 'Del carrusel se toma la primera diapositiva; las demás se descartan.'
  if (bloque.tipo === 'preguntas') return 'Las preguntas quedan abiertas, como texto.'
  return null
}
