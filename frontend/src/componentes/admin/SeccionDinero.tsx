'use client'

import { ArrowUpRight, Mail } from 'lucide-react'
import { obtenerDinero, type TiendaCorta } from '@/servicios/admin'
import { PLANES, type Plan } from '@/utilidades/planes'
import { Etiqueta } from '../panel/ui/basicos'
import { Barras, Cargando, Cifra, Desplegable, ErrorSeccion, Tarjeta, TituloSeccion, Vacio, fecha, haceCuanto, pesos, useDatos } from './ui'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const nombrePlan = (plan?: string) => (plan ? (PLANES[plan as Plan]?.nombre ?? plan) : '')

/** Fila de una tienda con acciones: abrir su ficha o escribirle a la dueña. */
function FilaTienda({
  tienda,
  detalle,
  alAbrir,
  asunto,
}: {
  tienda: TiendaCorta
  detalle: React.ReactNode
  alAbrir: (id: string) => void
  asunto: string
}) {
  return (
    <li className="flex items-center gap-3 border-b border-sitio-borde py-3 last:border-0">
      <button type="button" onClick={() => alAbrir(tienda.id)} className="group min-w-0 flex-1 text-left">
        <span className="block truncate text-[13.5px] group-hover:underline group-hover:underline-offset-4">{tienda.nombre}</span>
        <span className="block truncate text-[11.5px] text-sitio-tenue">{detalle}</span>
      </button>
      {tienda.duena && (
        <a
          href={`mailto:${tienda.duena.email}?subject=${encodeURIComponent(asunto)}`}
          aria-label={`Escribir a ${tienda.duena.nombre}`}
          title={tienda.duena.email}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sitio-borde text-sitio-suave transition-colors hover:text-white"
        >
          <Mail aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      )}
    </li>
  )
}

