import type { Bloque } from '@/tipos/bloques'
import type { TemaTienda } from '@/tipos/tienda'
import type { Plan } from './planes'
import { ESTILOS_PREDEFINIDOS } from './tema'

/**
 * Plantillas listas: un tema y un juego de secciones con textos de ejemplo.
 * Aplicar una reemplaza el diseño de la tienda (no toca los productos).
 *
 * Las de Gratis usan uno de los estilos predefinidos y sólo secciones del plan
 * Gratis, porque el backend no deja guardar más que eso en ese plan
 * (backend/src/utilidades/planes.ts). Las demás usan tema propio.
 */

export interface PlantillaTienda {
  clave: string
  nombre: string
  categoria: string
  plan: Plan
  /** Valor que se guarda en Tienda.plantilla: un estilo predefinido o la clave propia. */
  estilo: string
  tema: Required<TemaTienda>
  destacada?: boolean
  /** Columnas de la grilla, para la miniatura. */
  columnas: 2 | 3 | 4
  bloques: (nombreTienda: string) => Bloque[]
}

const temaDe = (clave: string) => ESTILOS_PREDEFINIDOS.find((estilo) => estilo.clave === clave)!.tema
const id = (tipo: string) => `${tipo}-${Math.random().toString(36).slice(2, 10)}`
const pie = (nombre: string, extra: Partial<Extract<Bloque, { tipo: 'pie' }>['props']> = {}): Bloque => ({
  id: id('pie'),
  tipo: 'pie',
  props: { texto: `© ${new Date().getFullYear()} ${nombre}`, mostrarRedes: true, ...extra },
})

