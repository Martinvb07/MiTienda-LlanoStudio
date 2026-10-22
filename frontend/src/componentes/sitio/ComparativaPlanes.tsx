import { Check, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'
import { ORDEN_PLANES, PLANES, type LimitesPlan } from '@/utilidades/planes'

type Valor = boolean | number | string | null

interface Fila {
  etiqueta: string
  valor: (limites: LimitesPlan) => Valor
}

/** Sale de la misma tabla de límites que aplica el editor: no se desincroniza. */
const GRUPOS: { titulo: string; filas: Fila[] }[] = [
  {
    titulo: 'Catálogo',
    filas: [
      { etiqueta: 'Productos', valor: (l) => l.productos ?? 'Ilimitados' },
      { etiqueta: 'Fotos por producto', valor: (l) => l.fotosPorProducto },
      { etiqueta: 'Pedir por WhatsApp en cada producto', valor: () => true },
    ],
  },
  {
    titulo: 'Diseño',
    filas: [
      { etiqueta: 'Secciones en la página', valor: (l) => l.secciones },
      { etiqueta: 'Colores, letra y esquinas a tu medida', valor: (l) => l.temaLibre },
      { etiqueta: 'Carrusel de banners', valor: (l) => (l.bannersCarrusel ? `Hasta ${l.bannersCarrusel}` : false) },
      { etiqueta: 'Categorías con foto', valor: (l) => (l.itemsCategorias ? `Hasta ${l.itemsCategorias}` : false) },
      { etiqueta: 'Tarjetas de producto, 5 columnas y filtro', valor: (l) => l.grillaAvanzada },
    ],
  },
  {
    titulo: 'Cabecera y pie',
    filas: [
      { etiqueta: 'Enlaces en el menú', valor: (l) => l.enlacesMenu },
      { etiqueta: 'Cabecera completa con barra de color', valor: (l) => l.cabeceraCompleta },
      { etiqueta: 'Buscador de productos', valor: (l) => l.buscador },
      { etiqueta: 'Botón flotante de WhatsApp', valor: (l) => l.whatsappFlotante },
      { etiqueta: 'Pie con contacto, horario y categorías', valor: (l) => l.pieColumnas },
      { etiqueta: 'Sin “Hecho con Mi Tienda”', valor: (l) => l.quitarMarca },
    ],
  },
]

function Celda({ valor }: { valor: Valor }): ReactNode {
  if (valor === true) return <Check aria-label="Incluido" className="mx-auto h-4 w-4 text-white" />
  if (valor === false || valor === null) return <Minus aria-label="No incluido" className="mx-auto h-4 w-4 text-white/20" />
  return <span className="text-white/80">{valor}</span>
}

export function ComparativaPlanes() {
  return (
    <section className="pb-[110px] md:pb-[150px]">
      <Contenedor>
        <Revelar>
          <Rotulo>Comparar</Rotulo>
          <h2 className="titulo-2 mt-4">Qué personalizas en cada plan</h2>
        </Revelar>

        <Revelar className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-4 text-left font-normal text-white/40" />
                {ORDEN_PLANES.map((plan) => (
                  <th key={plan} className="w-[15%] py-4 text-center text-[15px] font-normal tracking-[-0.01em]">
                    {PLANES[plan].nombre}
                  </th>
                ))}
              </tr>
            </thead>
            {GRUPOS.map((grupo) => (
              <tbody key={grupo.titulo}>
                <tr>
                  <th
                    colSpan={ORDEN_PLANES.length + 1}
                    className="pt-9 pb-3 text-left text-[11px] font-normal tracking-[0.14em] text-white/40 uppercase"
                  >
                    {grupo.titulo}
                  </th>
                </tr>
                {grupo.filas.map((fila) => (
                  <tr key={fila.etiqueta} className="border-t border-white/10">
                    <td className="py-3.5 pr-4 text-white/70">{fila.etiqueta}</td>
                    {ORDEN_PLANES.map((plan) => (
                      <td key={plan} className="py-3.5 text-center">
                        <Celda valor={fila.valor(PLANES[plan])} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </Revelar>
      </Contenedor>
    </section>
  )
}
