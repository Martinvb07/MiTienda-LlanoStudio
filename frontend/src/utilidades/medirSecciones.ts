'use client'

import type { MensajeVistaPrevia } from '@/app/panel/vista-previa/mensajes'
import type { Bloque, TipoBloque } from '@/tipos/bloques'
import type { MedidaRol, MedidasSeccion, NodoMedido } from './editarLibre'

/**
 * Mide las secciones tal como se pintan, para que "Editar libre" ponga cada
 * pieza exactamente donde estaba. Abre la vista previa del editor en dos
 * iframes ocultos (1440 y 390 px, los anchos de la vista previa), le manda el
 * mismo borrador y lee la caja de cada título, texto, botón y foto.
 *
 * Si algo falla o tarda, devuelve lo que alcanzó a medir y los conversores
 * calculan el resto.
 */

const ANCHOS = { pc: { ancho: 1440, alto: 900 }, movil: { ancho: 390, alto: 844 } } as const
const ESPERA_MAXIMA = 8000

/** Qué elemento de la sección es cada pieza, por tipo. Lee el HTML de componentes/tienda/bloques. */
const ROLES: Partial<Record<TipoBloque, (seccion: Element) => Record<string, Element | null>>> = {
  hero: (seccion) => ({
    titulo: seccion.querySelector('h1'),
    bajada: seccion.querySelector('h1 ~ p'),
    boton: seccion.querySelector('a.boton-tienda'),
  }),
  carrusel: (seccion) => ({
    titulo: seccion.querySelector('h2'),
    bajada: seccion.querySelector('h2 ~ p, [class*="text-lg"]'),
    boton: seccion.querySelector('a.boton-tienda'),
  }),
  'imagen-texto': (seccion) => ({
    foto: seccion.querySelector('section > div'),
    titulo: seccion.querySelector('h2'),
    bajada: seccion.querySelector('h2 ~ p'),
    boton: seccion.querySelector('a.boton-tienda'),
  }),
  'banner-doble': (seccion) =>
    Object.fromEntries(
      [...(seccion.querySelector('section')?.children ?? [])].flatMap((tarjeta, indice) => [
        [`item${indice}`, tarjeta],
        [`item${indice}.titulo`, tarjeta.querySelector('h3')],
        [`item${indice}.bajada`, tarjeta.querySelector('p')],
        [`item${indice}.boton`, tarjeta.querySelector(':scope > div > span')],
      ]),
    ),
  llamado: (seccion) => ({
    franja: seccion.querySelector('section > div'),
    titulo: seccion.querySelector('h2'),
    bajada: seccion.querySelector('h2 ~ p'),
    boton: seccion.querySelector('a.boton-tienda'),
  }),
  texto: (seccion) => ({
    titulo: seccion.querySelector('h2'),
    bajada: seccion.querySelector('p'),
  }),
}

const ALINEACION: Record<string, MedidaRol['alineacion']> = {
  left: 'izquierda',
  start: 'izquierda',
  center: 'centro',
  right: 'derecha',
  end: 'derecha',
}

function medirElemento(elemento: Element, origen: DOMRect): MedidaRol {
  const caja = elemento.getBoundingClientRect()
  const estilo = getComputedStyle(elemento)
  const relativa = (rect: DOMRect) => ({ x: rect.left - origen.left, y: rect.top - origen.top, w: rect.width, h: rect.height })
  const rango = elemento.ownerDocument.createRange()
  rango.selectNodeContents(elemento)
  const texto = rango.getBoundingClientRect()
  return {
    ...relativa(caja),
    letra: Number.parseFloat(estilo.fontSize) || undefined,
    radio: Number.parseFloat(estilo.borderTopLeftRadius) || 0,
    alineacion: ALINEACION[estilo.textAlign],
    ...(texto.width > 0 ? { texto: relativa(texto) } : {}),
  }
}

// ── Recorrido general: para las secciones sin conversor propio ──

