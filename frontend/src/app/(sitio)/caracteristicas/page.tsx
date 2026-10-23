import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Caracteristicas, ComoFunciona } from '@/componentes/sitio/Caracteristicas'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'
import { ORDEN_PLANES, PLANES, experienciaIncluye, type ExperienciaCompra } from '@/utilidades/planes'

export const metadata: Metadata = {
  title: 'Tienda en línea',
  description:
    'Tienda en línea con editor visual, lienzo libre, plantillas pro, carrito, pagos con Wompi, ePayco o Bold, pedidos por WhatsApp y dominio propio. Hecha para Colombia.',
  alternates: { canonical: '/caracteristicas' },
}

/** Cómo se siente comprar, por nivel. Los planes de cada nivel salen de la tabla de límites. */
const EXPERIENCIAS: { nivel: ExperienciaCompra; titulo: string; texto: string }[] = [
  { nivel: 'basica', titulo: 'Carrito', texto: 'Agregar desde la ficha y pagar.' },
  { nivel: 'avanzada', titulo: 'Agregar en un toque', texto: 'Botón en cada tarjeta, aviso con foto, beneficios con íconos y lupa en la ficha.' },
  { nivel: 'completa', titulo: 'La foto vuela a la bolsa', texto: 'Además, barra de compra fija en la ficha.' },
]

const planesCon = (nivel: ExperienciaCompra) =>
  ORDEN_PLANES.filter((plan) => experienciaIncluye(PLANES[plan].experienciaCompra, nivel))
    .map((plan) => PLANES[plan].nombre)
    .join(', ')

const PANEL = [
  { titulo: 'Pedidos', texto: 'Con estado, datos del cliente y exportar a Excel.' },
  { titulo: 'Variantes', texto: 'Talla, color o lo que vendas.' },
  { titulo: 'Cupones', texto: 'Descuentos con código.' },
  { titulo: 'Estadísticas', texto: 'Visitas, ventas y lo más vendido.' },
  { titulo: 'Importar productos', texto: 'Todo el catálogo desde un archivo.' },
  { titulo: 'Equipo con roles', texto: 'Admin o editor, cada quien lo suyo.' },
  { titulo: 'Dominio propio', texto: 'Con HTTPS, sin configurar nada más.' },
  { titulo: 'Código QR', texto: 'Para el mostrador o las bolsas.' },
  { titulo: 'Avisos', texto: 'Stock bajo, pedidos nuevos y tu plan.' },
]

export default function PaginaTienda() {
  return (
    <>
      <CabeceraPagina
        rotulo="Tienda en línea"
        titulo="Tu tienda, lista para vender"
        descripcion="Diseño, catálogo, cobros y pedidos en un solo lugar."
      >
        <Boton href="/panel/crear-cuenta?producto=tienda" flecha>
          Crear mi tienda
        </Boton>
        <Boton href="/plantillas" variante="secundario">
          Ver plantillas
        </Boton>
      </CabeceraPagina>

      <Caracteristicas rotulo="Lo que trae" />

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Revelar>
            <span className="antetitulo mb-[22px]">Comprar</span>
            <h2 className="titulo-2 max-w-[11ch]">Cada plan compra mejor</h2>
          </Revelar>
          <Revelar retardo={0.1} className="border-b border-white/12">
            {EXPERIENCIAS.map((experiencia, indice) => (
              <div key={experiencia.nivel} className="grid grid-cols-[56px_1fr] gap-6 border-t border-white/12 py-8 md:grid-cols-[80px_1fr_auto] md:items-center">
                <span className="font-mono text-[13px] text-white/40">{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[clamp(22px,2.2vw,28px)] tracking-[-0.03em]">{experiencia.titulo}</h3>
                  <p className="mt-1.5 text-[14px] text-white/55">{experiencia.texto}</p>
                </div>
                <span className="col-start-2 text-[11px] tracking-[0.12em] text-white/45 uppercase md:col-start-auto">
                  {planesCon(experiencia.nivel)}
                </span>
              </div>
            ))}
          </Revelar>
        </Contenedor>
      </section>

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Tu panel</span>
            <h2 className="titulo-2 max-w-[14ch]">Lo de todos los días, a mano</h2>
          </Revelar>
          <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {PANEL.map((detalle, indice) => (
              <Revelar key={detalle.titulo} retardo={(indice % 3) * 0.08}>
                <div className="border-t border-white/12 py-7">
                  <span className="font-mono text-[12px] text-white/35">{String(indice + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-[19px] tracking-[-0.02em]">{detalle.titulo}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{detalle.texto}</p>
                </div>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>

      <ComoFunciona />

      <LlamadoFinal titulo="Tu tienda puede estar vendiendo mañana" />
    </>
  )
}
