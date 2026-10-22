import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { Revelar } from '@/componentes/sitio/Revelar'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guías y notas sobre vender en línea en Colombia: dominios, fotos de producto, medios de pago y posicionamiento.',
}

/**
 * Índice del blog.
 *
 * Todavía no hay entradas ni de dónde sacarlas: el día que existan, lo suyo es
 * que salgan de la base de datos o de archivos MDX, y esta lista pase a
 * recorrerlas. Mientras tanto se anuncian los temas previstos, que es honesto
 * y deja la página con algo que decir.
 */
const TEMAS = [
  {
    categoria: 'Dominios',
    titulo: 'Cómo conectar tu dominio propio a tu tienda',
    resumen: 'Qué registros DNS tocar y por qué la verificación tarda unas horas.',
  },
  {
    categoria: 'Fotografía',
    titulo: 'Fotos de producto con el celular que no parecen del celular',
    resumen: 'Luz, fondo y encuadre. Sin estudio y sin comprar nada.',
  },
  {
    categoria: 'Pagos',
    titulo: 'Wompi o PSE: cuál le conviene a tu tienda',
    resumen: 'Diferencias de tarifa, tiempos de desembolso y qué prefiere el comprador.',
  },
  {
    categoria: 'Posicionamiento',
    titulo: 'Qué escribir en la descripción de un producto para aparecer en Google',
    resumen: 'Lo que el buscador lee de tu catálogo y cómo dárselo servido.',
  },
]

export default function PaginaBlog() {
  return (
    <>
      <CabeceraPagina
        rotulo="Blog"
        titulo="Aprender a vender en línea, sin vueltas"
        descripcion="Guías cortas y concretas sobre lo que se necesita para que una tienda funcione en Colombia."
      />

      <section className="py-16 lg:py-20">
        <Contenedor>
          <Revelar>
            <div className="rounded-2xl border border-dashed border-sitio-borde-fuerte bg-sitio-crema px-6 py-8 text-center">
              <p className="font-medium tracking-[-0.01em] text-sitio-tinta">
                Todavía no publicamos la primera entrada
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-sitio-suave">
                Estos son los temas con los que vamos a empezar. Si hay alguno que te urge, se
                acepta sugerencia.
              </p>
            </div>
          </Revelar>

          <div className="mt-12 divide-y divide-sitio-borde border-y border-sitio-borde">
            {TEMAS.map((tema, indice) => (
              <Revelar key={tema.titulo} retardo={indice * 0.05}>
                <article className="grid gap-2 py-7 sm:grid-cols-[130px_1fr] sm:gap-8">
                  <span className="font-display text-xs font-medium tracking-[0.14em] text-sitio-tenue uppercase">
                    {tema.categoria}
                  </span>
                  <div>
                    <h2 className="text-lg font-medium tracking-[-0.02em] text-balance text-sitio-tinta">
                      {tema.titulo}
                    </h2>
                    <p className="mt-1.5 text-pretty text-sitio-suave">{tema.resumen}</p>
                    <p className="mt-3 text-xs text-sitio-tenue">Próximamente</p>
                  </div>
                </article>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>
    </>
  )
}