/** Íconos de lucide que tienen pieza propia en el lienzo (componentes/tienda/bloques/PiezasLienzo). */
const ICONOS_LUCIDE: Record<string, string> = {
  star: 'estrella', heart: 'corazon', truck: 'envio', 'shield-check': 'garantia', 'credit-card': 'pago', gift: 'regalo',
  tag: 'etiqueta', 'badge-percent': 'descuento', clock: 'reloj', 'map-pin': 'ubicacion', phone: 'telefono', mail: 'correo',
  'message-circle': 'chat', 'shopping-bag': 'bolsa', sparkles: 'brillo', award: 'premio', leaf: 'hoja', zap: 'rayo',
  coffee: 'cafe', scissors: 'tijeras', house: 'casa', home: 'casa', check: 'listo', lock: 'candado', package: 'paquete',
}
const EN_LINEA = new Set(['SPAN', 'B', 'STRONG', 'EM', 'I', 'S', 'SMALL', 'BR', 'U', 'MARK', 'SUP', 'SUB'])

/** Lee cualquier color (rgb, oklab, color-mix…) pintándolo en un píxel. */
function lectorDeColor(documento: Document) {
  const lienzo = documento.createElement('canvas')
  lienzo.width = lienzo.height = 1
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })
  return (valor: string): [number, number, number, number] => {
    if (!ctx || !valor || valor === 'transparent') return [0, 0, 0, 0]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = valor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return [r!, g!, b!, a! / 255]
  }
}

const hex = ([r, g, b]: number[]) => `#${[r, g, b].map((canal) => Math.round(canal!).toString(16).padStart(2, '0')).join('')}`
const mezclar = (frente: number[], fondo: number[], alfa: number) => frente.slice(0, 3).map((canal, i) => canal * alfa + fondo[i]! * (1 - alfa))

/** La imagen original detrás de /_next/image?url=… */
function fuenteImagen(imagen: HTMLImageElement): string {
  const src = imagen.getAttribute('src') ?? ''
  if (src.startsWith('/_next/image')) return new URLSearchParams(src.split('?')[1]).get('url') ?? src
  return src
}

/**
 * Convierte la sección pintada en piezas: textos, botones, fotos, fondos,
 * bordes, íconos e iframes, con su caja, letra y colores reales. Lo marcado
 * con data-lienzo-vivo (grilla de productos, reloj, redes) sale como una sola
 * pieza viva.
 */