/** Plata: lo cobrado, lo recurrente, quién vence, quién está en gracia y quién no terminó de pagar. */
export function SeccionDinero({ alAbrirTienda }: { alAbrirTienda: (id: string) => void }) {
  const { datos, error, recargar } = useDatos(obtenerDinero)

  if (error) return <ErrorSeccion mensaje={error} alReintentar={recargar} />
  if (!datos) return <Cargando alto="h-96" />

  const variacion =
    datos.ingresoMesAnterior > 0 ? Math.round(((datos.ingresoMes - datos.ingresoMesAnterior) / datos.ingresoMesAnterior) * 100) : null

  return (
    <>
      <TituloSeccion titulo="Dinero" descripcion="Lo que entra por las suscripciones pagadas con Bold." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra
          etiqueta="Este mes"
          valor={pesos(datos.ingresoMes)}
          pie={variacion === null ? 'Sin datos del mes pasado' : `${variacion >= 0 ? '+' : ''}${variacion}% frente al mes pasado`}
        />
        <Cifra etiqueta="Ingreso recurrente" valor={pesos(datos.recurrente)} pie="Al mes, con los planes al día" />
        <Cifra etiqueta="Tiendas que pagan" valor={datos.pagadoras} pie="Con el plan al día" />
        <Cifra
          etiqueta="En gracia"
          valor={datos.enGracia.length}
          pie={datos.enGracia.length ? 'Vencidas, aún sin bajar a Gratis' : 'Nadie atrasado'}
          tono={datos.enGracia.length ? 'ambar' : undefined}
        />
      </div>

      <Tarjeta titulo="Ingresos por mes" className="mt-4">
        <Barras
          titulo="Ingresos por mes, últimos 12 meses"
          datos={datos.meses.map((mes) => ({
            etiqueta: `${MESES[Number(mes.mes.slice(5, 7)) - 1]} ${mes.mes.slice(0, 4)}`,
            valor: mes.total,
            detalle: `${mes.cantidad} ${mes.cantidad === 1 ? 'pago' : 'pagos'}`,
          }))}
          formato={pesos}
          etiquetaCorta={(etiqueta) => etiqueta.split(' ')[0]!}
        />
      </Tarjeta>

      <div className="mt-4 flex flex-col gap-2.5">
        <Desplegable
          titulo="Vencen en los próximos 7 días"
          resumen={datos.vencenPronto.length ? `${datos.vencenPronto.length} tiendas` : 'Ninguna'}
          abierto={datos.vencenPronto.length > 0}
        >
          {datos.vencenPronto.length === 0 ? (
            <Vacio>Ninguna tienda vence esta semana.</Vacio>
          ) : (
            <ul>
              {datos.vencenPronto.map((tienda) => (
                <FilaTienda
                  key={tienda.id}
                  tienda={tienda}
                  alAbrir={alAbrirTienda}
                  asunto="Tu plan de Mi Sitio vence pronto"
                  detalle={`${nombrePlan(tienda.plan)} · vence el ${fecha(tienda.planVenceEn!)}`}
                />
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable
          titulo="En gracia"
          resumen={datos.enGracia.length ? `${datos.enGracia.length} tiendas` : 'Ninguna'}
          abierto={datos.enGracia.length > 0}
        >
          {datos.enGracia.length === 0 ? (
            <Vacio>Nadie está en los días de gracia.</Vacio>
          ) : (
            <ul>
              {datos.enGracia.map((tienda) => (
                <FilaTienda
                  key={tienda.id}
                  tienda={tienda}
                  alAbrir={alAbrirTienda}
                  asunto="Tu plan de Mi Sitio venció"
                  detalle={`${nombrePlan(tienda.plan)} · baja a Gratis el ${fecha(tienda.bajaEn)}`}
                />
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable
          titulo="Empezaron a pagar y no terminaron"
          resumen={datos.abandonos.length ? `${datos.abandonos.length} intentos` : 'Ninguno'}
        >
          {datos.abandonos.length === 0 ? (
            <Vacio>Ningún pago a medias en las últimas dos semanas.</Vacio>
          ) : (
            <ul>
              {datos.abandonos.map((pago) => (
                <FilaTienda
                  key={pago.referencia}
                  tienda={pago.tenant}
                  alAbrir={alAbrirTienda}
                  asunto="¿Tuviste algún problema con el pago?"
                  detalle={`${nombrePlan(pago.plan)} ${pago.periodo === 'ANUAL' ? 'anual' : 'mensual'} · ${pesos(pago.monto)} · ${haceCuanto(pago.creadoEn)}`}
                />
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable titulo="Bajaron a Gratis (30 días)" resumen={datos.bajaron.length ? `${datos.bajaron.length}` : 'Ninguna'}>
          {datos.bajaron.length === 0 ? (
            <Vacio>Ninguna tienda bajó por falta de pago este mes.</Vacio>
          ) : (
            <ul>
              {datos.bajaron.map((baja) => (
                <FilaTienda
                  key={`${baja.tenant.id}-${baja.creadoEn}`}
                  tienda={baja.tenant}
                  alAbrir={alAbrirTienda}
                  asunto="Te extrañamos en Mi Sitio"
                  detalle={`Tenía ${nombrePlan(baja.planAnterior)} · ${fecha(baja.creadoEn)}`}
                />
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable titulo="Últimos cobros" resumen={datos.ultimos[0] ? haceCuanto(datos.ultimos[0].creadoEn) : 'Sin cobros'}>
          {datos.ultimos.length === 0 ? (
            <Vacio>Todavía no hay cobros.</Vacio>
          ) : (
            <ul>
              {datos.ultimos.map((pago) => (
                <li key={pago.referencia} className="flex items-center gap-3 border-b border-sitio-borde py-3 last:border-0">
                  <button type="button" onClick={() => alAbrirTienda(pago.tenant.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13.5px]">{pago.tenant.nombre}</span>
                    <span className="text-[11.5px] text-sitio-tenue">
                      {nombrePlan(pago.plan)} {pago.periodo === 'ANUAL' ? 'anual' : 'mensual'} · {fecha(pago.creadoEn)}
                      {pago.cuponCodigo && ` · ${pago.cuponCodigo}`}
                    </span>
                  </button>
                  <Etiqueta tono={pago.estado === 'APROBADO' ? 'verde' : pago.estado === 'RECHAZADO' ? 'ambar' : 'neutro'}>
                    {pago.estado === 'APROBADO' ? 'Aprobado' : pago.estado === 'RECHAZADO' ? 'Rechazado' : pago.estado === 'ANULADO' ? 'Reembolsado' : pago.estado}
                  </Etiqueta>
                  <span className="w-24 text-right text-[13.5px] tabular-nums">{pesos(pago.monto)}</span>
                  <ArrowUpRight aria-hidden="true" className="hidden h-3.5 w-3.5 text-sitio-tenue sm:block" />
                </li>
              ))}
            </ul>
          )}
        </Desplegable>
      </div>
    </>
  )
}
