import type { Bloque, EnlaceBio } from '@/tipos/bloques'
import type { EsquemaColor } from '@/tipos/tienda'
import type { PlantillaTienda } from './plantillas'
import { ESTILOS_PREDEFINIDOS } from './tema'

/**
 * Plantillas de los enlaces para tu bio: el perfil, los botones y, según el
 * oficio, algo más que se lea bien en el celular (horario, carta, preguntas).
 *
 * Las de Gratis usan un estilo predefinido; las demás, tema propio y un fondo
 * con degradado o malla de color (ajustes.fondoBio), por eso van desde Emprende.
 * Los enlaces de redes van sin dirección: toman las de Contacto y redes.
 */

const temaDe = (clave: string) => ESTILOS_PREDEFINIDOS.find((estilo) => estilo.clave === clave)!.tema
const id = (tipo: string) => `${tipo}-${Math.random().toString(36).slice(2, 10)}`
const enlace = (texto: string, icono: string, extra: Partial<EnlaceBio> = {}): EnlaceBio => ({ id: id('l'), texto, url: '', icono, ...extra })
const perfil = (bio: string, forma: 'circulo' | 'redondeada' = 'circulo'): Bloque => ({
  id: id('perfil'),
  tipo: 'perfil',
  props: { bio, forma, mostrarRedes: true },
})

type Tono = Omit<EsquemaColor, 'id' | 'nombre'>
const esquemas = (principal: Tono, marca: Tono): EsquemaColor[] => [
  { id: 'e1', nombre: 'Principal', ...principal },
  { id: 'e4', nombre: 'Marca', ...marca },
]

