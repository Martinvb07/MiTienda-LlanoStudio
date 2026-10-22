/**
 * Tipografías que la tienda puede elegir para títulos y texto. Las tres
 * primeras son del sistema (sin descarga); el resto se cargan de Google Fonts
 * sólo en las tiendas que las usan.
 */
export interface Fuente {
  nombre: string
  /** Nombre de la familia en Google Fonts; vacío para las del sistema. */
  google?: string
  pila: string
  grupo: 'Sistema' | 'Sin serifa' | 'Con serifa' | 'Display'
}

export const FUENTES: Record<string, Fuente> = {
  moderna: { nombre: 'Geist', pila: 'var(--fuente-sans), ui-sans-serif, system-ui, sans-serif', grupo: 'Sistema' },
  clasica: { nombre: 'Georgia', pila: 'Georgia, "Times New Roman", serif', grupo: 'Sistema' },
  redondeada: { nombre: 'Redondeada', pila: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif', grupo: 'Sistema' },
  inter: { nombre: 'Inter', google: 'Inter', pila: '"Inter", sans-serif', grupo: 'Sin serifa' },
  poppins: { nombre: 'Poppins', google: 'Poppins', pila: '"Poppins", sans-serif', grupo: 'Sin serifa' },
  montserrat: { nombre: 'Montserrat', google: 'Montserrat', pila: '"Montserrat", sans-serif', grupo: 'Sin serifa' },
  'dm-sans': { nombre: 'DM Sans', google: 'DM Sans', pila: '"DM Sans", sans-serif', grupo: 'Sin serifa' },
  manrope: { nombre: 'Manrope', google: 'Manrope', pila: '"Manrope", sans-serif', grupo: 'Sin serifa' },
  outfit: { nombre: 'Outfit', google: 'Outfit', pila: '"Outfit", sans-serif', grupo: 'Sin serifa' },
  'space-grotesk': { nombre: 'Space Grotesk', google: 'Space Grotesk', pila: '"Space Grotesk", sans-serif', grupo: 'Sin serifa' },
  nunito: { nombre: 'Nunito', google: 'Nunito', pila: '"Nunito", sans-serif', grupo: 'Sin serifa' },
  'work-sans': { nombre: 'Work Sans', google: 'Work Sans', pila: '"Work Sans", sans-serif', grupo: 'Sin serifa' },
  playfair: { nombre: 'Playfair Display', google: 'Playfair Display', pila: '"Playfair Display", serif', grupo: 'Con serifa' },
  lora: { nombre: 'Lora', google: 'Lora', pila: '"Lora", serif', grupo: 'Con serifa' },
  cormorant: { nombre: 'Cormorant', google: 'Cormorant Garamond', pila: '"Cormorant Garamond", serif', grupo: 'Con serifa' },
  fraunces: { nombre: 'Fraunces', google: 'Fraunces', pila: '"Fraunces", serif', grupo: 'Con serifa' },
  'dm-serif': { nombre: 'DM Serif Display', google: 'DM Serif Display', pila: '"DM Serif Display", serif', grupo: 'Con serifa' },
  'libre-baskerville': { nombre: 'Libre Baskerville', google: 'Libre Baskerville', pila: '"Libre Baskerville", serif', grupo: 'Con serifa' },
  bebas: { nombre: 'Bebas Neue', google: 'Bebas Neue', pila: '"Bebas Neue", sans-serif', grupo: 'Display' },
  oswald: { nombre: 'Oswald', google: 'Oswald', pila: '"Oswald", sans-serif', grupo: 'Display' },
  'archivo-black': { nombre: 'Archivo Black', google: 'Archivo Black', pila: '"Archivo Black", sans-serif', grupo: 'Display' },
  syne: { nombre: 'Syne', google: 'Syne', pila: '"Syne", sans-serif', grupo: 'Display' },
  pacifico: { nombre: 'Pacifico', google: 'Pacifico', pila: '"Pacifico", cursive', grupo: 'Display' },
}

export const GRUPOS_FUENTES = ['Sistema', 'Sin serifa', 'Con serifa', 'Display'] as const

/** Hoja de Google Fonts con las familias que usa el tema, o null si no hace falta. */
export function urlFuentes(...claves: (string | undefined)[]): string | null {
  const familias = [...new Set(claves.map((clave) => (clave ? FUENTES[clave]?.google : undefined)).filter(Boolean))]
  if (familias.length === 0) return null
  const parametros = familias
    .map((familia) => {
      // Las display de un solo peso no aceptan el rango.
      const unPeso = ['Bebas Neue', 'Archivo Black', 'Pacifico', 'DM Serif Display'].includes(familia!)
      return `family=${familia!.replace(/ /g, '+')}${unPeso ? '' : ':wght@400;500;600;700'}`
    })
    .join('&')
  return `https://fonts.googleapis.com/css2?${parametros}&display=swap`
}
