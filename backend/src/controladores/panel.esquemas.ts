import { z } from 'zod'
import { RUTAS_RESERVADAS } from '../utilidades/planes.js'

/**
 * Esquemas de validación de lo que el panel manda a la API: cuenta, tienda
 * (tema, bloques, ajustes) y productos.
 */

const correo = z.string().trim().toLowerCase().email('Ese correo no parece válido').max(160)

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80),
  email: correo,
  contrasena: z.string().min(8, 'Tiene que tener al menos 8 caracteres').max(200),
  tienda: z.string().trim().min(1, 'Escribe el nombre de tu tienda').max(80),
  subdominio: z.string().trim().toLowerCase(),
  /** Código de la tienda que lo invitó (?ref=). */
  ref: z.string().trim().toUpperCase().max(20).optional(),
  /** De dónde llegó (utm_source u otro), para el embudo del admin. */
  origen: z.string().trim().toLowerCase().max(60).optional(),
  /** Qué arma: tienda (por defecto), página informativa o enlaces para la bio. */
  tipo: z.enum(['tienda', 'pagina', 'enlaces']).default('tienda'),
})

export const esquemaIngreso = z.object({
  email: correo,
  contrasena: z.string().min(1, 'Escribe tu contraseña').max(200),
})

export const esquemaCuenta = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80),
  email: correo,
})

export const esquemaContrasena = z.object({
  actual: z.string().min(1, 'Escribe tu contraseña actual').max(200),
  nueva: z.string().min(8, 'Tiene que tener al menos 8 caracteres').max(200),
})

const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido')

const esquemaTema = z.object({
  colorMarca: colorHex.optional(),
  colorContraste: colorHex.optional(),
  colorFondo: colorHex.optional(),
  colorTexto: colorHex.optional(),
  fuenteTitulos: z.string().max(40).optional(),
  radio: z.string().max(12).optional(),
  // Configuración del tema
  fuenteCuerpo: z.string().max(40).optional(),
  pesoTitulos: z.enum(['normal', 'medio', 'negrita']).optional(),
  titulosMayusculas: z.boolean().optional(),
  anchoPagina: z.enum(['normal', 'amplio', 'completo']).optional(),
  botonForma: z.enum(['recto', 'suave', 'pildora']).optional(),
  botonEstilo: z.enum(['relleno', 'contorno']).optional(),
  botonMayusculas: z.boolean().optional(),
  tarjetaProporcion: z.enum(['cuadrada', 'vertical', 'horizontal']).optional(),
  tarjetaAlineacion: z.enum(['izquierda', 'centro']).optional(),
  tarjetaSegundaFoto: z.boolean().optional(),
  /** Color del precio en las tarjetas de producto (el rojo de un supermercado). */
  colorPrecio: colorHex.optional(),
  animarSecciones: z.boolean().optional(),
  alAgregar: z.enum(['carrito', 'aviso', 'volar']).optional(),
  agregarRapido: z.boolean().optional(),
  esquemas: z
    .array(
      z.object({
        id: z.string().min(1).max(20),
        nombre: z.string().trim().max(30),
        fondo: colorHex,
        texto: colorHex,
        marca: colorHex,
        contraste: colorHex,
      }),
    )
    .max(8)
    .optional(),
})

/**
 * El diseño es JSON libre para el resto del sistema; aquí sólo se exige la
 * forma mínima y un tope de tamaño. La tienda pública vuelve a normalizarlo
 * antes de pintar (frontend/src/tipos/bloques.ts).
 */
export const esquemaBloque = z.object({
  id: z.string().min(1).max(64),
  tipo: z.string().min(1).max(40),
  props: z.record(z.string(), z.unknown()),
  visible: z.boolean().optional(),
  // La apariencia de la sección: se recorta al plan al pintar, no al guardar,
  // para que bajar de plan no borre lo configurado.
  estilo: z.record(z.string(), z.unknown()).optional(),
})

const urlMedio = z.string().max(600)

const enlace = z.object({ texto: z.string().trim().max(40), enlace: z.string().trim().max(300) })