export const PLANTILLAS_ENLACES: PlantillaTienda[] = [
  {
    clave: 'bio-minimal',
    nombre: 'Minimal',
    categoria: 'Creadores de contenido y marca personal',
    plan: 'GRATIS',
    estilo: 'clasica',
    tema: temaDe('clasica'),
    columnas: 2,
    captura: '/ejemplos/valentina-rey.webp',
    capturaMovil: '/ejemplos/valentina-rey-movil.webp',
    ejemplo: 'Valentina Rey',
    descripcion: 'Blanca y directa, para que tus enlaces sean lo único que se vea: perfil, redes y botones negros a lo ancho.',
    ajustes: { fondoBio: 'liso' },
    bloques: () => [
      perfil('Creadora de contenido en Villavicencio. Viajes, comida y planes en el Llano.'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            enlace('Mi guía del Llano en 3 días', 'libro', { url: 'valentinarey.co/guia', destacado: true, descripcion: 'Gratis, en PDF' }),
            enlace('Último video en YouTube', 'youtube', { url: 'youtube.com/@valentinarey' }),
            enlace('Mi TikTok', 'tiktok'),
            enlace('Trabajemos juntos', 'correo', { url: 'hola@valentinarey.co', descripcion: 'Marcas y colaboraciones' }),
            enlace('Escríbeme por WhatsApp', 'whatsapp'),
          ],
        },
      },
    ],
  },
  {
    clave: 'bio-nocturna',
    nombre: 'Nocturna',
    categoria: 'DJs, músicos y eventos',
    plan: 'GRATIS',
    estilo: 'nocturna',
    tema: temaDe('nocturna'),
    columnas: 2,
    captura: '/ejemplos/dj-sabanero.webp',
    capturaMovil: '/ejemplos/dj-sabanero-movil.webp',
    ejemplo: 'DJ Sabanero',
    descripcion: 'Fondo negro y botones con borde blanco: tu música, las fechas de tus toques y cómo contratarte.',
    ajustes: { fondoBio: 'liso' },
    bloques: () => [
      perfil('Reguetón, electrónica y joropo remix. Bodas, discotecas y festivales.'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'contorno',
          items: [
            enlace('Escucha mi último set', 'musica', { url: 'soundcloud.com/djsabanero', destacado: true }),
            enlace('Spotify', 'musica', { url: 'open.spotify.com/artist/djsabanero' }),
            enlace('Mis toques de este mes', 'calendario', { url: 'djsabanero.co/fechas' }),
            enlace('Contrátame para tu evento', 'whatsapp', { descripcion: 'Bodas, quinces y empresas' }),
            enlace('Instagram', 'instagram'),
          ],
        },
      },
    ],
  },
  {
    clave: 'bio-reposteria',
    nombre: 'Antojo',
    categoria: 'Emprendimientos que venden por Instagram',
    plan: 'EMPRENDE',
    estilo: 'bio-reposteria',
    tema: {
      colorMarca: '#d6457a',
      colorContraste: '#ffffff',
      colorFondo: '#fff4f1',
      colorTexto: '#4a2433',
      fuenteTitulos: 'pacifico',
      fuenteCuerpo: 'poppins',
      radio: '1.25rem',
      pesoTitulos: 'normal',
      botonForma: 'pildora',
      animarSecciones: true,
      esquemas: esquemas(
        { fondo: '#fff4f1', texto: '#4a2433', marca: '#d6457a', contraste: '#ffffff' },
        { fondo: '#d6457a', texto: '#ffffff', marca: '#ffffff', contraste: '#d6457a' },
      ),
    },
    columnas: 2,
    captura: '/ejemplos/dulce-antojo.webp',
    capturaMovil: '/ejemplos/dulce-antojo-movil.webp',
    ejemplo: 'Dulce Antojo',
    descripcion: 'Dulce y en rosa, con letra de pincel y fondo degradado: pedidos por WhatsApp, el catálogo, los domicilios y el horario.',
    ajustes: { fondoBio: 'degradado' },
    bloques: () => [
      perfil('Tortas, postres y cajas de regalo hechas en casa. Domicilios en Villavicencio.'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            enlace('Haz tu pedido por WhatsApp', 'whatsapp', { destacado: true, descripcion: 'Con 24 horas de anticipación' }),
            enlace('Mira el catálogo y los precios', 'bolsa', { url: 'dulceantojo.co/catalogo' }),
            enlace('Cajas de regalo para fechas especiales', 'regalo', { url: 'dulceantojo.co/regalos' }),
            enlace('Síguenos en Instagram', 'instagram'),
          ],
        },
      },
      {
        id: id('horario'),
        tipo: 'horario',
        props: {
          titulo: 'Horario de pedidos',
          dias: [
            { id: 'h1', dia: 'Martes a sábado', horas: '9:00 a. m. a 6:00 p. m.' },
            { id: 'h2', dia: 'Domingos', horas: 'Solo entregas' },
          ],
          nota: 'Domicilio gratis desde $80.000.',
        },
      },
    ],
  },
  {
    clave: 'bio-artista',
    nombre: 'Tarima',
    categoria: 'Cantantes, artistas y agrupaciones',
    plan: 'EMPRENDE',
    estilo: 'bio-artista',
    tema: {
      colorMarca: '#e8b04a',
      colorContraste: '#1a0f0a',
      colorFondo: '#1a0f0a',
      colorTexto: '#f6ead8',
      fuenteTitulos: 'bebas',
      fuenteCuerpo: 'dm-sans',
      radio: '0.25rem',
      pesoTitulos: 'normal',
      titulosMayusculas: true,
      botonForma: 'recto',
      botonMayusculas: true,
      animarSecciones: true,
      esquemas: esquemas(
        { fondo: '#1a0f0a', texto: '#f6ead8', marca: '#e8b04a', contraste: '#1a0f0a' },
        { fondo: '#e8b04a', texto: '#1a0f0a', marca: '#1a0f0a', contraste: '#e8b04a' },
      ),
    },
    columnas: 2,
    captura: '/ejemplos/yuli-ariza.webp',
    capturaMovil: '/ejemplos/yuli-ariza-movil.webp',
    ejemplo: 'Yuli Ariza',
    descripcion: 'Oscura y dorada, con letra de cartel: el lanzamiento destacado, tus plataformas, la gira y la contratación.',
    ajustes: { fondoBio: 'malla' },
    bloques: () => [
      perfil('Voz recia del Llano. Ganadora del Torneo Internacional del Joropo.', 'redondeada'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            enlace('Nuevo sencillo: «Garza Morena»', 'musica', { url: 'yuliariza.co/garza-morena', destacado: true, descripcion: 'Ya en todas las plataformas' }),
            enlace('Mírame en YouTube', 'youtube', { url: 'youtube.com/@yuliariza' }),
          ],
        },
      },
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          titulo: 'Gira y contratación',
          estilo: 'contorno',
          items: [
            enlace('Fechas de la gira 2026', 'calendario', { url: 'yuliariza.co/gira' }),
            enlace('Contrataciones', 'whatsapp', { descripcion: 'Festivales, ferias y eventos privados' }),
            enlace('Prensa y fotos', 'descarga', { url: 'yuliariza.co/prensa' }),
          ],
        },
      },
    ],
  },
  {
    clave: 'bio-coach',
    nombre: 'Energía',
    categoria: 'Entrenadores, nutricionistas y coaches',
    plan: 'EMPRENDE',
    estilo: 'bio-coach',
    tema: {
      colorMarca: '#2f5bff',
      colorContraste: '#ffffff',
      colorFondo: '#f2f5ff',
      colorTexto: '#0d1530',
      fuenteTitulos: 'archivo-black',
      fuenteCuerpo: 'inter',
      radio: '0.75rem',
      pesoTitulos: 'normal',
      botonForma: 'suave',
      animarSecciones: true,
      esquemas: esquemas(
        { fondo: '#f2f5ff', texto: '#0d1530', marca: '#2f5bff', contraste: '#ffffff' },
        { fondo: '#2f5bff', texto: '#ffffff', marca: '#ffffff', contraste: '#2f5bff' },
      ),
    },
    columnas: 2,
    captura: '/ejemplos/coach-mateo.webp',
    capturaMovil: '/ejemplos/coach-mateo-movil.webp',
    ejemplo: 'Coach Mateo',
    descripcion: 'Enérgica, en azul eléctrico y letra pesada: el reto del mes, tus planes con precio y cómo empezar hoy.',
    ajustes: { fondoBio: 'degradado' },
    bloques: () => [
      perfil('Entrenador personal y nutrición deportiva. +300 alumnos en línea.'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            enlace('Únete al reto de 21 días', 'rayo', { url: 'coachmateo.co/reto', destacado: true, descripcion: 'Empieza el lunes' }),
            enlace('Rutinas gratis en YouTube', 'youtube', { url: 'youtube.com/@coachmateo' }),
            enlace('Agenda tu valoración', 'whatsapp'),
          ],
        },
      },
      {
        id: id('servicios'),
        tipo: 'servicios',
        props: {
          titulo: 'Planes',
          disposicion: 'lista',
          items: [
            { id: 's1', nombre: 'Plan en línea', descripcion: 'Rutina y alimentación por app, con chequeo semanal.', precio: '$120.000 / mes' },
            { id: 's2', nombre: 'Personalizado', descripcion: '12 sesiones presenciales en el gimnasio.', precio: '$480.000' },
          ],
        },
      },
    ],
  },
  {
    clave: 'bio-restaurante',
    nombre: 'Sazón',
    categoria: 'Restaurantes, asaderos y comidas rápidas',
    plan: 'EMPRENDE',
    estilo: 'bio-restaurante',
    tema: {
      colorMarca: '#c2410c',
      colorContraste: '#ffffff',
      colorFondo: '#fbf3e6',
      colorTexto: '#2d1a0e',
      fuenteTitulos: 'oswald',
      fuenteCuerpo: 'work-sans',
      radio: '0.5rem',
      pesoTitulos: 'medio',
      titulosMayusculas: true,
      botonForma: 'suave',
      animarSecciones: true,
      esquemas: esquemas(
        { fondo: '#fbf3e6', texto: '#2d1a0e', marca: '#c2410c', contraste: '#ffffff' },
        { fondo: '#c2410c', texto: '#ffffff', marca: '#ffffff', contraste: '#c2410c' },
      ),
    },
    columnas: 2,
    captura: '/ejemplos/asadero-la-brasa.webp',
    capturaMovil: '/ejemplos/asadero-la-brasa-movil.webp',
    ejemplo: 'Asadero La Brasa',
    descripcion: 'Cálida y con hambre: pedir a domicilio, la carta, reservar mesa, el horario y cómo llegar, todo en un link.',
    ajustes: { fondoBio: 'malla' },
    bloques: () => [
      perfil('Carne a la llanera, mamona y pollo al carbón desde 1998.', 'redondeada'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            enlace('Pide a domicilio', 'whatsapp', { destacado: true, descripcion: 'Llega caliente en 40 minutos' }),
            enlace('Ver la carta', 'libro', { url: 'asaderolabrasa.co/carta' }),
            enlace('Reserva tu mesa', 'calendario', { url: 'asaderolabrasa.co/reservas' }),
            enlace('Cómo llegar', 'ubicacion', { url: 'maps.google.com/?q=Asadero+La+Brasa+Villavicencio' }),
          ],
        },
      },
      {
        id: id('horario'),
        tipo: 'horario',
        props: {
          titulo: 'Horario',
          dias: [
            { id: 'h1', dia: 'Lunes a jueves', horas: '11:00 a. m. a 9:00 p. m.' },
            { id: 'h2', dia: 'Viernes a domingo', horas: '11:00 a. m. a 11:00 p. m.' },
          ],
        },
      },
    ],
  },
  {
    clave: 'bio-fotografia',
    nombre: 'Lente',
    categoria: 'Fotógrafos, diseñadores y portafolios',
    plan: 'EMPRENDE',
    estilo: 'bio-fotografia',
    tema: {
      colorMarca: '#2b2b2b',
      colorContraste: '#f3efe8',
      colorFondo: '#f3efe8',
      colorTexto: '#2b2b2b',
      fuenteTitulos: 'cormorant',
      fuenteCuerpo: 'manrope',
      radio: '0rem',
      pesoTitulos: 'medio',
      botonForma: 'recto',
      botonEstilo: 'contorno',
      botonMayusculas: true,
      animarSecciones: true,
      esquemas: esquemas(
        { fondo: '#f3efe8', texto: '#2b2b2b', marca: '#2b2b2b', contraste: '#f3efe8' },
        { fondo: '#2b2b2b', texto: '#f3efe8', marca: '#f3efe8', contraste: '#2b2b2b' },
      ),
    },
    columnas: 2,
    captura: '/ejemplos/sara-lente.webp',
    capturaMovil: '/ejemplos/sara-lente-movil.webp',
    ejemplo: 'Sara Lente',
    descripcion: 'Editorial y en tonos arena, con letra fina y botones de contorno: portafolio, paquetes, disponibilidad y preguntas.',
    ajustes: { fondoBio: 'liso' },
    bloques: () => [
      perfil('Fotografía de bodas y retratos con luz natural. Llano y Bogotá.'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'contorno',
          items: [
            enlace('Portafolio de bodas', 'web', { url: 'saralente.co/bodas', destacado: true }),
            enlace('Retratos y familias', 'web', { url: 'saralente.co/retratos' }),
            enlace('Paquetes y precios', 'etiqueta', { url: 'saralente.co/paquetes' }),
            enlace('Consulta mi disponibilidad', 'whatsapp'),
          ],
        },
      },
      {
        id: id('preguntas'),
        tipo: 'preguntas',
        props: {
          titulo: 'Preguntas',
          items: [
            { id: 'q1', pregunta: '¿Con cuánto tiempo separo la fecha?', respuesta: 'Para bodas, entre seis meses y un año. Con el 30% queda reservada.' },
            { id: 'q2', pregunta: '¿Cuándo entregas las fotos?', respuesta: 'Una galería en línea en tres semanas, con todas editadas.' },
          ],
        },
      },
    ],
  },
  {
    clave: 'bio-podcast',
    nombre: 'Al aire',
    categoria: 'Podcasts, emisoras y medios',
    plan: 'EMPRENDE',
    estilo: 'bio-podcast',
    tema: {
      colorMarca: '#7c3aed',
      colorContraste: '#ffffff',
      colorFondo: '#120b24',
      colorTexto: '#efeaff',
      fuenteTitulos: 'syne',
      fuenteCuerpo: 'dm-sans',
      radio: '1.25rem',
      pesoTitulos: 'negrita',
      botonForma: 'pildora',
      animarSecciones: true,
      esquemas: esquemas(
        { fondo: '#120b24', texto: '#efeaff', marca: '#7c3aed', contraste: '#ffffff' },
        { fondo: '#7c3aed', texto: '#ffffff', marca: '#ffffff', contraste: '#7c3aed' },
      ),
    },
    columnas: 2,
    captura: '/ejemplos/charla-llanera.webp',
    capturaMovil: '/ejemplos/charla-llanera-movil.webp',
    ejemplo: 'Charla Llanera',
    descripcion: 'Nocturna y en violeta, con fondo de malla: el episodio nuevo, dónde escuchar, cómo patrocinar y un llamado a la comunidad.',
    ajustes: { fondoBio: 'malla' },
    bloques: () => [
      perfil('El podcast de historias del Llano. Episodio nuevo cada jueves.', 'redondeada'),
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          estilo: 'relleno',
          items: [
            enlace('Episodio 48: los últimos vaqueros', 'video', { url: 'charlallanera.co/48', destacado: true, descripcion: 'Con el maestro Orlando Rey' }),
            enlace('Escúchanos en Spotify', 'musica', { url: 'open.spotify.com/show/charlallanera' }),
            enlace('Míranos en YouTube', 'youtube', { url: 'youtube.com/@charlallanera' }),
          ],
        },
      },
      {
        id: id('enlaces'),
        tipo: 'enlaces',
        props: {
          titulo: 'Trabaja con nosotros',
          estilo: 'suave',
          items: [
            enlace('Patrocina un episodio', 'correo', { url: 'pauta@charlallanera.co' }),
            enlace('Cuéntanos tu historia', 'whatsapp'),
          ],
        },
      },
    ],
  },
]
