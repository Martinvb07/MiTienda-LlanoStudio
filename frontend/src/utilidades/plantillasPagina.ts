import type { Bloque } from '@/tipos/bloques'
import type { TipoSitio } from '@/tipos/tienda'
import { ORDEN_PLANES, PLANES, limitesDe, type Plan } from './planes'
import { PLANTILLAS_TIENDA, type PlantillaTienda } from './plantillas'
import { tipoSitio } from './sitio'
import { ESTILOS_PREDEFINIDOS } from './tema'

/**
 * Plantillas de la página para tu negocio: portada, servicios, equipo,
 * horario y contacto, sin catálogo ni carrito.
 *
 * Usan los estilos predefinidos para verse igual en todos los planes (sin
 * tema libre el backend guarda siempre uno de esos). Se pueden usar desde
 * Gratis: al aplicarlas, las secciones que el plan no incluye se dejan por
 * fuera (bloquesDePlantilla) y vuelven al aplicarla otra vez con un plan mayor.
 * Por eso el menú sólo enlaza a secciones que están en todos los planes.
 */

const temaDe = (clave: string) => ESTILOS_PREDEFINIDOS.find((estilo) => estilo.clave === clave)!.tema
const id = (tipo: string) => `${tipo}-${Math.random().toString(36).slice(2, 10)}`
const pie = (nombre: string): Bloque => ({
  id: id('pie'),
  tipo: 'pie',
  props: { texto: `© ${new Date().getFullYear()} ${nombre}`, mostrarRedes: true },
})
const enlace = (texto: string, ancla: string) => ({ texto, enlace: `#${ancla}` })

