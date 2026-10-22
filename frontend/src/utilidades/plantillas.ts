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
  /** Captura real de una tienda de ejemplo armada con esta plantilla (public/ejemplos). */
  captura: string
  capturaMovil: string
  /** Tienda de ejemplo de la captura. */
  ejemplo: string
  descripcion: string
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
    clave: 'deporte',
    nombre: 'Deporte y Aire Libre',
    categoria: 'Bicicletas, camping y equipos',
    plan: 'GRATIS',
    estilo: 'fresca',
    tema: temaDe('fresca'),
    columnas: 3,
    captura: '/ejemplos/ruta-libre.webp',
    capturaMovil: '/ejemplos/ruta-libre-movil.webp',
    ejemplo: 'Ruta Libre',
    descripcion: 'Portada con foto a lo ancho, catálogo en tres columnas y un bloque de asesoría. Pensada para equipos deportivos y aire libre.',
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Equipo para salir a rodar',
          subtitulo: `En ${nombre} encuentras bicicletas, camping y todo para entrenar, con envío a toda Colombia.`,
          textoBoton: 'Ver equipo',
          enlaceBoton: '#productos',
          alineacion: 'izquierda',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Lo más pedido', limite: 6, columnas: 3 } },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Asesoría de verdad',
          contenido: 'Antes de comprar te ayudamos a elegir la talla y el equipo que de verdad necesitas. Escríbenos sin compromiso.',
          alineacion: 'centro',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'artesania',
    nombre: 'Artesanía y Cerámica',
    categoria: 'Hecho a mano',
    plan: 'GRATIS',
    estilo: 'calida',
    tema: temaDe('calida'),
    columnas: 3,
    captura: '/ejemplos/barro-vivo.webp',
    capturaMovil: '/ejemplos/barro-vivo-movil.webp',
    ejemplo: 'Barro Vivo',
    descripcion: 'Cálida y centrada, con letra clásica. Ideal para piezas hechas a mano donde cada foto cuenta la historia.',
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Piezas hechas a mano, una por una',
          subtitulo: 'Cerámica y decoración de taller. Ninguna es igual a otra.',
          textoBoton: 'Ver la colección',
          enlaceBoton: '#productos',
          alineacion: 'centro',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'La colección', limite: 6, columnas: 3 } },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Desde el taller',
          contenido: `En ${nombre} moldeamos, horneamos y esmaltamos cada pieza en pequeños lotes. Por eso cada una tiene sus propias marcas.`,
          alineacion: 'centro',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'moda',
    nombre: 'Moda y Tejidos',
    categoria: 'Ropa y accesorios',
    plan: 'EMPRENDE',
    estilo: 'moda',
    tema: {
      colorMarca: '#1c1917',
      colorContraste: '#ffffff',
      colorFondo: '#f7f4ef',
      colorTexto: '#1c1917',
      fuenteTitulos: 'clasica',
      radio: '0rem',
    },
    destacada: true,
    columnas: 4,
    captura: '/ejemplos/lana-andina.webp',
    capturaMovil: '/ejemplos/lana-andina-movil.webp',
    ejemplo: 'Lana Andina',
    descripcion: 'Editorial y sobria: barra de anuncio, portada de campaña, catálogo en cuatro columnas e historia de marca con foto.',
    bloques: (nombre) => [
      { id: id('anuncio'), tipo: 'anuncio', props: { texto: 'Envío gratis en compras desde $150.000' } },
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Tejido para el frío de verdad',
          subtitulo: 'Suéteres de lana tejidos en Colombia, en cantidades limitadas.',
          textoBoton: 'Ver colección',
          enlaceBoton: '#productos',
          alineacion: 'izquierda',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Nueva temporada', limite: 8, columnas: 4 } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'De la oveja al suéter',
          contenido: `Cada prenda de ${nombre} empieza en una finca de la sabana y termina en manos de tejedoras que llevan años en el oficio.`,
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
    nombre: 'Hogar y Decoración',
    categoria: 'Muebles y plantas',
    plan: 'EMPRENDE',
    estilo: 'hogar',
    tema: {
      colorMarca: '#4a3b2a',
      colorContraste: '#ffffff',
      colorFondo: '#f5f2ec',
      colorTexto: '#26211b',
      fuenteTitulos: 'clasica',
      radio: '0.5rem',
    },
    columnas: 3,
    captura: '/ejemplos/casa-morichal.webp',
    capturaMovil: '/ejemplos/casa-morichal-movil.webp',
    ejemplo: 'Casa Morichal',
    descripcion: 'Tonos tierra y letra clásica para muebles y decoración. Portada amplia, catálogo por espacios y una sección de marca.',
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Tu casa, más tuya',
          subtitulo: 'Muebles y objetos para el día a día, hechos para quedarse.',
          textoBoton: 'Explorar',
          enlaceBoton: '#productos',
          alineacion: 'izquierda',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Para cada espacio', limite: 9, columnas: 3 } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Menos, pero mejor',
          contenido: `En ${nombre} elegimos pocas piezas y las elegimos bien: maderas nobles, telas resistentes y diseño que no pasa de moda.`,
          lado: 'izquierda',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'calzado',
    nombre: 'Tenis y Calzado',
    categoria: 'Calzado deportivo',
    plan: 'EMPRENDE',
    estilo: 'calzado',
    tema: {
      colorMarca: '#ff4f1f',
      colorContraste: '#ffffff',
      colorFondo: '#ffffff',
      colorTexto: '#111111',
      fuenteTitulos: 'moderna',
      radio: '1.25rem',
    },
    columnas: 3,
    captura: '/ejemplos/paso-urbano.webp',
    capturaMovil: '/ejemplos/paso-urbano-movil.webp',
    ejemplo: 'Paso Urbano',
    descripcion: 'Directa y llamativa, con el color de tu marca en botones y anuncio. Hecha para lanzar modelos y moverlos rápido.',
    bloques: (nombre) => [
      { id: id('anuncio'), tipo: 'anuncio', props: { texto: 'Cambios gratis durante 30 días' } },
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Corre más liviano',
          subtitulo: 'Tenis originales para correr y para la calle, con envío en 48 horas.',
          textoBoton: 'Comprar ahora',
          enlaceBoton: '#productos',
          alineacion: 'centro',
        },
      },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Más vendidos', limite: 6, columnas: 3 } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Clásicos que no fallan',
          contenido: `En ${nombre} seleccionamos los modelos que aguantan el uso diario y se ven bien con todo.`,
          lado: 'derecha',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'tecnologia',
    nombre: 'Tecnología y Fotografía',
    categoria: 'Electrónica',
    plan: 'NEGOCIO',
    estilo: 'tecnologia',
    tema: {
      colorMarca: '#ffffff',
      colorContraste: '#000000',
      colorFondo: '#0b0b0c',
      colorTexto: '#f5f5f5',
      fuenteTitulos: 'moderna',
      radio: '0.75rem',
    },
    columnas: 4,
    captura: '/ejemplos/orbita.webp',
    capturaMovil: '/ejemplos/orbita-movil.webp',
    ejemplo: 'Órbita',
    descripcion: 'Fondo oscuro para que los productos brillen. Catálogo en cuatro columnas, garantía arriba y soporte a la vista.',
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
          titulo: 'Para los que crean',
          contenido: 'Cámaras, lentes y equipos para fotógrafos y creadores. Si algo falla, te respondemos por WhatsApp el mismo día.',
          lado: 'izquierda',
          textoBoton: 'Escríbenos',
          enlaceBoton: '#',
        },
      },
      pie(nombre),
    ],
  },
]