function recorrer(seccion: Element, origen: DOMRect, documento: Document): NodoMedido[] {
  const vista = documento.defaultView!
  const color = lectorDeColor(documento)
  const fondoPagina = color(vista.getComputedStyle(documento.querySelector('.bg-superficie') ?? documento.body).backgroundColor)
  const nodos: NodoMedido[] = []
  const caja = (rect: DOMRect) => ({ x: rect.left - origen.left, y: rect.top - origen.top, w: rect.width, h: rect.height })

  // Fondo efectivo detrás de un elemento, para mezclar los colores con transparencia.
  const fondoDe = (elemento: Element | null): number[] => {
    for (let actual = elemento; actual; actual = actual.parentElement) {
      const [r, g, b, a] = color(vista.getComputedStyle(actual).backgroundColor)
      if (a > 0.5) return [r, g, b]
    }
    return fondoPagina[3] > 0 ? fondoPagina.slice(0, 3) : [255, 255, 255]
  }
  const opacidadDe = (elemento: Element) => {
    let total = 1
    for (let actual: Element | null = elemento; actual && actual !== seccion.parentElement; actual = actual.parentElement) total *= Number(vista.getComputedStyle(actual).opacity) || 1
    return total
  }
  const colorTexto = (elemento: Element, estilo: CSSStyleDeclaration) => {
    const [r, g, b, a] = color(estilo.color)
    return hex(mezclar([r, g, b], fondoDe(elemento), a * opacidadDe(elemento)))
  }
  // El texto sin lo decorativo (aria-hidden), como el + de una pregunta.
  const textoDe = (elemento: HTMLElement, estilo: CSSStyleDeclaration) => {
    const copia = elemento.cloneNode(true) as HTMLElement
    for (const oculto of copia.querySelectorAll('[aria-hidden="true"]')) oculto.remove()
    for (const salto of copia.querySelectorAll('br')) salto.replaceWith('\n')
    const texto = (copia.textContent ?? '').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()
    return estilo.textTransform === 'uppercase' ? texto.toUpperCase() : texto
  }
  /** La caja que ocupan los hijos (la fila de un reloj o de unas redes, sin el aire de los lados). */
  const cajaDeHijos = (elemento: Element) => {
    const rects = [...elemento.children].map((hijo) => hijo.getBoundingClientRect()).filter((rect) => rect.width > 0)
    if (rects.length === 0) return caja(elemento.getBoundingClientRect())
    const x = Math.min(...rects.map((rect) => rect.left))
    const y = Math.min(...rects.map((rect) => rect.top))
    return caja(new DOMRect(x, y, Math.max(...rects.map((rect) => rect.right)) - x, Math.max(...rects.map((rect) => rect.bottom)) - y))
  }

  function visitar(elemento: Element, clave: string) {
    const estilo = vista.getComputedStyle(elemento)
    if (estilo.display === 'none' || estilo.visibility === 'hidden' || Number(estilo.opacity) === 0) return
    // Lo decorativo no pasa (salvo los íconos, que también van con aria-hidden).
    if (elemento.getAttribute('aria-hidden') === 'true' && elemento.tagName.toLowerCase() !== 'svg') return
    const rect = elemento.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    const base = { clave, ...caja(rect) }
    const radio = Number.parseFloat(estilo.borderTopLeftRadius) || 0
    const etiqueta = elemento.tagName

    const vivo = elemento.getAttribute('data-lienzo-vivo')
    if (vivo === 'productos' || vivo === 'cuenta' || vivo === 'redes')
      return void nodos.push({ ...base, ...(vivo === 'productos' ? {} : cajaDeHijos(elemento)), tipo: 'vivo', vivo, color: colorTexto(elemento, estilo) })

    if (etiqueta === 'IFRAME') {
      const src = elemento.getAttribute('src') ?? ''
      if (src.includes('google.com/maps')) return void nodos.push({ ...base, tipo: 'mapa', radio, direccion: new URL(src).searchParams.get('q') ?? '' })
      return void nodos.push({ ...base, tipo: 'video', radio, url: src })
    }
    if (etiqueta === 'IMG') {
      const marco = elemento.parentElement ? vista.getComputedStyle(elemento.parentElement) : null
      return void nodos.push({
        ...base,
        tipo: 'imagen',
        imagenUrl: fuenteImagen(elemento as HTMLImageElement),
        ajuste: estilo.objectFit === 'contain' ? 'contener' : 'cubrir',
        radio: radio || (marco?.overflow === 'hidden' ? Number.parseFloat(marco.borderTopLeftRadius) || 0 : 0),
        opacidad: Math.round(opacidadDe(elemento) * 100),
        enlace: elemento.closest('a')?.getAttribute('href') ?? undefined,
      })
    }
    if (etiqueta === 'svg' || etiqueta === 'SVG') {
      const nombre = [...elemento.classList].find((clase) => clase.startsWith('lucide-'))?.slice(7)
      const icono = nombre ? ICONOS_LUCIDE[nombre] : undefined
      const relleno = estilo.fill !== 'none' && color(estilo.fill)[3] > 0
      if (icono) nodos.push({ ...base, tipo: 'icono', icono, color: colorTexto(elemento, estilo), ...(relleno ? { relleno: true } : {}) })
      return
    }

    // Fondo propio (color o degradado) y bordes: formas debajo de lo que tenga adentro.
    const [r, g, b, a] = color(estilo.backgroundColor)
    if (a > 0.02) nodos.push({ ...base, clave: `${clave}:fondo`, tipo: 'forma', fondo: hex([r, g, b]), opacidad: Math.round(a * opacidadDe(elemento) * 100), radio })
    if (estilo.backgroundImage.includes('gradient')) nodos.push({ ...base, clave: `${clave}:degradado`, tipo: 'forma', fondo: '#000000', opacidad: 30, radio })
    // Un botón o enlace de texto: sin bloques ni capas sueltas adentro (un cuadro de categoría no lo es).
    const esBoton =
      (etiqueta === 'A' || etiqueta === 'BUTTON') &&
      !elemento.querySelector('img, h1, h2, h3, p, div') &&
      [...elemento.children].every((hijo) => vista.getComputedStyle(hijo).position !== 'absolute')
    const grosorBorde = Number.parseFloat(estilo.borderTopWidth) || 0
    if (!esBoton && radio > 0 && grosorBorde > 0 && estilo.borderTopStyle !== 'none') {
      // Caja redondeada con borde: el borde es una forma y el relleno otra, adentro.
      const [br, bg, bb, ba] = color(estilo.borderTopColor)
      const detras = fondoDe(elemento.parentElement)
      if (ba > 0.02) {
        nodos.push({ ...base, clave: `${clave}:borde`, tipo: 'forma', fondo: hex(mezclar([br, bg, bb], detras, ba)), opacidad: 100, radio })
        const relleno = a > 0.02 ? mezclar([r, g, b], detras, a) : detras
        nodos.push({
          ...base,
          x: base.x + grosorBorde,
          y: base.y + grosorBorde,
          w: base.w - grosorBorde * 2,
          h: base.h - grosorBorde * 2,
          clave: `${clave}:relleno`,
          tipo: 'forma',
          fondo: hex(relleno),
          opacidad: 100,
          radio: Math.max(0, radio - grosorBorde),
        })
      }
    }
    if (!esBoton) {
      for (const lado of ['Top', 'Bottom', 'Left', 'Right'] as const) {
        const grosor = Number.parseFloat(estilo.getPropertyValue(`border-${lado.toLowerCase()}-width`))
        if (!grosor || estilo.getPropertyValue(`border-${lado.toLowerCase()}-style`) === 'none') continue
        const [br, bg, bb, ba] = color(estilo.getPropertyValue(`border-${lado.toLowerCase()}-color`))
        if (ba < 0.02 || radio > 0) continue
        const borde = { Top: { y: base.y, h: grosor }, Bottom: { y: base.y + base.h - grosor, h: grosor }, Left: { x: base.x, w: grosor }, Right: { x: base.x + base.w - grosor, w: grosor } }[lado]
        nodos.push({ ...base, ...borde, clave: `${clave}:borde${lado}`, tipo: 'forma', fondo: hex(mezclar([br, bg, bb], fondoDe(elemento), ba)), opacidad: 100 })
      }
    }

    if (esBoton) {
      const texto = textoDe(elemento as HTMLElement, estilo)
      const red = elemento.getAttribute('aria-label')
      if (!texto && !red) return
      const conCaja = a > 0.02 || Number.parseFloat(estilo.borderTopWidth) > 0
      return void nodos.push({
        ...base,
        tipo: conCaja ? 'boton' : 'enlace',
        texto: texto || red || '',
        letra: Number.parseFloat(estilo.fontSize),
        color: colorTexto(elemento, estilo),
        ...(conCaja ? { fondo: a > 0.02 ? hex(mezclar([r, g, b], fondoDe(elemento.parentElement), a)) : 'transparent', contorno: a <= 0.02, radio } : {}),
        ...(!conCaja && !estilo.textDecorationLine.includes('underline') ? { sinSubrayado: true } : {}),
        negrita: Number(estilo.fontWeight) >= 600,
        alineacion: ALINEACION[estilo.textAlign],
        enlace: elemento.getAttribute('href') ?? undefined,
      })
    }

    // Un bloque de texto: tiene texto propio y adentro sólo cosas en línea.
    const hijos = [...elemento.children]
    const textoPropio = [...elemento.childNodes].some((hijo) => hijo.nodeType === 3 && hijo.textContent?.trim())
    if (textoPropio && hijos.every((hijo) => EN_LINEA.has(hijo.tagName))) {
      const titulo = /^H[1-4]$/.test(etiqueta) || elemento.closest('.font-display') !== null || elemento.classList.contains('font-display')
      return void nodos.push({
        ...base,
        tipo: titulo ? 'titulo' : 'texto',
        texto: textoDe(elemento as HTMLElement, estilo),
        letra: Number.parseFloat(estilo.fontSize),
        color: colorTexto(elemento, estilo),
        negrita: Number(estilo.fontWeight) >= 650,
        alineacion: ALINEACION[estilo.textAlign],
      })
    }
    // Texto suelto junto a otros hijos (la dirección del pie, al lado de su ícono): su propia pieza.
    elemento.childNodes.forEach((hijo, indice) => {
      if (hijo.nodeType !== 3 || !hijo.textContent?.trim()) return
      const rango = documento.createRange()
      rango.selectNodeContents(hijo)
      const rect = rango.getBoundingClientRect()
      if (rect.width < 1) return
      nodos.push({
        clave: `${clave}~${indice}`,
        ...caja(rect),
        tipo: 'texto',
        texto: hijo.textContent.trim(),
        letra: Number.parseFloat(estilo.fontSize),
        color: colorTexto(elemento, estilo),
        negrita: Number(estilo.fontWeight) >= 650,
        alineacion: 'izquierda',
      })
    })
    hijos.forEach((hijo, indice) => visitar(hijo, `${clave}.${indice}`))
  }

  visitar(seccion, '0')
  return nodos
}

