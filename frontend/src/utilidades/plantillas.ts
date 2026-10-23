import type { Bloque } from '@/tipos/bloques'
import type { AjustesTienda, EnlaceMenu, TemaBase, TemaTienda } from '@/tipos/tienda'
import { generarSlug } from './formato'
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
  /** El tema base, y el color del precio si la plantilla lo trae. */
  tema: TemaBase & Pick<TemaTienda, 'colorPrecio'>
  destacada?: boolean
  /** Columnas de la grilla, para la miniatura. */
  columnas: 2 | 3 | 4
  /** Captura real de una tienda de ejemplo armada con esta plantilla (public/ejemplos). */
  captura: string
  capturaMovil: string
  /** Tienda de ejemplo de la captura. */
  ejemplo: string
  descripcion: string
  /** Encabezado y menú. Los datos de contacto nunca vienen de la plantilla. */
  ajustes?: AjustesTienda
  bloques: (nombreTienda: string) => Bloque[]
}

/** Lo de los ajustes que es diseño: al cambiar de plantilla se reemplaza; el contacto se conserva. */
const CLAVES_DISENO = ['cabecera', 'buscador', 'colorBarra', 'menu', 'botonDestacado'] as const

export function ajustesConPlantilla(actuales: AjustesTienda, plantilla: PlantillaTienda): AjustesTienda {
  const contacto: AjustesTienda = { ...actuales }
  for (const clave of CLAVES_DISENO) delete contacto[clave]
  return { ...contacto, ...plantilla.ajustes }
}

const aCategoria = (texto: string): EnlaceMenu => ({ texto, enlace: `/categoria/${generarSlug(texto)}` })
const categorias = (...nombres: string[]) => nombres.map((nombre) => ({ id: id('cat'), nombre }))

const temaDe = (clave: string) => ESTILOS_PREDEFINIDOS.find((estilo) => estilo.clave === clave)!.tema
const id = (tipo: string) => `${tipo}-${Math.random().toString(36).slice(2, 10)}`
const pie = (nombre: string, extra: Partial<Extract<Bloque, { tipo: 'pie' }>['props']> = {}): Bloque => ({
  id: id('pie'),
  tipo: 'pie',
  props: { texto: `© ${new Date().getFullYear()} ${nombre}`, mostrarRedes: true, ...extra },
})

