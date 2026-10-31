import { obtenerProducto, obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { formatearPrecio } from '@/utilidades/formato'
import { tarjetaCompartir } from '@/utilidades/tarjetaCompartir'

export const revalidate = 3600

/** Imagen al compartir un producto sin foto (la usa generateMetadata de la ficha). */
export async function GET(_peticion: Request, { params }: { params: Promise<{ subdominio: string; slug: string }> }) {
  const { subdominio, slug } = await params
  const host = hostDesdeIdentificador(subdominio)
  const [tienda, producto] = await Promise.all([obtenerTienda(host), obtenerProducto(host, slug)])
  if (!tienda || !producto) return new Response('No encontrado', { status: 404 })

  return tarjetaCompartir({
    titulo: producto.nombre,
    subtitulo: producto.descripcion ?? undefined,
    precio: formatearPrecio(producto.precio, tienda.moneda),
    tienda: tienda.nombre,
    host,
    colores: { fondo: tienda.tema.colorFondo, texto: tienda.tema.colorTexto, marca: tienda.tema.colorMarca, contraste: tienda.tema.colorContraste },
  })
}
