'use client'

/* eslint-disable @next/next/no-img-element -- miniaturas subidas por el usuario */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, Lock, MessageCircle } from 'lucide-react'
import { obtenerMetricas, type DiaMetricas, type Metricas } from '@/servicios/panel'
import { formatearPrecio } from '@/utilidades/formato'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { Aviso, CURVA, Candado } from './ui/basicos'
import { Aparecer, Contador } from './ui/movimiento'

const RANGOS = [7, 30, 90, 365] as const

const SERIES = [
  { clave: 'ventas', etiqueta: 'Ventas', formato: (n: number) => formatearPrecio(Math.round(n)) },
  { clave: 'pedidos', etiqueta: 'Pedidos', formato: (n: number) => String(Math.round(n)) },
  { clave: 'visitas', etiqueta: 'Visitas', formato: (n: number) => Math.round(n).toLocaleString('es-CO') },
] as const

type ClaveSerie = (typeof SERIES)[number]['clave']

function Variacion({ ahora, antes }: { ahora: number; antes: number }) {
  if (!antes) return <span className="text-[11.5px] text-sitio-tenue">Sin datos del período anterior</span>
  const cambio = (ahora - antes) / antes
  const sube = cambio >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11.5px]', sube ? 'text-sitio-verde' : 'text-sitio-rojo')}>
      {sube ? <ArrowUpRight aria-hidden="true" className="h-3 w-3" /> : <ArrowDownRight aria-hidden="true" className="h-3 w-3" />}
      {Math.abs(Math.round(cambio * 100))}% vs. período anterior
    </span>
  )
}