export const PLANTILLAS_TIENDA: PlantillaTienda[] = [
  {
    clave: 'mercado',
    nombre: 'Mercado y Bebidas',
    categoria: 'Supermercado, licores y despensa',
    plan: 'EMPRENDE',
    estilo: 'mercado',
    tema: {
      colorMarca: '#ffd200',
      colorContraste: '#111111',
      colorFondo: '#ffffff',
      colorTexto: '#1a1a1a',
      fuenteTitulos: 'moderna',
      radio: '0.5rem',
      colorPrecio: '#e11d2a',
    },
    destacada: true,
    columnas: 4,
    captura: '/ejemplos/mercado-la-sabana.webp',
    capturaMovil: '/ejemplos/mercado-la-sabana-movil.webp',
    ejemplo: 'Mercado La Sabana',
    descripcion:
      'Como un supermercado en línea: buscador grande, barra negra con menú y WhatsApp, banners que pasan solos, categorías con foto y precios en rojo.',
    ajustes: {
      cabecera: 'completa',
      buscador: true,
      colorBarra: '#111111',
      menu: [aCategoria('Jugos'), aCategoria('Cervezas'), aCategoria('Vinos'), { texto: 'Ofertas', enlace: '/buscar' }],
      botonDestacado: { texto: 'Tienda en línea', enlace: '/buscar' },
    },
    bloques: (nombre) => [
      {
        id: id('carrusel'),
        tipo: 'carrusel',
        props: {
          intervalo: 5,
          alto: 'medio',
          diapositivas: [
            { id: id('d'), titulo: 'Todo para tu mercado', subtitulo: `Pide en ${nombre} y recibe hoy mismo en tu casa.`, textoBoton: 'Comprar ahora', enlaceBoton: '/buscar' },
            { id: id('d'), titulo: 'Jugos naturales', subtitulo: 'Recién hechos, sin azúcar añadida.', textoBoton: 'Ver jugos', enlaceBoton: '/categoria/jugos' },
            { id: id('d'), titulo: 'Fin de semana de vinos', subtitulo: 'Lleva dos y el segundo va con 20% menos.', textoBoton: 'Ver vinos', enlaceBoton: '/categoria/vinos' },
          ],
        },
      },
      { id: id('categorias'), tipo: 'categorias', props: { titulo: 'Categorías', items: categorias('Jugos', 'Cervezas', 'Vinos') } },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Productos destacados', limite: 10, columnas: 5, estilo: 'tarjeta' } },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Jugos naturales', limite: 5, columnas: 5, estilo: 'tarjeta', categoria: 'Jugos' } },
      pie(nombre),
    ],
  },
  {
    clave: 'vivero',
    nombre: 'Vivero y Jardín',
    categoria: 'Plantas, materas y jardinería',
    plan: 'EMPRENDE',
    estilo: 'vivero',
    tema: {
      colorMarca: '#2f6b3f',
      colorContraste: '#ffffff',
      colorFondo: '#f6f8f3',
      colorTexto: '#1d2b20',
      fuenteTitulos: 'redondeada',
      radio: '1rem',
    },
    columnas: 4,
    captura: '/ejemplos/verde-morichal.webp',
    capturaMovil: '/ejemplos/verde-morichal-movil.webp',
    ejemplo: 'Verde Morichal',
    descripcion:
      'Verde y cercana: cabecera con menú por tipo de planta, banners de temporada, categorías con foto y un bloque de cuidados para dar confianza.',
    ajustes: {
      cabecera: 'completa',
      buscador: true,
      colorBarra: '#1f3d2b',
      menu: [aCategoria('Interior'), aCategoria('Suculentas'), aCategoria('Flores'), aCategoria('Jardinería')],
      botonDestacado: { texto: 'Ver todas', enlace: '/buscar' },
    },
    bloques: (nombre) => [
      {
        id: id('carrusel'),
        tipo: 'carrusel',
        props: {
          intervalo: 6,
          alto: 'medio',
          diapositivas: [
            { id: id('d'), titulo: 'Llena tu casa de verde', subtitulo: 'Plantas de interior fáciles de cuidar, listas para regalar.', textoBoton: 'Ver plantas', enlaceBoton: '/categoria/interior' },
            { id: id('d'), titulo: 'Suculentas desde $25.000', subtitulo: 'Poca agua, mucha luz y cero complicaciones.', textoBoton: 'Ver suculentas', enlaceBoton: '/categoria/suculentas' },
            { id: id('d'), titulo: 'Flores para cada ocasión', subtitulo: `Arreglos de ${nombre} con entrega el mismo día.`, textoBoton: 'Ver flores', enlaceBoton: '/categoria/flores' },
          ],
        },
      },
      { id: id('categorias'), tipo: 'categorias', props: { titulo: 'Categorías', items: categorias('Interior', 'Suculentas', 'Flores', 'Jardinería') } },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Las más pedidas', limite: 8, columnas: 4, estilo: 'tarjeta' } },
      {
        id: id('imagen-texto'),
        tipo: 'imagen-texto',
        props: {
          titulo: 'Te enseñamos a cuidarlas',
          contenido: 'Cada planta sale con su guía de riego y luz. Si tienes dudas después de la compra, escríbenos por WhatsApp y te ayudamos.',
          lado: 'izquierda',
          textoBoton: 'Escríbenos',
          enlaceBoton: '#',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'megadeporte',
    nombre: 'Megatienda Deportiva',
    categoria: 'Deporte, fitness y accesorios',
    plan: 'NEGOCIO',
    estilo: 'megadeporte',
    tema: {
      colorMarca: '#ff5a1f',
      colorContraste: '#ffffff',
      colorFondo: '#ffffff',
      colorTexto: '#0b1f3a',
      fuenteTitulos: 'moderna',
      radio: '0.25rem',
    },
    columnas: 4,
    captura: '/ejemplos/zona-fit.webp',
    capturaMovil: '/ejemplos/zona-fit-movil.webp',
    ejemplo: 'Zona Fit',
    descripcion:
      'Para catálogos grandes: anuncio arriba, cuatro banners, menú por categoría, vitrinas en cinco columnas por categoría y precios destacados.',
    ajustes: {
      cabecera: 'completa',
      buscador: true,
      colorBarra: '#0b1f3a',
      menu: [aCategoria('Yoga y pilates'), aCategoria('Entrenamiento'), aCategoria('Morrales'), aCategoria('Relojes'), { texto: 'Ofertas', enlace: '/buscar' }],
      botonDestacado: { texto: 'Ver catálogo', enlace: '/buscar' },
    },
    bloques: (nombre) => [
      { id: id('anuncio'), tipo: 'anuncio', props: { texto: 'Envío gratis a toda Colombia en compras desde $200.000' } },
      {
        id: id('carrusel'),
        tipo: 'carrusel',
        props: {
          intervalo: 5,
          alto: 'alto',
          diapositivas: [
            { id: id('d'), titulo: 'Entrena a tu ritmo', subtitulo: `Todo para tu rutina en ${nombre}, con envío a todo el país.`, textoBoton: 'Ver entrenamiento', enlaceBoton: '/categoria/entrenamiento' },
            { id: id('d'), titulo: 'Semana del yoga', subtitulo: 'Tapetes, bloques y bandas con hasta 25% menos.', textoBoton: 'Ver yoga', enlaceBoton: '/categoria/yoga-y-pilates' },
            { id: id('d'), titulo: 'Listos para la ruta', subtitulo: 'Morrales y relojes para cada aventura.', textoBoton: 'Ver morrales', enlaceBoton: '/categoria/morrales' },
            { id: id('d'), titulo: 'Mide cada paso', subtitulo: 'Relojes deportivos con cronómetro y alarma.', textoBoton: 'Ver relojes', enlaceBoton: '/categoria/relojes' },
          ],
        },
      },
      { id: id('categorias'), tipo: 'categorias', props: { titulo: 'Compra por categoría', items: categorias('Yoga y pilates', 'Entrenamiento', 'Morrales', 'Relojes') } },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Lo más vendido', limite: 10, columnas: 5, estilo: 'tarjeta' } },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Yoga y pilates', limite: 5, columnas: 5, estilo: 'tarjeta', categoria: 'Yoga y pilates' } },
      { id: id('grilla'), tipo: 'grilla-productos', props: { titulo: 'Relojes', limite: 5, columnas: 5, estilo: 'tarjeta', categoria: 'Relojes' } },
      pie(nombre),
    ],
  },
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
  }
]