export const PLANTILLAS_PAGINA: PlantillaTienda[] = [
  {
    clave: 'pagina-consultorio',
    nombre: 'Consultorio jurídico',
    categoria: 'Abogados y asesorías',
    plan: 'GRATIS',
    estilo: 'clasica',
    tema: temaDe('clasica'),
    columnas: 3,
    captura: '/ejemplos/morichal-abogados.webp',
    capturaMovil: '/ejemplos/morichal-abogados-movil.webp',
    ejemplo: 'Morichal Abogados',
    descripcion: 'Sobria y clara: áreas de práctica con precio de referencia, el equipo, preguntas frecuentes y cómo agendar la primera consulta.',
    ajustes: { cabecera: 'simple', menu: [enlace('Servicios', 'servicios'), enlace('Contacto', 'contacto')] },
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Asesoría legal clara y cercana',
          subtitulo: `${nombre}: familia, contratos, laboral y sucesiones. La primera consulta es sin costo.`,
          textoBoton: 'Agendar consulta',
          enlaceBoton: '#contacto',
          alineacion: 'izquierda',
        },
      },
      {
        id: id('servicios'),
        tipo: 'servicios',
        props: {
          titulo: 'Cómo te ayudamos',
          disposicion: 'tarjetas',
          textoBoton: 'Agendar',
          items: [
            { id: 's1', nombre: 'Primera consulta', descripcion: 'Revisamos tu caso y te decimos cómo seguir.', precio: 'Sin costo', duracion: '30 min' },
            { id: 's2', nombre: 'Derecho de familia', descripcion: 'Divorcios, custodia y cuota alimentaria.', precio: 'Desde $250.000' },
            { id: 's3', nombre: 'Contratos y arriendos', descripcion: 'Los redactamos o revisamos antes de que firmes.', precio: 'Desde $180.000' },
            { id: 's4', nombre: 'Laboral', descripcion: 'Despidos, liquidaciones y acuerdos con tu empleador.', precio: 'Desde $200.000' },
            { id: 's5', nombre: 'Sucesiones', descripcion: 'Trámite notarial o judicial, de principio a fin.', precio: 'Según el caso' },
          ],
        },
      },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Quiénes somos',
          contenido: `En ${nombre} acompañamos a familias y empresas del Llano desde hace más de 12 años. Te explicamos cada paso sin palabras difíciles.`,
          alineacion: 'centro',
        },
      },
      {
        id: id('equipo'),
        tipo: 'equipo',
        props: {
          titulo: 'El equipo',
          items: [
            { id: 'e1', nombre: 'Martha Rincón', cargo: 'Socia fundadora', texto: 'Familia y sucesiones.' },
            { id: 'e2', nombre: 'Julián Herrera', cargo: 'Abogado laboralista', texto: 'Trabajadores y empresas.' },
            { id: 'e3', nombre: 'Diana Castro', cargo: 'Derecho comercial', texto: 'Contratos y sociedades.' },
          ],
        },
      },
      {
        id: id('preguntas'),
        tipo: 'preguntas',
        props: {
          titulo: 'Preguntas frecuentes',
          items: [
            { id: 'q1', pregunta: '¿La primera consulta tiene costo?', respuesta: 'No. En 30 minutos revisamos tu caso y te decimos cómo seguir.' },
            { id: 'q2', pregunta: '¿Atienden de forma virtual?', respuesta: 'Sí, por videollamada o WhatsApp, en todo el país.' },
            { id: 'q3', pregunta: '¿Cómo se pagan los honorarios?', respuesta: 'Por etapas del proceso, con un acuerdo por escrito desde el inicio.' },
          ],
        },
      },
      {
        id: id('horario'),
        tipo: 'horario',
        props: {
          titulo: 'Agenda tu cita',
          dias: [
            { id: 'h1', dia: 'Lunes a viernes', horas: '8:00 a. m. a 6:00 p. m.' },
            { id: 'h2', dia: 'Sábados', horas: '9:00 a. m. a 12:00 m.' },
          ],
          nota: 'Atención virtual con cita previa.',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'pagina-odontologia',
    nombre: 'Clínica y odontología',
    categoria: 'Consultorios, clínicas y odontólogos',
    plan: 'GRATIS',
    estilo: 'fresca',
    tema: temaDe('fresca'),
    columnas: 3,
    captura: '/ejemplos/sonrie-odontologia.webp',
    capturaMovil: '/ejemplos/sonrie-odontologia-movil.webp',
    ejemplo: 'Sonríe Odontología',
    descripcion: 'Limpia y cercana: tratamientos con precio y duración, el equipo médico, opiniones de pacientes y el horario a la vista.',
    ajustes: { cabecera: 'simple', menu: [enlace('Tratamientos', 'servicios'), enlace('Horario', 'contacto')] },
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Tu sonrisa en buenas manos',
          subtitulo: `Odontología general y estética en ${nombre}. Agenda tu valoración sin costo.`,
          textoBoton: 'Agendar valoración',
          enlaceBoton: '#contacto',
          alineacion: 'centro',
        },
      },
      {
        id: id('columnas'),
        tipo: 'columnas',
        props: {
          columnas: 3,
          alineacion: 'centro',
          items: [
            { id: 'k1', icono: 'corazon', titulo: 'Sin dolor', texto: 'Anestesia moderna y trato tranquilo.' },
            { id: 'k2', icono: 'tarjeta', titulo: 'Pagos a cuotas', texto: 'Financia tu tratamiento sin intereses.' },
            { id: 'k3', icono: 'reloj', titulo: 'Urgencias hoy', texto: 'Si te duele, te atendemos el mismo día.' },
          ],
        },
      },
      {
        id: id('servicios'),
        tipo: 'servicios',
        props: {
          titulo: 'Tratamientos',
          disposicion: 'tarjetas',
          textoBoton: 'Agendar',
          items: [
            { id: 's1', nombre: 'Valoración', descripcion: 'Revisión completa y plan de tratamiento.', precio: 'Sin costo', duracion: '30 min' },
            { id: 's2', nombre: 'Limpieza dental', descripcion: 'Profilaxis y retiro de sarro.', precio: '$90.000', duracion: '45 min' },
            { id: 's3', nombre: 'Blanqueamiento', descripcion: 'Resultados desde la primera sesión.', precio: '$450.000', duracion: '1 hora' },
            { id: 's4', nombre: 'Calza en resina', descripcion: 'Del color de tu diente.', precio: '$120.000', duracion: '40 min' },
            { id: 's5', nombre: 'Ortodoncia', descripcion: 'Brackets o alineadores transparentes.', precio: 'Desde $2.800.000' },
            { id: 's6', nombre: 'Diseño de sonrisa', descripcion: 'Resinas o carillas, a tu medida.', precio: 'Desde $1.500.000' },
          ],
        },
      },
      {
        id: id('equipo'),
        tipo: 'equipo',
        props: {
          titulo: 'Quién te atiende',
          items: [
            { id: 'e1', nombre: 'Dra. Paula Méndez', cargo: 'Ortodoncista' },
            { id: 'e2', nombre: 'Dr. Felipe Arango', cargo: 'Rehabilitación oral' },
            { id: 'e3', nombre: 'Dra. Sara Quintero', cargo: 'Odontopediatra' },
          ],
        },
      },
      {
        id: id('testimonios'),
        tipo: 'testimonios',
        props: {
          titulo: 'Lo que dicen nuestros pacientes',
          items: [
            { id: 't1', nombre: 'Natalia R.', texto: 'Me hice el blanqueamiento y quedé feliz. Cero dolor.', estrellas: 5, detalle: 'Villavicencio' },
            { id: 't2', nombre: 'Jorge M.', texto: 'Llevé a mis hijos y los trataron con mucha paciencia.', estrellas: 5, detalle: 'Acacías' },
            { id: 't3', nombre: 'Lorena P.', texto: 'Puntuales, y me explicaron todo el tratamiento.', estrellas: 5, detalle: 'Villavicencio' },
          ],
        },
      },
      {
        id: id('horario'),
        tipo: 'horario',
        props: {
          titulo: 'Horario y contacto',
          dias: [
            { id: 'h1', dia: 'Lunes a viernes', horas: '7:00 a. m. a 7:00 p. m.' },
            { id: 'h2', dia: 'Sábados', horas: '8:00 a. m. a 2:00 p. m.' },
          ],
          nota: 'Urgencias: escríbenos por WhatsApp.',
        },
      },
      pie(nombre),
    ],
  },
  {
    clave: 'pagina-restaurante',
    nombre: 'Restaurante y café',
    categoria: 'Restaurantes, cafés y panaderías',
    plan: 'GRATIS',
    estilo: 'calida',
    tema: temaDe('calida'),
    columnas: 3,
    captura: '/ejemplos/cafe-la-ceiba.webp',
    capturaMovil: '/ejemplos/cafe-la-ceiba-movil.webp',
    ejemplo: 'Café La Ceiba',
    descripcion: 'Cálida, con letra clásica: la carta con precios, la historia de la casa, reservas por WhatsApp, el mapa y el horario.',
    ajustes: { cabecera: 'simple', menu: [enlace('Carta', 'servicios'), enlace('Horario', 'contacto')] },
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Café de origen y cocina de la casa',
          subtitulo: `Desayunos, almuerzos y postres en ${nombre}. Ven, o pide para llevar.`,
          textoBoton: 'Ver la carta',
          enlaceBoton: '#servicios',
          alineacion: 'izquierda',
        },
      },
      {
        id: id('servicios'),
        tipo: 'servicios',
        props: {
          titulo: 'La carta',
          subtitulo: 'Precios con impuestos incluidos.',
          disposicion: 'lista',
          items: [
            { id: 's1', nombre: 'Desayuno llanero', descripcion: 'Huevos pericos, arepa, queso y chocolate.', precio: '$18.000' },
            { id: 's2', nombre: 'Calentado de la casa', descripcion: 'Arroz, fríjol, carne desmechada y huevo.', precio: '$16.000' },
            { id: 's3', nombre: 'Almuerzo del día', descripcion: 'Sopa, seco, jugo natural y postre.', precio: '$22.000' },
            { id: 's4', nombre: 'Carne a la llanera', descripcion: 'Con yuca, papa criolla y guacamole.', precio: '$38.000' },
            { id: 's5', nombre: 'Café de origen', descripcion: 'Tinto, americano o capuchino.', precio: 'Desde $4.000' },
            { id: 's6', nombre: 'Torta del día', descripcion: 'Pregunta por la de hoy.', precio: '$9.000' },
          ],
        },
      },
      {
        id: id('texto'),
        tipo: 'texto',
        props: {
          titulo: 'Nuestra historia',
          contenido: `${nombre} empezó en una casa del centro, con una greca y las recetas de la abuela. Hoy tostamos nuestro propio café del Meta.`,
          alineacion: 'centro',
        },
      },
      {
        id: id('llamado'),
        tipo: 'llamado',
        props: {
          titulo: 'Reserva tu mesa',
          texto: 'Para grupos, cumpleaños o reuniones de trabajo.',
          textoBoton: 'Reservar por WhatsApp',
          aWhatsapp: true,
        },
      },
      {
        id: id('horario'),
        tipo: 'horario',
        props: {
          titulo: 'Horario',
          dias: [
            { id: 'h1', dia: 'Lunes a sábado', horas: '7:00 a. m. a 9:00 p. m.' },
            { id: 'h2', dia: 'Domingos y festivos', horas: '8:00 a. m. a 4:00 p. m.' },
          ],
        },
      },
      { id: id('mapa'), tipo: 'mapa', props: { titulo: 'Cómo llegar', direccion: '', alto: 'bajo' } },
      pie(nombre),
    ],
  },
  {
    clave: 'pagina-oficios',
    nombre: 'Servicios y oficios',
    categoria: 'Técnicos, arreglos, belleza y más',
    plan: 'GRATIS',
    estilo: 'llanera',
    tema: temaDe('llanera'),
    columnas: 3,
    captura: '/ejemplos/frios-del-llano.webp',
    capturaMovil: '/ejemplos/frios-del-llano-movil.webp',
    ejemplo: 'Fríos del Llano',
    descripcion: 'Directa: lo que haces con precio, por qué confiar, opiniones de clientes y un botón para agendar la visita por WhatsApp.',
    ajustes: { cabecera: 'simple', menu: [enlace('Servicios', 'servicios'), enlace('Contacto', 'contacto')] },
    bloques: (nombre) => [
      {
        id: id('hero'),
        tipo: 'hero',
        props: {
          titulo: 'Arreglos a domicilio, el mismo día',
          subtitulo: `Técnicos de ${nombre} en tu casa o tu negocio. Te cotizamos sin costo por WhatsApp.`,
          textoBoton: 'Agendar visita',
          enlaceBoton: '#servicios',
          alineacion: 'izquierda',
        },
      },
      {
        id: id('servicios'),
        tipo: 'servicios',
        props: {
          titulo: 'Servicios',
          disposicion: 'tarjetas',
          textoBoton: 'Agendar visita',
          items: [
            { id: 's1', nombre: 'Mantenimiento de aire', descripcion: 'Limpieza completa y revisión de gas.', precio: '$120.000', duracion: '1 hora' },
            { id: 's2', nombre: 'Reparación de nevera', descripcion: 'Diagnóstico y arreglo en tu casa.', precio: 'Desde $90.000' },
            { id: 's3', nombre: 'Instalación de aire', descripcion: 'Equipos de 9.000 a 24.000 BTU.', precio: 'Desde $280.000', duracion: '3 horas' },
            { id: 's4', nombre: 'Visita de diagnóstico', descripcion: 'Si hacemos el arreglo, no se cobra.', precio: '$40.000', duracion: '30 min' },
          ],
        },
      },
      {
        id: id('columnas'),
        tipo: 'columnas',
        props: {
          titulo: 'Por qué llamarnos',
          columnas: 3,
          alineacion: 'centro',
          items: [
            { id: 'k1', icono: 'escudo', titulo: 'Garantía por escrito', texto: '90 días en mano de obra.' },
            { id: 'k2', icono: 'reloj', titulo: 'Llegamos a tiempo', texto: 'Te avisamos cuando vamos en camino.' },
            { id: 'k3', icono: 'etiqueta', titulo: 'Precio claro', texto: 'Cotizas antes. Sin sorpresas al final.' },
          ],
        },
      },
      {
        id: id('testimonios'),
        tipo: 'testimonios',
        props: {
          titulo: 'Clientes que repiten',
          items: [
            { id: 't1', nombre: 'Carolina V.', texto: 'Llegaron el mismo día y el aire quedó como nuevo.', estrellas: 5, detalle: 'Villavicencio' },
            { id: 't2', nombre: 'Hernán G.', texto: 'Cobraron lo que dijeron. Muy recomendados.', estrellas: 5, detalle: 'Restrepo' },
            { id: 't3', nombre: 'Mónica S.', texto: 'Instalaron tres aires en la oficina sin parar el trabajo.', estrellas: 5, detalle: 'Villavicencio' },
          ],
        },
      },
      {
        id: id('preguntas'),
        tipo: 'preguntas',
        props: {
          titulo: 'Preguntas frecuentes',
          items: [
            { id: 'q1', pregunta: '¿Cobran la visita?', respuesta: 'Son $40.000, y si hacemos el arreglo no se cobra.' },
            { id: 'q2', pregunta: '¿Dan factura?', respuesta: 'Sí, factura electrónica a nombre de persona o empresa.' },
            { id: 'q3', pregunta: '¿Cómo se paga?', respuesta: 'Efectivo, Nequi, Daviplata o transferencia.' },
          ],
        },
      },
      {
        id: id('horario'),
        tipo: 'horario',
        props: {
          titulo: 'Horario y contacto',
          dias: [
            { id: 'h1', dia: 'Lunes a sábado', horas: '7:00 a. m. a 6:00 p. m.' },
            { id: 'h2', dia: 'Domingos', horas: 'Solo urgencias' },
          ],
        },
      },
      pie(nombre),
    ],
  },
]

