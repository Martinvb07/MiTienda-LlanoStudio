import type { CSSProperties } from 'react'
import type { FuenteTitulos, TemaTienda } from '@/tipos/tienda'

export const FUENTES_TITULOS: Record<FuenteTitulos, { etiqueta: string; pila: string }> = {
  moderna: { etiqueta: 'Moderna', pila: 'var(--fuente-sans)' },
  clasica: { etiqueta: 'Clásica', pila: 'Georgia, "Times New Roman", serif' },
  redondeada: { etiqueta: 'Redondeada', pila: 'ui-rounded, "SF Pro Rounded", "Nunito", var(--fuente-sans)' },
}

export const RADIOS = [
  { valor: '0rem', etiqueta: 'Recto' },
  { valor: '0.5rem', etiqueta: 'Suave' },
  { valor: '1.25rem', etiqueta: 'Redondo' },
] as const

/** Puntos de partida del editor: aplican un tema completo de un clic. */
export const ESTILOS_PREDEFINIDOS: { clave: string; nombre: string; tema: Required<TemaTienda> }[] = [
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
    ...(tema.fuenteTitulos ? { '--fuente-display': FUENTES_TITULOS[tema.fuenteTitulos].pila } : {}),
  } as CSSProperties
}
