import 'server-only'
import { ARTICULOS, type Articulo } from '@/contenido/articulos'

const URL_API = process.env.URL_API ?? 'http://localhost:4000'

export interface ContenidoSitio {
  preguntasPrecios: { pregunta: string; respuesta: string }[]
  testimonios: { nombre: string; tienda: string; texto: string; foto?: string }[]
}

/**
 * Textos de la web que se editan en el admin. Si la API no responde (en el
 * build, por ejemplo), la web usa lo que trae en el código.
 */
export async function obtenerContenidoSitio(): Promise<ContenidoSitio> {
  try {
    const respuesta = await fetch(`${URL_API}/api/contenido/sitio`, { next: { revalidate: 60, tags: ['contenido'] } })
    if (!respuesta.ok) throw new Error()
    return (await respuesta.json()) as ContenidoSitio
  } catch {
    return { preguntasPrecios: [], testimonios: [] }
  }
}

interface ArticuloApi extends Omit<Articulo, 'fecha'> {
  fecha: string
  publicado: boolean
}

/** Artículos del código más los del admin; uno del admin con el mismo slug reemplaza al del código. */
export async function obtenerArticulos(): Promise<Articulo[]> {
  let propios: Articulo[] = []
  try {
    const respuesta = await fetch(`${URL_API}/api/contenido/articulos`, { next: { revalidate: 60, tags: ['articulos'] } })
    if (respuesta.ok) {
      const { articulos } = (await respuesta.json()) as { articulos: ArticuloApi[] }
      propios = articulos.map((articulo) => ({
        slug: articulo.slug,
        titulo: articulo.titulo,
        categoria: articulo.categoria,
        resumen: articulo.resumen,
        portada: articulo.portada,
        minutos: articulo.minutos,
        secciones: articulo.secciones,
        fecha: articulo.fecha.slice(0, 10),
      }))
    }
  } catch {
    // Sin API: sólo los del código.
  }
  const slugs = new Set(propios.map((articulo) => articulo.slug))
  return [...propios, ...ARTICULOS.filter((articulo) => !slugs.has(articulo.slug))].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export async function obtenerArticulo(slug: string) {
  return (await obtenerArticulos()).find((articulo) => articulo.slug === slug)
}
