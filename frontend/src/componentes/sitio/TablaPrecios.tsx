import { Boton } from './Boton'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'

/**
 * IMPORTES DE MUESTRA — reemplazar por los reales antes de publicar.
 *
 * Los nombres de plan sí son los del sistema (PlanTenant en el esquema de
 * datos): GRATIS, EMPRENDE, NEGOCIO y PRO. Las cifras son inventadas y están
 * puestas sólo para que la página se pueda ver terminada.
 */
const PLANES = [
  {
    clave: 'GRATIS',
    nombre: 'Gratis',
    precio: '0',
    periodo: 'para siempre',
    resumen: 'Para probar la plataforma y publicar tus primeros productos.',
    incluye: [
      'Hasta 10 productos, 4 fotos cada uno',
      'Subdominio tunegocio.llanostudio.co',
      'Los 5 estilos predefinidos',
      'Hasta 6 secciones: portada, productos, texto y pie',
    ],
    excluye: ['Colores y letra a tu medida', 'Barra de anuncio e imagen con texto', 'Quitar “Hecho con Mi Tienda”'],
    accion: 'Empezar gratis',
  },
  {
    clave: 'EMPRENDE',
    nombre: 'Emprende',
    precio: '39.900',
    periodo: 'al mes',
    resumen: 'Para quien ya vende y quiere su propia dirección.',
    incluye: [
      'Hasta 100 productos, 8 fotos cada uno',
      'Colores, letra y esquinas a tu medida',
      'Todas las secciones, hasta 12',
      'Sin marca de Mi Tienda en el pie',
      'Tu dominio propio (próximamente)',
    ],
    accion: 'Elegir Emprende',
  },
  {
    clave: 'NEGOCIO',
    nombre: 'Negocio',
    precio: '89.900',
    periodo: 'al mes',
    resumen: 'Para tiendas con volumen y varias personas al frente.',
    incluye: [
      'Productos ilimitados, 10 fotos cada uno',
      'Hasta 30 secciones',
      'Pagos con Wompi y PSE (próximamente)',
      'Reportes de ventas',
      'Hasta 3 usuarios en el panel',
      'Soporte prioritario',
    ],
    destacado: true,
    accion: 'Elegir Negocio',
  },
  {
    clave: 'PRO',
    nombre: 'Pro',
    precio: '179.900',
    periodo: 'al mes',
    resumen: 'Para quien opera más de una marca a la vez.',
    incluye: [
      'Todo lo de Negocio',
      'Varias tiendas en una cuenta',
      'Facturación electrónica DIAN',
      'Usuarios ilimitados',
      'Acompañamiento en la puesta en marcha',
    ],
    accion: 'Hablar con nosotros',
  },
]

function Marca({ tipo }: { tipo: 'si' | 'no' }) {
  return tipo === 'si' ? (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sitio-azul-claro">
      <path
        d="M3 8.5l3.2 3.2L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ) : (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-0.5 h-4 w-4 shrink-0 text-sitio-tenue/60"
    >
      <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TablaPrecios() {
  return (
    <section className="py-16 lg:py-20">
      <Contenedor>
        <div className="grid gap-6 lg:grid-cols-4">
          {PLANES.map((plan, indice) => (
            <Revelar key={plan.clave} retardo={indice * 0.06}>
              <article
                className={`flex h-full flex-col rounded-lg border p-6 transition-colors duration-500 ${
                  plan.destacado
                    ? 'border-sitio-azul/60 bg-[#0b0d17] shadow-[0_30px_80px_-30px_rgba(59,96,255,0.55)]'
                    : 'border-sitio-borde bg-[#0b0b0c] hover:border-white/16'
                }`}
              >
                {plan.destacado && (
                  <span className="mb-4 self-start rounded-full border border-sitio-azul/40 bg-sitio-azul/15 px-2.5 py-1 text-[11px] font-medium text-sitio-azul-claro">
                    El más elegido
                  </span>
                )}

                <h2 className="text-lg font-medium tracking-[-0.02em] text-sitio-tinta">{plan.nombre}</h2>
                <p className="mt-1.5 min-h-[2.75rem] text-sm leading-relaxed text-sitio-suave">
                  {plan.resumen}
                </p>

                <p className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-sm font-medium text-sitio-suave">$</span>
                  <span className="text-[44px] leading-none tracking-[-0.045em] text-sitio-tinta">{plan.precio}</span>
                </p>
                <p className="mt-1 text-xs text-sitio-tenue">{plan.periodo}</p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.incluye.map((punto) => (
                    <li key={punto} className="flex gap-2.5 text-sm text-sitio-suave">
                      <Marca tipo="si" />
                      {punto}
                    </li>
                  ))}
                  {plan.excluye?.map((punto) => (
                    <li key={punto} className="flex gap-2.5 text-sm text-sitio-tenue/80">
                      <Marca tipo="no" />
                      {punto}
                    </li>
                  ))}
                </ul>

                <Boton
                  href={plan.clave === 'PRO' ? '/contacto' : '/panel/crear-cuenta'}
                  variante={plan.destacado ? 'primario' : 'secundario'}
                  className="mt-7 w-full"
                >
                  {plan.accion}
                </Boton>
              </article>
            </Revelar>
          ))}
        </div>

        <Revelar>
          <p className="mt-10 text-center text-sm text-sitio-tenue">
            Precios en pesos colombianos. Puedes cambiar o cancelar tu plan cuando quieras.
          </p>
        </Revelar>
      </Contenedor>
    </section>
  )
}
