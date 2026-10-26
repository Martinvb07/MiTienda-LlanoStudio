import type { BloqueFicha, PlantillaProducto } from '@/tipos/tienda'

export const ETIQUETAS_FICHA: Record<BloqueFicha, string> = {
  titulo: 'Título',
  precio: 'Precio',
  presentacion: 'Presentación',
  stock: 'Unidades disponibles',
  descripcion: 'Descripción',
  comprar: 'Cantidad y comprar',
  whatsapp: 'Pedir por WhatsApp',
  envio: 'Información de envío',
  acordeones: 'Pestañas desplegables',
  compartir: 'Compartir',
  beneficios: 'Beneficios con íconos',
}

export const ORDEN_FICHA: BloqueFicha[] = [
  'titulo',
  'presentacion',
  'precio',
  'stock',
  'descripcion',
  'comprar',
  'whatsapp',
  'beneficios',
  'envio',
  'acordeones',
  'compartir',
]

const OCULTOS_POR_DEFECTO = new Set<BloqueFicha>(['stock', 'compartir', 'envio', 'acordeones', 'beneficios'])

/** La plantilla guardada completada con lo que falte, en su orden. */
export function plantillaCompleta(plantilla: PlantillaProducto = {}): Required<PlantillaProducto> {
  const guardado = (plantilla.orden ?? []).filter((pieza) => pieza.id in ETIQUETAS_FICHA)
  const faltan = ORDEN_FICHA.filter((id) => !guardado.some((pieza) => pieza.id === id)).map((id) => ({
    id,
    visible: !OCULTOS_POR_DEFECTO.has(id),
  }))
  return {
    orden: [...guardado, ...faltan],
    galeria: plantilla.galeria ?? 'miniaturas',
    fijarInfo: plantilla.fijarInfo ?? true,
    textoEnvio: plantilla.textoEnvio ?? 'Envíos a todo el país en 2 a 5 días hábiles.',
    acordeones: plantilla.acordeones ?? [
      { id: 'a1', titulo: 'Envíos y devoluciones', texto: 'Despachamos en 24 horas. Tienes 30 días para cambios.' },
      { id: 'a2', titulo: 'Cuidados', texto: 'Cuéntale a tus clientes cómo cuidar el producto.' },
    ],
    relacionados: plantilla.relacionados ?? true,
    tituloRelacionados: plantilla.tituloRelacionados ?? 'También te puede gustar',
    beneficios: plantilla.beneficios ?? [
      { id: 'b1', icono: 'envio', texto: 'Envíos a todo el país' },
      { id: 'b2', icono: 'pago', texto: 'Pago seguro' },
      { id: 'b3', icono: 'cambios', texto: 'Cambios fáciles' },
    ],
    zoomFoto: plantilla.zoomFoto ?? false,
    animarEntrada: plantilla.animarEntrada ?? false,
    barraFija: plantilla.barraFija ?? false,
    resenas: plantilla.resenas ?? true,
  }
}
