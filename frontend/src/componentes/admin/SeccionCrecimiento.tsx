'use client'

import { motion } from 'motion/react'
import { obtenerCrecimiento } from '@/servicios/admin'
import { PLANES, type Plan } from '@/utilidades/planes'
import { Barras, BarrasHorizontales, Cargando, Cifra, Desplegable, ErrorSeccion, SALIDA, Tarjeta, TituloSeccion, Vacio, fecha, useDatos } from './ui'

const nombrePlan = (plan: string) => PLANES[plan as Plan]?.nombre ?? plan
const NOMBRES_BLOQUE: Record<string, string> = {
  hero: 'Portada',
  'grilla-productos': 'Productos',
  texto: 'Texto',
  pie: 'Pie de página',
  espaciador: 'Espaciador',
  lienzo: 'Lienzo libre',
  anuncio: 'Barra de anuncio',
  carrusel: 'Carrusel',
  categorias: 'Categorías',
  'imagen-texto': 'Imagen con texto',
  columnas: 'Columnas',
  preguntas: 'Preguntas',
  galeria: 'Galería',
  'banner-doble': 'Banner doble',
  llamado: 'Llamado',
  testimonios: 'Testimonios',
  video: 'Video',
  logos: 'Logos',
  mapa: 'Mapa',
  'cuenta-regresiva': 'Cuenta regresiva',
}

/** Embudo de registro a pago, registros por día y qué usan las tiendas. */
export function SeccionCrecimiento() {
  const { datos, error, recargar } = useDatos(obtenerCrecimiento)
  if (error) return <ErrorSeccion mensaje={error} alReintentar={recargar} />
  if (!datos) return <Cargando alto="h-96" />

  const registros30 = datos.registrosPorDia.slice(-30).reduce((suma, dia) => suma + dia.registros, 0)
  const registrosAntes = datos.registrosPorDia.slice(-60, -30).reduce((suma, dia) => suma + dia.registros, 0)
  const tope = datos.embudo[0]?.cantidad || 1
  const pagaron = datos.embudo.at(-1)?.cantidad ?? 0

  return (
    <>
      <TituloSeccion titulo="Crecimiento" descripcion="Dónde se queda la gente entre registrarse y pagar." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra etiqueta="Registros (30 días)" valor={registros30} pie={`${registrosAntes} los 30 días anteriores`} />
        <Cifra etiqueta="Conversión a pago" valor={`${Math.round((pagaron / tope) * 100)}%`} pie={`${pagaron} de ${tope} tiendas`} />
        <Cifra etiqueta="Subieron de plan (90 días)" valor={datos.subidas} tono={datos.subidas ? 'verde' : undefined} />
        <Cifra etiqueta="Bajaron de plan (90 días)" valor={datos.bajas.length} tono={datos.bajas.length ? 'ambar' : undefined} />
      </div>

      <Tarjeta titulo="Embudo" className="mt-4">
        <ol className="flex flex-col gap-3">
          {datos.embudo.map((paso, indice) => {
            const anterior = indice > 0 ? datos.embudo[indice - 1]!.cantidad : null
            return (
              <li key={paso.paso} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-[13px]">
                <span className="truncate text-sitio-suave">{paso.paso}</span>
                <span className="h-7 overflow-hidden rounded-md bg-white/[0.05]">
                  <motion.span
                    className="block h-full rounded-md bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${(paso.cantidad / tope) * 100}%` }}
                    transition={{ duration: 1, delay: indice * 0.08, ease: SALIDA }}
                  />
                </span>
                <span className="w-28 text-right tabular-nums">
                  {paso.cantidad}
                  {anterior ? <span className="ml-1.5 text-[11.5px] text-sitio-tenue">{Math.round((paso.cantidad / anterior) * 100)}%</span> : null}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="mt-4 text-[11.5px] text-sitio-tenue">El porcentaje es contra el paso anterior: el más bajo es donde más gente se pierde.</p>
      </Tarjeta>

      <Tarjeta titulo="Registros por día (90 días)" className="mt-4">
        <Barras
          titulo="Registros por día, últimos 90 días"
          datos={datos.registrosPorDia.map((dia) => ({ etiqueta: fecha(`${dia.dia}T12:00:00`), valor: dia.registros }))}
          formato={(valor) => `${valor} ${valor === 1 ? 'registro' : 'registros'}`}
          etiquetaCorta={(etiqueta, indice) => (indice % 15 === 0 ? etiqueta.split(' de ').slice(0, 2).join(' ').replace(/ \d{4}$/, '') : null)}
          alto={130}
        />
      </Tarjeta>

      <div className="mt-4 flex flex-col gap-2.5">
        <Desplegable titulo="De dónde llegan" resumen={datos.origenes[0]?.nombre} abierto>
          {datos.origenes.length === 0 ? <Vacio>Sin datos todavía.</Vacio> : <BarrasHorizontales datos={datos.origenes} />}
          <p className="mt-3 text-[11.5px] text-sitio-tenue">
            Se toma de <span className="font-mono">?utm_source=</span> en el enlace con el que llegan (por ejemplo, el de tu bio de Instagram) o de un enlace de referido.
          </p>
        </Desplegable>
        <Desplegable titulo="Plantillas más usadas" resumen={datos.plantillas[0]?.nombre}>
          <BarrasHorizontales datos={datos.plantillas} />
        </Desplegable>
        <Desplegable titulo="Secciones más usadas" resumen={NOMBRES_BLOQUE[datos.bloques[0]?.nombre ?? ''] ?? datos.bloques[0]?.nombre}>
          <BarrasHorizontales datos={datos.bloques.map((bloque) => ({ ...bloque, nombre: NOMBRES_BLOQUE[bloque.nombre] ?? bloque.nombre }))} />
        </Desplegable>
        <Desplegable titulo="Quién bajó de plan" resumen={`${datos.bajas.length} en 90 días`}>
          {datos.bajas.length === 0 ? (
            <Vacio>Nadie bajó de plan.</Vacio>
          ) : (
            <ul className="text-[13px]">
              {datos.bajas.map((baja) => (
                <li key={`${baja.tenant.id}-${baja.creadoEn}`} className="flex justify-between gap-3 border-b border-sitio-borde py-2.5 last:border-0">
                  <span className="truncate">{baja.tenant.nombre}</span>
                  <span className="shrink-0 text-[11.5px] text-sitio-tenue">
                    {nombrePlan(baja.planAnterior)} → {nombrePlan(baja.planNuevo)} · {baja.motivo === 'VENCIMIENTO' ? 'no pagó' : 'admin'} · {fecha(baja.creadoEn)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Desplegable>
      </div>
    </>
  )
}
