import { Contenedor } from './Contenedor'

/**
 * Marco de los documentos legales.
 *
 * El aviso de borrador es deliberadamente visible: estos textos los redactó
 * quien construyó el sitio, no un abogado. Que estorbe es el punto — así no se
 * publican por descuido. Se quita cuando alguien con criterio jurídico los
 * revise.
 */
export function ProsaLegal({
  actualizado,
  children,
}: {
  actualizado: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white py-14 lg:py-18">
      <Contenedor>
        <div className="max-w-3xl">
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Borrador sin revisión legal</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Este texto es una base de trabajo, no un documento validado por un abogado. Antes
              de publicar la plataforma hay que someterlo a revisión profesional y quitar este
              aviso.
            </p>
          </div>

          <p className="mt-8 text-sm text-sitio-tenue">Última actualización: {actualizado}</p>

          <div className="mt-8 space-y-8">{children}</div>
        </div>
      </Contenedor>
    </section>
  )
}

export function Articulo({
  numero,
  titulo,
  children,
}: {
  numero: string
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-sitio-tinta">
        <span className="mr-2 text-sitio-azul">{numero}</span>
        {titulo}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-pretty text-sitio-suave">{children}</div>
    </section>
  )
}
