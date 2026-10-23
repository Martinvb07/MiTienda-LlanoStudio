import type { CSSProperties } from 'react'
import type { EsquemaColor, FuenteTitulos, TemaBase, TemaTienda } from '@/tipos/tienda'
import { FUENTES } from './fuentes'

/** Etiqueta y pila de cada tipografía, para quien sólo necesita mostrarlas. */
export const FUENTES_TITULOS: Record<FuenteTitulos, { etiqueta: string; pila: string }> = Object.fromEntries(
  Object.entries(FUENTES).map(([clave, fuente]) => [
    clave,
    { etiqueta: clave === 'moderna' ? 'Moderna' : clave === 'clasica' ? 'Clásica' : fuente.nombre, pila: fuente.pila },
  ]),
)

const pilaDe = (clave: string | undefined) => (clave ? FUENTES[clave]?.pila : undefined)

const RADIO_BOTON = { recto: '0px', suave: 'var(--radio)', pildora: '999px' } as const

export const RADIOS = [
  { valor: '0rem', etiqueta: 'Recto' },
  { valor: '0.5rem', etiqueta: 'Suave' },
  { valor: '1.25rem', etiqueta: 'Redondo' },
] as const

/** Puntos de partida del editor: aplican un tema completo de un clic. */
export const ESTILOS_PREDEFINIDOS: { clave: string; nombre: string; tema: TemaBase }[] = [
  {
    clave: 'clasica',
    nombre: 'Clásica',
    tema: { colorMarca: '#0f172a', colorContraste: '#ffffff', colorFondo: '#ffffff', colorTexto: '#0f172a', fuenteTitulos: 'moderna', radio: '0.5rem' },
  },
  {
    clave: 'calida',
    nombre: 'Cálida',
    tema: { colorMarca: '#b45309', colorContraste: '#ffffff', colorFondo: '#faf6ef', colorTexto: '#292524', fuenteTitulos: 'clasica', radio: '0.5rem' },
  },
  {
    clave: 'nocturna',
    nombre: 'Nocturna',
    tema: { colorMarca: '#ffffff', colorContraste: '#000000', colorFondo: '#0b0b0c', colorTexto: '#f5f5f5', fuenteTitulos: 'moderna', radio: '0rem' },
  },
  {
    clave: 'fresca',
    nombre: 'Fresca',
    tema: { colorMarca: '#0f766e', colorContraste: '#ffffff', colorFondo: '#f3faf8', colorTexto: '#123332', fuenteTitulos: 'redondeada', radio: '1.25rem' },
  },
  {
    clave: 'llanera',
    nombre: 'Llanera',
    tema: { colorMarca: '#3b60ff', colorContraste: '#ffffff', colorFondo: '#f7f5f0', colorTexto: '#0a0f1c', fuenteTitulos: 'moderna', radio: '0.75rem' },
  },
]

/**
 * Traduce Tienda.tema a variables CSS en línea. Es lo que permite tematizar
 * por tenant con un único build: la tienda pública y la vista previa del
 * editor usan esta misma función, así que se ven igual.
 */
export function variablesTema(tema: TemaTienda): CSSProperties {
  return {
    ...(tema.colorMarca ? { '--marca': tema.colorMarca } : {}),
    ...(tema.colorContraste ? { '--marca-contraste': tema.colorContraste } : {}),
    ...(tema.colorFondo ? { '--superficie': tema.colorFondo } : {}),
    ...(tema.colorTexto ? { '--tinta': tema.colorTexto } : {}),
    ...(tema.radio ? { '--radio': tema.radio } : {}),
    ...(pilaDe(tema.fuenteTitulos) ? { '--fuente-display': pilaDe(tema.fuenteTitulos) } : {}),
    ...(pilaDe(tema.fuenteCuerpo) ? { fontFamily: pilaDe(tema.fuenteCuerpo) } : {}),
    ...(tema.botonForma ? { '--radio-boton': RADIO_BOTON[tema.botonForma] } : {}),
    ...(tema.colorPrecio ? { '--precio': tema.colorPrecio } : {}),
  } as CSSProperties
}

/**
 * El resto de la configuración del tema viaja como atributos data-* del marco
 * de la tienda; las reglas de globals.css (bajo [data-tienda]) los aplican.
 */
export function atributosTema(tema: TemaTienda): Record<string, string> {
  const atributos: Record<string, string> = { 'data-tienda': '' }
  if (tema.pesoTitulos && tema.pesoTitulos !== 'medio') atributos['data-titulos-peso'] = tema.pesoTitulos
  if (tema.titulosMayusculas) atributos['data-titulos-mayus'] = ''
  if (tema.anchoPagina && tema.anchoPagina !== 'normal') atributos['data-ancho-pagina'] = tema.anchoPagina
  if (tema.botonEstilo === 'contorno') atributos['data-botones'] = 'contorno'
  if (tema.botonMayusculas) atributos['data-boton-mayus'] = ''
  if (tema.tarjetaProporcion && tema.tarjetaProporcion !== 'cuadrada') atributos['data-tarjeta'] = tema.tarjetaProporcion
  if (tema.tarjetaAlineacion === 'centro') atributos['data-tarjeta-centro'] = ''
  if (tema.tarjetaSegundaFoto) atributos['data-segunda-foto'] = ''
  return atributos
}

/** Variables de un esquema de color, para el marco de una sección. */
export function variablesEsquema(esquema: EsquemaColor): CSSProperties {
  return {
    '--superficie': esquema.fondo,
    '--tinta': esquema.texto,
    '--marca': esquema.marca,
    '--marca-contraste': esquema.contraste,
    background: esquema.fondo,
    color: esquema.texto,
  } as CSSProperties
}

/** Esquemas con los que arranca una tienda: el suyo, uno claro, uno oscuro y el de marca. */
export function esquemasIniciales(tema: TemaTienda): EsquemaColor[] {
  const marca = tema.colorMarca ?? '#0f172a'
  const contraste = tema.colorContraste ?? '#ffffff'
  return [
    { id: 'e1', nombre: 'Principal', fondo: tema.colorFondo ?? '#ffffff', texto: tema.colorTexto ?? '#0f172a', marca, contraste },
    { id: 'e2', nombre: 'Suave', fondo: '#f4f4f1', texto: tema.colorTexto ?? '#0f172a', marca, contraste },
    { id: 'e3', nombre: 'Oscuro', fondo: '#0b0b0c', texto: '#f5f5f5', marca: '#ffffff', contraste: '#000000' },
    { id: 'e4', nombre: 'Marca', fondo: marca, texto: contraste, marca: contraste, contraste: marca },
  ]
}