/** Las plantillas que ofrece el editor según el tipo de sitio. */
export function plantillasDe(tipo: TipoSitio | undefined): PlantillaTienda[] {
  return tipoSitio(tipo) === 'pagina' ? PLANTILLAS_PAGINA : PLANTILLAS_TIENDA
}

export const esPlantillaPagina = (clave: string | null | undefined) =>
  PLANTILLAS_PAGINA.some((plantilla) => plantilla.clave === clave)

/**
 * Las secciones de la plantilla que el plan deja guardar, hasta su tope de
 * secciones. Con un plan que lo incluye todo, son todas.
 */
export function bloquesDePlantilla(plantilla: PlantillaTienda, nombre: string, plan: string | undefined): Bloque[] {
  const limites = limitesDe(plan)
  const bloques = plantilla.bloques(nombre).filter((bloque) => limites.bloques.includes(bloque.tipo))
  if (bloques.length <= limites.secciones) return bloques
  // Sin espacio para todo, el pie se queda: cierra la página.
  const pieFinal = bloques.at(-1)?.tipo === 'pie' ? bloques.at(-1)! : null
  return pieFinal ? [...bloques.slice(0, limites.secciones - 1), pieFinal] : bloques.slice(0, limites.secciones)
}

/** El plan más barato con el que la plantilla sale completa. */
export function planCompleto(plantilla: PlantillaTienda): Plan {
  const tipos = plantilla.bloques('').map((bloque) => bloque.tipo)
  return (
    ORDEN_PLANES.find((plan) => tipos.every((tipo) => PLANES[plan].bloques.includes(tipo)) && tipos.length <= PLANES[plan].secciones) ??
    'PRO'
  )
}
