import { obtenerTienda } from '@/servicios/tiendas.servicio'
import { hostDesdeIdentificador } from '@/utilidades/dominios'
import { tarjetaCompartir } from '@/utilidades/tarjetaCompartir'

export const revalidate = 3600

/** Imagen al compartir la tienda cuando no tiene logo (la usa el layout de la tienda). */
export async function GET(_peticion: Request, { params }: { params: Promise<{ subdominio: string }> }) {
  const { subdominio } = await params
  const host = hostDesdeIdentificador(subdominio)
  const tienda = await obtenerTienda(host)
  if (!tienda) return new Response('No encontrado', { status: 404 })

  return tarjetaCompartir({
    titulo: tienda.nombre,
    subtitulo: tienda.descripcion ?? undefined,
    tienda: tienda.nombre,
    host,
    colores: { fondo: tienda.tema.colorFondo, texto: tienda.tema.colorTexto, marca: tienda.tema.colorMarca, contraste: tienda.tema.colorContraste },
  })
}
