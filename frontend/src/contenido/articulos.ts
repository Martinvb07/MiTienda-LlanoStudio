/**
 * Artículos de Recursos. Viven en el código mientras sean pocos; si crecen,
 * lo natural es pasarlos a MDX o a la base de datos sin cambiar las páginas.
 */

export interface Articulo {
  slug: string
  titulo: string
  categoria: string
  resumen: string
  portada: string
  /** ISO, para ordenar y mostrar. */
  fecha: string
  minutos: number
  secciones: { titulo?: string; parrafos: string[]; lista?: string[] }[]
}

export const ARTICULOS: Articulo[] = [
  {
    slug: 'fotos-de-producto-con-el-celular',
    titulo: 'Fotos de producto con el celular que no parecen del celular',
    categoria: 'Fotografía',
    resumen: 'Luz, fondo y encuadre. Todo lo que necesitas para que tu catálogo se vea profesional sin estudio ni equipo caro.',
    portada: '/fotos/lana-2.webp',
    fecha: '2026-10-14',
    minutos: 5,
    secciones: [
      {
        parrafos: [
          'En una tienda en línea, la foto es el producto: el cliente no lo puede tocar, así que decide con lo que ve. La buena noticia es que el celular que ya tienes alcanza. Lo que cambia el resultado no es la cámara, es la luz, el fondo y la constancia.',
        ],
      },
      {
        titulo: 'Usa luz de ventana, nunca el flash',
        parrafos: [
          'Pon el producto cerca de una ventana con luz indirecta, idealmente en la mañana o al final de la tarde. La luz lateral suave marca texturas y volúmenes; el flash los aplana y deja reflejos duros.',
          'Si el sol entra directo, cuelga una cortina blanca o una sábana delgada: funciona como difusor y elimina las sombras marcadas.',
        ],
      },
      {
        titulo: 'Un fondo, el mismo en todas',
        parrafos: [
          'Una cartulina blanca o de un color neutro, curvada desde la pared hasta la mesa, borra la línea del horizonte y hace que el producto flote. Usa el mismo fondo para todo el catálogo: una grilla pareja se ve como una marca, no como un álbum.',
        ],
      },
      {
        titulo: 'Cuatro fotos por producto',
        parrafos: ['Con estas cuatro tomas cubres casi todas las dudas del comprador:'],
        lista: [
          'De frente, centrado y con aire alrededor: es la portada.',
          'De lado o de espalda, para mostrar la forma.',
          'Un detalle de cerca: costura, textura, etiqueta.',
          'En uso o en contexto, para dar escala.',
        ],
      },
      {
        titulo: 'Antes de subir',
        parrafos: [
          'Limpia el lente con la camiseta (de verdad cambia todo), toma la foto un poco más abierta de lo que crees y recorta después. En Mi Tienda las imágenes se optimizan solas al subirlas, así que no hace falta reducirlas a mano.',
        ],
      },
    ],
  },
  {
    slug: 'del-catalogo-de-whatsapp-a-una-tienda',
    titulo: 'Del catálogo de WhatsApp a una tienda en línea',
    categoria: 'Ventas',
    resumen: 'Cuándo vale la pena dar el paso, qué cambia para tus clientes y cómo hacerlo sin perder a los que ya te compran.',
    portada: '/fotos/paso-1.webp',
    fecha: '2026-10-08',
    minutos: 4,
    secciones: [
      {
        parrafos: [
          'WhatsApp es una gran forma de empezar a vender: es gratis y tus clientes ya lo usan. El problema aparece cuando el negocio crece y pasas el día respondiendo lo mismo: precio, tallas, si hay o no hay.',
        ],
      },
      {
        titulo: 'Señales de que ya te quedó pequeño',
        parrafos: [],
        lista: [
          'Respondes muchas veces al día la misma pregunta de precio o disponibilidad.',
          'Vendiste algo que ya no tenías porque el estado no estaba actualizado.',
          'Te piden "el link de la tienda" y no tienes uno que mandar.',
          'Tus clientes no encuentran un producto que publicaste hace semanas.',
        ],
      },
      {
        titulo: 'Qué gana tu cliente',
        parrafos: [
          'Una tienda le permite mirar todo el catálogo a su ritmo, a cualquier hora, con fotos grandes y precios claros. Cuando escribe, ya sabe qué quiere: la conversación es para cerrar la venta, no para buscar el producto.',
        ],
      },
      {
        titulo: 'Cómo hacer el cambio sin perder ventas',
        parrafos: [
          'No se trata de abandonar WhatsApp. Pon el enlace de tu tienda en tu estado, en la biografía de Instagram y en la respuesta automática del chat. Cuando alguien pregunte por un producto, mándale el enlace directo a ese producto. En pocas semanas tus clientes llegan a la conversación ya decididos.',
        ],
      },
    ],
  },
  {
    slug: 'descripciones-que-venden',
    titulo: 'Descripciones de producto que venden y que Google entiende',
    categoria: 'Posicionamiento',
    resumen: 'Qué escribir, en qué orden y cuánto. Una fórmula simple para cada producto de tu catálogo.',
    portada: '/fotos/casa-1.webp',
    fecha: '2026-09-29',
    minutos: 5,
    secciones: [
      {
        parrafos: [
          'Una buena descripción responde las preguntas que te harían en persona. Y como cada producto de Mi Tienda tiene su propia página, lo que escribes es también lo que Google lee para mostrarte cuando alguien busca algo parecido.',
        ],
      },
      {
        titulo: 'Un nombre que se busque',
        parrafos: [
          'Nombra el producto como lo buscaría tu cliente: "Sofá de cuero tres puestos" dice más que "Modelo Milano". Puedes conservar el nombre de la colección, pero que empiece por lo que es.',
        ],
      },
      {
        titulo: 'La fórmula de tres partes',
        parrafos: [],
        lista: [
          'Una frase sobre para qué sirve o qué problema resuelve.',
          'Los datos duros: medidas, materiales, tallas, peso, contenido.',
          'Cuidados, garantía o envío: lo que da tranquilidad para comprar.',
        ],
      },
      {
        titulo: 'Escribe para una persona',
        parrafos: [
          'Evita llenar el texto de palabras clave repetidas: Google lo nota y el cliente también. Escribe como le explicarías el producto a alguien en tu local. Frases cortas, sin mayúsculas sostenidas y sin signos de admiración en cada línea.',
        ],
      },
    ],
  },
  {
    slug: 'como-cobrar-en-linea-en-colombia',
    titulo: 'Cómo cobrar en línea en Colombia: lo básico antes de elegir',
    categoria: 'Pagos',
    resumen: 'Tarjeta, PSE, transferencias y contraentrega: qué prefieren tus clientes y qué preguntar antes de contratar una pasarela.',
    portada: '/fotos/orbita-1.webp',
    fecha: '2026-09-18',
    minutos: 6,
    secciones: [
      {
        parrafos: [
          'En Colombia la gente paga de muchas formas, y ofrecer las que tu cliente ya usa es la manera más directa de no perder ventas en el último paso. Antes de elegir una pasarela, conviene tener claro qué necesitas.',
        ],
      },
      {
        titulo: 'Los medios más comunes',
        parrafos: [],
        lista: [
          'Tarjeta de crédito y débito: imprescindible para compras de valor medio y alto.',
          'PSE: pago directo desde la cuenta bancaria, muy usado por quienes no tienen tarjeta de crédito.',
          'Billeteras y transferencias: rápidas y familiares para compras pequeñas.',
          'Contraentrega: genera confianza en compradores nuevos, pero aumenta devoluciones y manejo de efectivo.',
        ],
      },
      {
        titulo: 'Qué preguntar a una pasarela',
        parrafos: [],
        lista: [
          'Cuál es la tarifa por transacción y si cambia según el medio de pago.',
          'En cuántos días hábiles llega la plata a tu cuenta.',
          'Qué documentos piden para abrir la cuenta como persona natural o empresa.',
          'Cómo funcionan los contracargos y reembolsos.',
        ],
      },
      {
        titulo: 'En Mi Tienda',
        parrafos: [
          'La integración de pagos con Wompi y PSE está en camino. Mientras tanto, muchas tiendas cierran la venta por WhatsApp con el enlace del producto y cobran por transferencia o link de pago.',
        ],
      },
    ],
  },
  {
    slug: 'envios-en-colombia',
    titulo: 'Envíos en Colombia: cómo cobrarlos sin perder plata',
    categoria: 'Logística',
    resumen: 'Envío gratis, tarifa fija o por ciudad: cómo decidir y qué incluir en el precio para que el envío no se coma tu margen.',
    portada: '/fotos/ruta-hero.webp',
    fecha: '2026-09-05',
    minutos: 4,
    secciones: [
      {
        parrafos: [
          'El costo del envío es la razón número uno por la que alguien llena el carrito y no paga. La clave es que el cliente lo sepa desde antes y que a ti te cuadren las cuentas.',
        ],
      },
      {
        titulo: 'Tres formas de cobrarlo',
        parrafos: [],
        lista: [
          'Tarifa fija nacional: simple de comunicar; compensas ciudades caras con baratas.',
          'Envío gratis desde un monto: sube el valor de cada compra y se anuncia muy bien en la barra de anuncio.',
          'Por ciudad o zona: el más justo, pero el más difícil de explicar.',
        ],
      },
      {
        titulo: 'Haz la cuenta completa',
        parrafos: [
          'Al costo de la transportadora súmale el empaque, el tiempo de alistar el pedido y el porcentaje de la pasarela de pago sobre el envío. Si ofreces envío gratis, ese total tiene que salir del margen del producto: revisa que sigas ganando.',
        ],
      },
      {
        titulo: 'Anúncialo arriba',
        parrafos: [
          'Usa la barra de anuncio de tu tienda para decirlo claro desde el primer segundo: "Envío gratis desde $150.000" o "Envíos a toda Colombia en 48 horas". Es la sección más simple y una de las que más convierte.',
        ],
      },
    ],
  },
  {
    slug: 'elegir-la-plantilla-de-tu-tienda',
    titulo: 'Cómo elegir la plantilla de tu tienda',
    categoria: 'Diseño',
    resumen: 'Qué mirar en una plantilla según lo que vendes, y por qué tus fotos importan más que el diseño.',
    portada: '/fotos/barro-hero.webp',
    fecha: '2026-08-27',
    minutos: 3,
    secciones: [
      {
        parrafos: [
          'Una plantilla es un punto de partida: define el orden de las secciones, la tipografía y los colores. En Mi Tienda puedes cambiar de plantilla cuando quieras sin perder productos, así que no hay decisión irreversible.',
        ],
      },
      {
        titulo: 'Mira tus fotos primero',
        parrafos: [
          'Si tus fotos son claras y de fondo blanco, una plantilla luminosa las hace brillar. Si son oscuras o de producto tecnológico, un fondo oscuro como el de Tecnología y Fotografía las resalta. El diseño tiene que servirle a la foto, no competir con ella.',
        ],
      },
      {
        titulo: 'Columnas según el producto',
        parrafos: [
          'Productos que se deciden por la foto (ropa, accesorios) se ven mejor en cuatro columnas. Productos de mayor valor o con más detalle (muebles, cerámica) piden tres columnas y fotos más grandes.',
        ],
      },
      {
        titulo: 'Personaliza lo justo',
        parrafos: [
          'Cambia el color de marca, sube tu logo y reescribe los textos de ejemplo. Con eso la plantilla ya es tuya. Los ajustes finos de colores y letra llegan con el plan Emprende.',
        ],
      },
    ],
  },
]

export const articuloPorSlug = (slug: string) => ARTICULOS.find((articulo) => articulo.slug === slug)

export const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
