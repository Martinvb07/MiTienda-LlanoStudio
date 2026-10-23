'use client'

import type { MensajeVistaPrevia } from '@/app/panel/vista-previa/mensajes'
import type { Bloque, TipoBloque } from '@/tipos/bloques'
import type { MedidaRol, MedidasSeccion } from './editarLibre'

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

function medirEn(documento: Document, bloques: Bloque[]) {
  const resultado = new Map<string, { alto: number; roles: Record<string, MedidaRol> }>()
  for (const bloque of bloques) {
    const seccion = documento.querySelector(`[data-bloque="${CSS.escape(bloque.id)}"]`)
    const roles = ROLES[bloque.tipo]
    if (!seccion || !roles) continue
    const origen = seccion.getBoundingClientRect()
    // Oculta en este dispositivo: no hay nada que medir.
    if (origen.height === 0) continue
    const medidas: Record<string, MedidaRol> = {}
    for (const [rol, elemento] of Object.entries(roles(seccion))) if (elemento) medidas[rol] = medirElemento(elemento, origen)
    resultado.set(bloque.id, { alto: origen.height, roles: medidas })
  }
  return resultado
}

/** Pinta el borrador en un iframe oculto del ancho pedido y mide las secciones. */
function medirConAncho(datos: MensajeVistaPrevia['datos'], bloques: Bloque[], { ancho, alto }: { ancho: number; alto: number }) {
  return new Promise<Map<string, { alto: number; roles: Record<string, MedidaRol> }>>((resolver) => {
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
