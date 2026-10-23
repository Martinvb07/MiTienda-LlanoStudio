'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Download, Search } from 'lucide-react'
import { buscarPagos, descargar, detallePago, reembolsarPago, type PagoAdmin, type SesionAdmin } from '@/servicios/admin'
import { PLANES, type Plan } from '@/utilidades/planes'
import { Aviso, BotonPanel, CLASES_ENTRADA, Etiqueta, Interruptor } from '../panel/ui/basicos'
import { ModalPanel, Selector } from '../panel/ui/flotantes'
import { confirmar } from '../panel/ui/confirmar'
import { Cargando, TituloSeccion, Vacio, fecha, pesos } from './ui'

const ESTADOS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'APROBADO', etiqueta: 'Aprobados' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'RECHAZADO', etiqueta: 'Rechazados' },
  { valor: 'ANULADO', etiqueta: 'Reembolsados' },
] as const

const TONO = { APROBADO: 'verde', RECHAZADO: 'ambar', PENDIENTE: 'neutro', ANULADO: 'neutro', ERROR: 'ambar' } as const
const TEXTO = { APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', PENDIENTE: 'Pendiente', ANULADO: 'Reembolsado', ERROR: 'Error' } as const

/** Buscar cualquier pago por referencia, id de Bold o tienda; ver el detalle y reembolsar. */
export function SeccionPagos({ admin, alAbrirTienda }: { admin: SesionAdmin; alAbrirTienda: (id: string) => void }) {
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState('')
  const [pagos, setPagos] = useState<PagoAdmin[] | null>(null)
  const [abierto, setAbierto] = useState<(PagoAdmin & { datosBold: unknown }) | null>(null)
  const [quitarTiempo, setQuitarTiempo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const espera = setTimeout(() => {
      buscarPagos(buscar, estado)
        .then(setPagos)
        .catch((problema: Error) => setError(problema.message))
    }, 250)
    return () => clearTimeout(espera)
  }, [buscar, estado])

  async function reembolsar() {
    if (!abierto) return
    const ok = await confirmar({
      titulo: '¿Marcar como reembolsado?',
      mensaje: 'Esto sólo lo marca aquí. El dinero se devuelve desde el panel de Bold.',
      confirmar: 'Marcar reembolsado',
      peligro: true,
    })
    if (!ok) return
    try {
      await reembolsarPago(abierto.referencia, quitarTiempo)
      setAbierto(null)
      setPagos((lista) => lista?.map((pago) => (pago.referencia === abierto.referencia ? { ...pago, estado: 'ANULADO' } : pago)) ?? null)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo')
    }
  }

  return (
    <>
      <TituloSeccion
        titulo="Pagos"
        descripcion="Todos los cobros de suscripciones. Busca por referencia, id de Bold o tienda."
        accion={
          admin.rol === 'DUENO' && (
            <BotonPanel onClick={() => void descargar('/exportar/pagos', 'mitienda-pagos.csv').catch((e: Error) => setError(e.message))}>
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Exportar CSV
            </BotonPanel>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
        <label className="relative flex-1">
          <Search aria-hidden="true" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sitio-tenue" />
          <input
            value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)}
            placeholder="MT-…, id de Bold o tienda"
            aria-label="Buscar pagos"
            className={`${CLASES_ENTRADA} pl-9`}
          />
        </label>
        <Selector etiqueta="Estado" valor={estado} opciones={ESTADOS} alCambiar={setEstado} className="sm:w-48" />
      </div>

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      {!pagos ? (
        <Cargando />
      ) : pagos.length === 0 ? (
        <Vacio>No hay pagos con esa búsqueda.</Vacio>
      ) : (
        <ul className="divide-y divide-sitio-borde rounded-[14px] border border-sitio-borde bg-sitio-superficie">
          {pagos.map((pago) => (
            <li key={pago.referencia}>
              <button
                type="button"
                onClick={() => void detallePago(pago.referencia).then(setAbierto).catch((e: Error) => setError(e.message))}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_auto_auto]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px]">{pago.tenant.nombre}</span>
                  <span className="block truncate text-[11.5px] text-sitio-tenue">
                    <span className="font-mono">{pago.referencia}</span> · {PLANES[pago.plan as Plan]?.nombre} {pago.periodo === 'ANUAL' ? 'anual' : 'mensual'} ·{' '}
                    {fecha(pago.creadoEn, true)}
                    {pago.cuponCodigo && ` · cupón ${pago.cuponCodigo}`}
                  </span>
                </span>
                <span className="hidden sm:block">
                  <Etiqueta tono={TONO[pago.estado]}>{TEXTO[pago.estado]}</Etiqueta>
                </span>
                <span className="text-right text-[13.5px] tabular-nums">{pesos(pago.monto)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {abierto && (
          <ModalPanel titulo={`Pago ${abierto.referencia}`} alCerrar={() => setAbierto(null)}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[13px]">
              <dt className="text-sitio-tenue">Tienda</dt>
              <dd>
                <button type="button" className="underline-offset-4 hover:underline" onClick={() => alAbrirTienda(abierto.tenant.id)}>
                  {abierto.tenant.nombre}
                </button>
              </dd>
              <dt className="text-sitio-tenue">Estado</dt>
              <dd>
                <Etiqueta tono={TONO[abierto.estado]}>{TEXTO[abierto.estado]}</Etiqueta>
              </dd>
              <dt className="text-sitio-tenue">Plan</dt>
              <dd>
                {PLANES[abierto.plan as Plan]?.nombre} {abierto.periodo === 'ANUAL' ? 'anual' : 'mensual'}
              </dd>
              <dt className="text-sitio-tenue">Monto</dt>
              <dd>
                {pesos(abierto.monto)}
                {abierto.montoOriginal ? <span className="text-sitio-tenue"> (antes {pesos(abierto.montoOriginal)}, cupón {abierto.cuponCodigo})</span> : null}
              </dd>
              <dt className="text-sitio-tenue">Id de Bold</dt>
              <dd className="font-mono text-[12px]">{abierto.idBold ?? '—'}</dd>
              <dt className="text-sitio-tenue">Cubre hasta</dt>
              <dd>{abierto.cubreHasta ? fecha(abierto.cubreHasta) : '—'}</dd>
              <dt className="text-sitio-tenue">Creado</dt>
              <dd>{fecha(abierto.creadoEn, true)}</dd>
            </dl>
            {abierto.datosBold ? (
              <details className="mt-5">
                <summary className="cursor-pointer text-[12px] text-sitio-tenue">Respuesta de Bold</summary>
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-sitio-campo p-3 font-mono text-[11px] text-sitio-suave">
                  {JSON.stringify(abierto.datosBold, null, 2)}
                </pre>
              </details>
            ) : null}
            {abierto.estado === 'APROBADO' && admin.rol === 'DUENO' && (
              <div className="mt-6 flex flex-col gap-3 border-t border-sitio-borde pt-5">
                <Interruptor activo={quitarTiempo} alCambiar={setQuitarTiempo}>
                  Quitarle a la tienda el tiempo que cubría este pago
                </Interruptor>
                <BotonPanel variante="peligro" onClick={() => void reembolsar()} className="self-start">
                  Marcar como reembolsado
                </BotonPanel>
              </div>
            )}
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}