/** Cabecera, contacto y redes de la tienda. Todo opcional. */
const esquemaAjustes = z.object({
  cabecera: z.enum(['simple', 'completa']).optional(),
  buscador: z.boolean().optional(),
  colorBarra: colorHex.optional(),
  menu: z.array(enlace).max(8).optional(),
  botonDestacado: enlace.optional(),
  whatsapp: z.string().trim().max(20).optional(),
  whatsappFlotante: z.boolean().optional(),
  direccion: z.string().trim().max(160).optional(),
  correo: z.string().trim().max(120).optional(),
  horario: z.string().trim().max(120).optional(),
  instagram: z.string().trim().max(60).optional(),
  facebook: z.string().trim().max(120).optional(),
  tiktok: z.string().trim().max(60).optional(),
  // Ventas y envíos
  costoEnvio: z.coerce.number().min(0).max(10_000_000).optional(),
  envioGratisDesde: z.coerce.number().min(0).max(1_000_000_000).optional(),
  pedidoMinimo: z.coerce.number().min(0).max(1_000_000_000).optional(),
  pagoContraEntrega: z.boolean().optional(),
  pagoTransferencia: z.boolean().optional(),
  datosTransferencia: z.string().trim().max(400).optional(),
  pedidosWhatsapp: z.boolean().optional(),
  // Envíos por zona: cada una con sus ciudades y su precio
  zonasEnvio: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        nombre: z.string().trim().min(1, 'La zona necesita un nombre').max(60),
        // El panel manda lo escrito separado por comas, con huecos incluidos.
        ciudades: z
          .array(z.string().trim().max(60))
          .max(80)
          .transform((ciudades) => ciudades.filter(Boolean))
          .refine((ciudades) => ciudades.length > 0, 'Agrega al menos una ciudad'),
        costo: z.coerce.number().min(0).max(10_000_000),
        tiempo: z.string().trim().max(40).optional(),
      }),
    )
    .max(20)
    .optional(),
  soloZonas: z.boolean().optional(),
  recogerEnTienda: z.boolean().optional(),
  recordarCarritos: z.boolean().optional(),
  correosPedido: z.boolean().optional(),
  alertasStock: z.boolean().optional(),
  stockMinimo: z.coerce.number().int().min(0).max(1000).optional(),
  direccionRecogida: z.string().trim().max(200).optional(),
  // Cabecera
  cabeceraFija: z.boolean().optional(),
  logoCentrado: z.boolean().optional(),
  tamanoLogo: z.enum(['chico', 'medio', 'grande']).optional(),
  // Plantilla de la página de producto
  paginaProducto: z
    .object({
      orden: z.array(z.object({ id: z.string().max(30), visible: z.boolean() })).max(20).optional(),
      galeria: z.enum(['miniaturas', 'cuadricula', 'apiladas']).optional(),
      fijarInfo: z.boolean().optional(),
      textoEnvio: z.string().trim().max(200).optional(),
      acordeones: z
        .array(z.object({ id: z.string().max(20), titulo: z.string().trim().max(60), texto: z.string().trim().max(1000) }))
        .max(8)
        .optional(),
      relacionados: z.boolean().optional(),
      tituloRelacionados: z.string().trim().max(60).optional(),
      beneficios: z
        .array(
          z.object({
            id: z.string().max(20),
            icono: z.enum(['envio', 'garantia', 'pago', 'cambios', 'soporte', 'calidad']),
            texto: z.string().trim().max(80),
          }),
        )
        .max(6)
        .optional(),
      zoomFoto: z.boolean().optional(),
      animarEntrada: z.boolean().optional(),
      barraFija: z.boolean().optional(),
      resenas: z.boolean().optional(),
    })
    .optional(),
  // Medición: el pixel de Meta y Google Analytics de la propia tienda
  pixelMeta: z.string().trim().regex(/^\d{5,20}$/, 'El ID del pixel son sólo números').or(z.literal('')).optional(),
  googleAnalytics: z.string().trim().toUpperCase().regex(/^G-[A-Z0-9]{4,16}$/, 'El ID de Google Analytics empieza por G-').or(z.literal('')).optional(),
  // Enlaces para tu bio
  fondoBio: z.enum(['liso', 'degradado', 'malla']).optional(),
  ocultarMarca: z.boolean().optional(),
  // Páginas aparte de la de inicio (/servicios…), con sus secciones
  paginas: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        titulo: z.string().trim().min(1, 'La página necesita un nombre').max(60),
        ruta: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'La dirección de la página usa sólo letras, números y guiones')
          .max(40)
          .refine((ruta) => !RUTAS_RESERVADAS.has(ruta), 'Esa dirección ya la usa el sitio'),
        bloques: z.array(esquemaBloque).max(60),
      }),
    )
    .max(15)
    .refine((paginas) => new Set(paginas.map((pagina) => pagina.ruta)).size === paginas.length, 'Dos páginas no pueden tener la misma dirección')
    .optional(),
})

export const esquemaTienda = z.object({
  nombre: z.string().trim().min(1, 'La tienda necesita un nombre').max(80),
  descripcion: z.string().trim().max(300).nullable(),
  logoUrl: urlMedio.nullable(),
  plantilla: z.string().max(40),
  tema: esquemaTema,
  configuracionBloques: z.array(esquemaBloque).max(60),
  ajustes: esquemaAjustes.default({}),
  publicada: z.boolean(),
})

const precio = z.coerce.number().min(0, 'El precio no puede ser negativo').max(9_999_999_999)

export const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, 'El producto necesita un nombre').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Usa sólo letras, números y guiones')
    .max(80),
  descripcion: z.string().trim().max(4000).nullable(),
  precio,
  precioComparacion: precio.nullable(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  fotos: z.array(urlMedio).max(10),
  categoria: z.string().trim().max(60).nullable().optional(),
  presentacion: z.string().trim().max(60).nullable().optional(),
  activo: z.boolean(),
  // Opcionales a propósito: quien no los manda (ocultar, duplicar) no los borra.
  destacado: z.boolean().optional(),
  opciones: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(30),
        valores: z.array(z.string().trim().min(1).max(30)).min(1).max(20),
      }),
    )
    .max(3)
    .optional(),
  variantes: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        nombre: z.string().trim().min(1).max(100),
        valores: z.record(z.string(), z.string()),
        precio: precio.nullable().optional(),
        stock: z.coerce.number().int().min(0).max(1_000_000),
        foto: urlMedio.nullable().optional(),
      }),
    )
    .max(150)
    .optional(),
})

/** Con variantes, el stock del producto es la suma de las suyas. */
export function conStockDeVariantes<T extends { stock: number; variantes?: { stock: number }[] }>(datos: T): T {
  if (!datos.variantes || datos.variantes.length === 0) return datos
  return { ...datos, stock: datos.variantes.reduce((suma, variante) => suma + variante.stock, 0) }
}