export const PLANTILLAS_TIENDA: PlantillaTienda[] = [
  {
    clave: 'cafe',
    nombre: 'Café y Antojos',
    categoria: 'Alimentos y bebidas',
    plan: 'GRATIS',
    estilo: 'calida',
    tema: temaDe('calida'),
    columnas: 3,
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Café de origen, recién tostado',
          subtitulo: `En ${nombre} tostamos cada semana y te lo llevamos a la puerta.`,
          textoBoton: 'Pedir ahora',
          enlaceBoton: '#productos',
          alineacion: 'centro',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Nuestros cafés', limite: 6, columnas: 3 } },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Del cultivo a tu taza',
          contenido:
            'Compramos directo a fincas de la región y tostamos en lotes pequeños. Así cada bolsa llega fresca y quien cultiva recibe un pago justo.',
          alineacion: 'centro',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'artesania',
    nombre: 'Artesanía Colombiana',
    categoria: 'Hecho a mano',
    plan: 'GRATIS',
    estilo: 'fresca',
    tema: temaDe('fresca'),
    columnas: 2,
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Hecho a mano, con historia',
          subtitulo: 'Piezas únicas de artesanos colombianos. Ninguna es igual a otra.',
          textoBoton: 'Ver la colección',
          enlaceBoton: '#productos',
          alineacion: 'izquierda',
        },
      },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Quiénes tejen',
          contenido: `Detrás de ${nombre} hay familias que han pasado el oficio de generación en generación. Cada compra sostiene ese trabajo.`,
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'La colección', limite: 8, columnas: 2 } },
      pie(nombre),
    ],
  },
  {
    clave: 'moda',
    nombre: 'Colección de Moda',
    categoria: 'Ropa y accesorios',
    plan: 'EMPRENDE',
    estilo: 'moda',
    tema: {
      colorMarca: '#111111',
      colorContraste: '#ffffff',
      colorFondo: '#ffffff',
      colorTexto: '#111111',
      fuenteTitulos: 'clasica',
      radio: '0rem',
    },
    destacada: true,
    columnas: 4,
    bloques: (nombre) => [
      { id: id('anuncio'), tipo: 'anuncio', props: { texto: 'Envío gratis en compras desde $150.000' } },
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Nueva colección',
          subtitulo: 'Prendas pensadas para durar, en cantidades limitadas.',
          textoBoton: 'Comprar ahora',
          enlaceBoton: '#productos',
          alineacion: 'izquierda',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Lo más nuevo', limite: 8, columnas: 4 } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Diseñado aquí',
          contenido: `Cada prenda de ${nombre} se diseña y se confecciona en Colombia, con telas elegidas una por una.`,
          lado: 'derecha',
          textoBoton: 'Conocer la marca',
          enlaceBoton: '#productos',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'hogar',
    nombre: 'Hogar & Estilo de Vida',
    categoria: 'Decoración',
    plan: 'EMPRENDE',
    estilo: 'hogar',
    tema: {
      colorMarca: '#7c5a3a',
      colorContraste: '#ffffff',
      colorFondo: '#f6f1ea',
      colorTexto: '#2b2620',
      fuenteTitulos: 'clasica',
      radio: '0.75rem',
    },
    columnas: 3,
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Tu casa, más tuya',
          subtitulo: 'Objetos para el día a día, hechos para quedarse.',
          textoBoton: 'Explorar',
          enlaceBoton: '#productos',
          alineacion: 'centro',
        },
      },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Menos, pero mejor',
          contenido: `En ${nombre} elegimos pocas piezas y las elegimos bien: materiales nobles y diseño que no pasa de moda.`,
          lado: 'izquierda',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Para cada espacio', limite: 9, columnas: 3 } },
      pie(nombre),
    ],
  },
  {
    clave: 'belleza',
    nombre: 'Belleza y Cuidado',
    categoria: 'Cosmética',
    plan: 'EMPRENDE',
    estilo: 'belleza',
    tema: {
      colorMarca: '#be185d',
      colorContraste: '#ffffff',
      colorFondo: '#fff7f9',
      colorTexto: '#3b1424',
      fuenteTitulos: 'redondeada',
      radio: '1.25rem',
    },
    columnas: 3,
    bloques: (nombre) => [
      { id: id('anuncio'), tipo: 'anuncio', props: { texto: '2x1 en toda la línea de cuidado facial' } },
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Cuida tu piel, a tu ritmo',
          subtitulo: 'Fórmulas suaves, ingredientes que puedes leer.',
          textoBoton: 'Ver productos',
          enlaceBoton: '#productos',
          alineacion: 'centro',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Favoritos', limite: 6, columnas: 3 } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Sin crueldad animal',
          contenido: `Ningún producto de ${nombre} se prueba en animales. Lo decimos con orgullo y con certificado.`,
          lado: 'derecha',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'tecnologia',
    nombre: 'Tecnología & Gadgets',
    categoria: 'Electrónica',
    plan: 'NEGOCIO',
    estilo: 'tecnologia',
    tema: {
      colorMarca: '#3b60ff',
      colorContraste: '#ffffff',
      colorFondo: '#0b0b0c',
      colorTexto: '#f5f5f5',
      fuenteTitulos: 'moderna',
      radio: '0.5rem',
    },
    columnas: 4,
    bloques: (nombre) => [
      { id: id('anuncio'), tipo: 'anuncio', props: { texto: 'Garantía de 12 meses en todos los equipos' } },
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Lo último, al mejor precio',
          subtitulo: `Equipos originales con factura y garantía. Envío en 24 horas con ${nombre}.`,
          textoBoton: 'Ver ofertas',
          enlaceBoton: '#productos',
          alineacion: 'izquierda',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Más vendidos', limite: 8, columnas: 4 } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Soporte de verdad',
          contenido: 'Si algo falla, te respondemos por WhatsApp el mismo día. Sin formularios eternos.',
          lado: 'izquierda',
          textoBoton: 'Escríbenos',
          enlaceBoton: '#',
        },
      },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Paga como prefieras',
          contenido: 'Tarjeta, PSE o contraentrega en las principales ciudades.',
          alineacion: 'centro',
        },
      },
      pie(nombre),
    ],
  },
]