/** Gráfica de área: se dibuja de izquierda a derecha y muestra el valor de cada día al pasar. */
function Grafica({ serie, clave }: { serie: DiaMetricas[]; clave: ClaveSerie }) {
  const [sobre, setSobre] = useState<number | null>(null)
  const ancho = 1000
  const alto = 260
  const valores = serie.map((dia) => dia[clave])
  const maximo = Math.max(1, ...valores)
  const x = (indice: number) => (serie.length <= 1 ? ancho / 2 : (indice / (serie.length - 1)) * ancho)
  const y = (valor: number) => alto - 16 - (valor / maximo) * (alto - 40)
  const linea = valores.map((valor, indice) => `${indice ? 'L' : 'M'}${x(indice).toFixed(1)},${y(valor).toFixed(1)}`).join(' ')
  const area = `${linea} L${ancho},${alto} L0,${alto} Z`
  const formato = SERIES.find((serieOpcion) => serieOpcion.clave === clave)!.formato
  const dia = sobre !== null ? serie[sobre] : null

  return (
    <div
      className="relative"
      onMouseLeave={() => setSobre(null)}
      onMouseMove={(evento) => {
        const caja = evento.currentTarget.getBoundingClientRect()
        const proporcion = (evento.clientX - caja.left) / caja.width
        setSobre(Math.max(0, Math.min(serie.length - 1, Math.round(proporcion * (serie.length - 1)))))
      }}
    >
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" className="block h-[220px] w-full md:h-[260px]" aria-hidden="true">
        <defs>
          <linearGradient id="relleno-grafica" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6b8dff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6b8dff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((paso) => (
          <line key={paso} x1="0" x2={ancho} y1={alto * paso} y2={alto * paso} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" />
        ))}
        <motion.path
          key={`area-${clave}-${serie.length}`}
          d={area}
          fill="url(#relleno-grafica)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: CURVA }}
        />
        <motion.path
          key={`linea-${clave}-${serie.length}`}
          d={linea}
          fill="none"
          stroke="#6b8dff"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: CURVA }}
        />
        {sobre !== null && (
          <line x1={x(sobre)} x2={x(sobre)} y1="0" y2={alto} stroke="rgba(255,255,255,0.25)" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <AnimatePresence>
        {dia && sobre !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute top-2 rounded-lg border border-white/12 bg-[#141416] px-3 py-2 text-[12px] shadow-xl"
            style={{ left: `clamp(0px, calc(${(x(sobre) / ancho) * 100}% - 70px), calc(100% - 140px))` }}
          >
            <p className="text-sitio-tenue">
              {new Date(`${dia.fecha}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="mt-0.5 text-[14px] text-white">{formato(dia[clave])}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2 flex justify-between text-[11px] text-sitio-tenue">
        <span>{new Date(`${serie[0]?.fecha}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
        <span>Hoy</span>
      </div>
    </div>
  )
}

/** Cómo le va a la tienda: ventas, pedidos, visitas y, en planes altos, qué se mira y qué se vende. */
export function PantallaEstadisticas() {
  const limites = limitesDe(useSesion().sesion.tenant.plan)
  const [dias, setDias] = useState(Math.min(30, limites.diasMetricas))
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [error, setError] = useState('')
  const [serie, setSerie] = useState<ClaveSerie>('ventas')

  useEffect(() => {
    setMetricas(null)
    obtenerMetricas(dias)
      .then(setMetricas)
      .catch((problema: Error) => setError(problema.message))
  }, [dias])

  const totales = metricas?.totales
  const ticket = totales && totales.pedidos ? totales.ventas / totales.pedidos : 0
  const sinDatos = useMemo(() => metricas && metricas.serie.every((dia) => !dia.visitas && !dia.pedidos), [metricas])

  return (
    <>
      <CabeceraPanel
        titulo="Estadísticas"
        descripcion="Cuánto vendes, cuánta gente entra a tu tienda y qué es lo que más le gusta."
        accion={
          <div className="inline-flex rounded-[10px] border border-sitio-borde bg-white/[0.03] p-1">
            {RANGOS.map((rango) => {
              const bloqueado = rango > limites.diasMetricas
              return (
                <button
                  key={rango}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => setDias(rango)}
                  title={bloqueado ? `Desde el plan ${planMinimo((plan) => plan.diasMetricas >= rango)}` : undefined}
                  className={cn(
                    'relative flex h-8 items-center gap-1 rounded-[7px] px-3 text-[12.5px] transition-colors disabled:cursor-not-allowed',
                    dias === rango ? 'text-white' : 'text-sitio-tenue hover:text-sitio-suave',
                    bloqueado && 'opacity-50',
                  )}
                >
                  {dias === rango && (
                    <motion.span layoutId="rango-metricas" transition={{ duration: 0.45, ease: CURVA }} className="absolute inset-0 rounded-[7px] bg-white/[0.09]" />
                  )}
                  {bloqueado && <Lock aria-hidden="true" className="relative h-2.5 w-2.5" />}
                  <span className="relative">{rango === 365 ? '1 año' : `${rango} días`}</span>
                </button>
              )
            })}
          </div>
        }
      />

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { etiqueta: 'Ventas', valor: totales?.ventas ?? 0, antes: totales?.ventasAntes ?? 0, formato: (n: number) => formatearPrecio(Math.round(n)) },
          { etiqueta: 'Pedidos', valor: totales?.pedidos ?? 0, antes: totales?.pedidosAntes ?? 0 },
          { etiqueta: 'Visitas', valor: totales?.visitas ?? 0, antes: totales?.visitasAntes ?? 0 },
          { etiqueta: 'Ticket promedio', valor: ticket, formato: (n: number) => formatearPrecio(Math.round(n)) },
        ].map((cifra, indice) => (
          <Aparecer key={cifra.etiqueta} orden={indice}>
            <div className="h-full rounded-[16px] border border-sitio-borde bg-sitio-superficie p-5">
              <p className="text-[11.5px] text-sitio-tenue">{cifra.etiqueta}</p>
              <p className="mt-3 truncate text-[clamp(22px,2.6vw,32px)] leading-none tracking-[-0.04em]">
                {metricas ? <Contador key={`${cifra.etiqueta}-${dias}`} valor={cifra.valor} formato={cifra.formato} /> : '—'}
              </p>
              <div className="mt-2.5 min-h-4">{metricas && 'antes' in cifra && <Variacion ahora={cifra.valor} antes={cifra.antes ?? 0} />}</div>
            </div>
          </Aparecer>
        ))}
      </div>

      <Aparecer orden={4} className="mt-4">
        <section className="rounded-[16px] border border-sitio-borde bg-sitio-superficie p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-medium">Por día</h2>
            <div className="inline-flex rounded-[9px] border border-sitio-borde bg-white/5 p-[3px]">
              {SERIES.map((opcion) => (
                <button
                  key={opcion.clave}
                  type="button"
                  onClick={() => setSerie(opcion.clave)}
                  className={cn(
                    'h-7 rounded-md px-3 text-[12px] transition-colors',
                    serie === opcion.clave ? 'bg-white/12 text-white' : 'text-sitio-tenue hover:text-sitio-suave',
                  )}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
          </div>
          {metricas ? (
            <>
              <Grafica serie={metricas.serie} clave={serie} />
              {sinDatos && (
                <p className="mt-4 text-center text-[12.5px] text-sitio-tenue">
                  Todavía no hay movimiento en este período. Comparte tu tienda para empezar a ver datos.
                </p>
              )}
            </>
          ) : (
            <div className="brillo h-[260px] rounded-lg" />
          )}
        </section>
      </Aparecer>

      {metricas && !metricas.avanzadas && (
        <div className="mt-5">
          <Candado plan={planMinimo((plan) => plan.metricasAvanzadas)}>
            Productos más vistos y más vendidos, tasa de conversión y clics a tu WhatsApp.
          </Candado>
        </div>
      )}

      {metricas?.avanzadas && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr]">
          <Aparecer orden={5}>
            <section className="h-full rounded-[16px] border border-sitio-borde bg-sitio-superficie p-6">
              <h2 className="text-[15px] font-medium">Más vistos</h2>
              <Ranking
                filas={metricas.avanzadas.masVistos.map((fila) => ({ nombre: fila.nombre, foto: fila.foto, valor: fila.vistas, texto: `${fila.vistas} vistas` }))}
              />
            </section>
          </Aparecer>
          <Aparecer orden={6}>
            <section className="h-full rounded-[16px] border border-sitio-borde bg-sitio-superficie p-6">
              <h2 className="text-[15px] font-medium">Más vendidos</h2>
              <Ranking
                filas={metricas.avanzadas.masVendidos.map((fila) => ({
                  nombre: fila.nombre,
                  foto: null,
                  valor: fila.ventas,
                  texto: `${fila.unidades} u. · ${formatearPrecio(fila.ventas)}`,
                }))}
              />
            </section>
          </Aparecer>
          <Aparecer orden={7}>
            <section className="flex h-full flex-col gap-4 rounded-[16px] border border-sitio-borde bg-sitio-superficie p-6">
              <div>
                <p className="text-[11.5px] text-sitio-tenue">Conversión</p>
                <p className="mt-2 text-[32px] leading-none tracking-[-0.04em]">
                  <Contador valor={metricas.avanzadas.conversion * 100} formato={(n) => `${n.toFixed(1)}%`} />
                </p>
                <p className="mt-2 text-[11.5px] text-sitio-tenue">De cada 100 visitantes, cuántos te compran.</p>
              </div>
              <div className="border-t border-sitio-borde pt-4">
                <p className="flex items-center gap-1.5 text-[11.5px] text-sitio-tenue">
                  <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 text-[#4ee28a]" />
                  Clics a tu WhatsApp
                </p>
                <p className="mt-2 text-[32px] leading-none tracking-[-0.04em]">
                  <Contador valor={metricas.avanzadas.clicsWhatsapp} />
                </p>
              </div>
            </section>
          </Aparecer>
        </div>
      )}
    </>
  )
}

function Ranking({ filas }: { filas: { nombre: string; foto: string | null; valor: number; texto: string }[] }) {
  const maximo = Math.max(1, ...filas.map((fila) => fila.valor))
  if (filas.length === 0) return <p className="mt-4 text-[12.5px] text-sitio-tenue">Aún sin datos en este período.</p>
  return (
    <ol className="mt-4 flex flex-col gap-3">
      {filas.map((fila, indice) => (
        <li key={fila.nombre} className="flex items-center gap-3">
          <span className="w-4 text-[12px] text-sitio-tenue">{indice + 1}</span>
          {fila.foto && <img src={fila.foto} alt="" className="h-8 w-8 rounded-md object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-3 text-[13px]">
              <span className="truncate">{fila.nombre}</span>
              <span className="shrink-0 text-sitio-tenue">{fila.texto}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-sitio-azul-claro"
                initial={{ width: 0 }}
                animate={{ width: `${(fila.valor / maximo) * 100}%` }}
                transition={{ duration: 1.2, delay: 0.2 + indice * 0.06, ease: CURVA }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