function medirEn(documento: Document, bloques: Bloque[]) {
  const resultado = new Map<string, { alto: number; roles: Record<string, MedidaRol>; nodos?: NodoMedido[] }>()
  for (const bloque of bloques) {
    const seccion = documento.querySelector(`[data-bloque="${CSS.escape(bloque.id)}"]`)
    if (!seccion) continue
    const origen = seccion.getBoundingClientRect()
    // Oculta en este dispositivo: no hay nada que medir.
    if (origen.height === 0) continue
    const roles = ROLES[bloque.tipo]
    const medidas: Record<string, MedidaRol> = {}
    if (roles) for (const [rol, elemento] of Object.entries(roles(seccion))) if (elemento) medidas[rol] = medirElemento(elemento, origen)
    // Sin conversor propio: se recorre la sección entera.
    resultado.set(bloque.id, { alto: origen.height, roles: medidas, ...(roles ? {} : { nodos: recorrer(seccion, origen, documento) }) })
  }
  return resultado
}

/** Pinta el borrador en un iframe oculto del ancho pedido y mide las secciones. */
function medirConAncho(datos: MensajeVistaPrevia['datos'], bloques: Bloque[], { ancho, alto }: { ancho: number; alto: number }) {
  return new Promise<Map<string, { alto: number; roles: Record<string, MedidaRol>; nodos?: NodoMedido[] }>>((resolver) => {
    const marco = document.createElement('iframe')
    marco.src = '/panel/vista-previa'
    marco.setAttribute('aria-hidden', 'true')
    marco.tabIndex = -1
    Object.assign(marco.style, { position: 'fixed', left: '-20000px', top: '0', width: `${ancho}px`, height: `${alto}px`, border: '0', pointerEvents: 'none' })

    let terminado = false
    const terminar = (medidas = new Map()) => {
      if (terminado) return
      terminado = true
      window.removeEventListener('message', alMensaje)
      clearTimeout(reloj)
      marco.remove()
      resolver(medidas)
    }
    const reloj = setTimeout(() => terminar(), ESPERA_MAXIMA)

    async function alMensaje(evento: MessageEvent) {
      // Sólo el saludo de este iframe: la vista previa del editor saluda igual.
      if (evento.origin !== window.location.origin || evento.source !== marco.contentWindow || evento.data?.tipo !== 'mt-vista-lista') return
      marco.contentWindow?.postMessage(
        { tipo: 'mt-vista', datos: { ...datos, vista: 'tienda', editable: false, enfocar: null, lienzoElegido: null } } satisfies MensajeVistaPrevia,
        window.location.origin,
      )
      const documento = marco.contentDocument
      if (!documento) return terminar()
      // Sin animaciones de entrada: lo que se mide es la sección quieta.
      const estilo = documento.createElement('style')
      estilo.textContent = '[data-animacion]{transform:none!important;filter:none!important;opacity:1!important}'
      documento.head.appendChild(estilo)
      await documento.fonts.ready
      // Las diapositivas del carrusel entran con un movimiento de casi un segundo.
      await new Promise((listo) => setTimeout(listo, 1300))
      // Las preguntas frecuentes se miden abiertas: así sus respuestas pasan al lienzo.
      for (const detalle of documento.querySelectorAll('details')) detalle.open = true
      await new Promise((listo) => setTimeout(listo, 100))
      terminar(medirEn(documento, bloques))
    }
    window.addEventListener('message', alMensaje)
    document.body.appendChild(marco)
  })
}

/** Medidas de cada sección a 1440 y a 390 px. Las que no se pudieron medir no vienen. */
export async function medirSecciones(datos: MensajeVistaPrevia['datos'], bloques: Bloque[]): Promise<Map<string, MedidasSeccion>> {
  const [pc, movil] = await Promise.all([medirConAncho(datos, bloques, ANCHOS.pc), medirConAncho(datos, bloques, ANCHOS.movil)])
  const medidas = new Map<string, MedidasSeccion>()
  for (const bloque of bloques) {
    const medidaPc = pc.get(bloque.id)
    const medidaMovil = movil.get(bloque.id)
    if (medidaPc && medidaMovil) medidas.set(bloque.id, { pc: medidaPc, movil: medidaMovil })
  }
  return medidas
}
