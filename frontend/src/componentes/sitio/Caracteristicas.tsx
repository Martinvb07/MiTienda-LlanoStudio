import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'
import {
  VisualDominio,
  VisualEditor,
  VisualPagos,
  VisualProductos,
} from './visuales/VisualesCaracteristicas'

const CARACTERISTICAS = [
  {
    indice: '01',
    rotulo: 'Diseño',
    titulo: 'Editor visual de arrastrar y soltar',
    texto:
      'Arma tu página moviendo bloques con el mouse: portada, grilla de productos, texto, pie. Cambia el orden, oculta lo que no quieres y publica cuando esté listo.',
    puntos: ['Bloques reordenables', 'Vista previa inmediata', 'Sin tocar una línea de código'],
    visual: <VisualEditor />,
  },
  {
    indice: '02',
    rotulo: 'Catálogo',
    titulo: 'Gestión de productos simplificada',
    texto:
      'Carga fotos, precios, descripciones y stock desde un solo lugar. Las imágenes se optimizan solas para que tu tienda cargue rápido incluso con mala señal.',
    puntos: ['Fotos optimizadas al vuelo', 'Control de inventario', 'Precios en pesos'],
    visual: <VisualProductos />,
  },
  {
    indice: '03',
    rotulo: 'Dominio',
    titulo: 'Tu marca, tu dirección',
    texto:
      'Empieza en tunegocio.llanostudio.co y conecta tu dominio propio cuando quieras. Colores, tipografía y logo se aplican a toda la tienda.',
    puntos: ['Subdominio incluido', 'Dominio propio', 'Tema personalizable'],
    visual: <VisualDominio />,
  },
  {
    indice: '04',
    rotulo: 'Pagos',
    titulo: 'Pagos pensados para Colombia',
    texto:
      'Wompi y PSE, los medios que tus clientes ya usan y en los que confían. Cada pedido queda registrado con su pago y su estado de envío.',
    puntos: ['Wompi', 'PSE', 'Facturación DIAN'],
    proximamente: true,
    visual: <VisualPagos />,
  },
]

export function Caracteristicas() {
  return (
    <section id="producto" className="py-20 lg:py-28">
      <Contenedor>
        <Revelar className="max-w-2xl">
          <Rotulo>Todo en una sola plataforma</Rotulo>
          <h2 className="mt-5 titulo-2">
            Lo que antes pedías a un desarrollador, ahora lo haces tú
          </h2>
        </Revelar>

        <div className="mt-16 lg:mt-20">
          {CARACTERISTICAS.map((caracteristica, posicion) => (
            <Revelar key={caracteristica.indice}>
              <article
                className={`relative grid gap-10 border-t border-sitio-borde py-14 lg:grid-cols-2 lg:items-center lg:gap-16 ${
                  posicion === CARACTERISTICAS.length - 1
                    ? 'border-b border-sitio-borde'
                    : ''
                }`}
              >
                {/* En pantallas anchas se alternan los lados, para que la
                    vista no caiga siempre en la misma columna. */}
                <div className={posicion % 2 === 1 ? 'lg:order-2' : ''}>
                  <Rotulo>{caracteristica.rotulo}</Rotulo>

                  <h3 className="mt-5 titulo-3">
                    {caracteristica.titulo}
                  </h3>

                  <p className="mt-4 max-w-md leading-relaxed text-pretty text-sitio-suave">
                    {caracteristica.texto}
                  </p>

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {caracteristica.puntos.map((punto) => (
                      <li
                        key={punto}
                        className="rounded-full border border-sitio-borde-fuerte bg-white/[0.02] px-3 py-1.5 text-sm text-sitio-suave"
                      >
                        {punto}
                      </li>
                    ))}
                  </ul>

                  {caracteristica.proximamente && (
                    <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-sitio-azul/30 bg-sitio-azul/10 px-3 py-1.5 text-xs font-medium text-sitio-azul-claro">
                      <span className="h-1.5 w-1.5 rounded-full bg-sitio-azul" />
                      Próximamente
                    </p>
                  )}
                </div>

                <div className={posicion % 2 === 1 ? 'lg:order-1' : ''}>
                  {caracteristica.visual}
                </div>
              </article>
            </Revelar>
          ))}
        </div>
      </Contenedor>
    </section>
  )
}
