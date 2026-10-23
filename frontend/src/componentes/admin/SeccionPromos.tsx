'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  eliminarCuponSuscripcion,
  guardarCuponSuscripcion,
  guardarPromos,
  leerPromos,
  listarCuponesSuscripcion,
  type CuponSuscripcion,
  type DatosCuponSuscripcion,
  type PlanPagoClave,
  type Promos,
  type SesionAdmin,
} from '@/servicios/admin'
import { PLANES } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, CLASES_ENTRADA, Campo, Etiqueta, Interruptor } from '../panel/ui/basicos'
import { ModalPanel, Selector } from '../panel/ui/flotantes'
import { confirmar } from '../panel/ui/confirmar'
import { Cargando, Desplegable, TituloSeccion, Vacio, fecha } from './ui'

const PLANES_PAGO: PlanPagoClave[] = ['EMPRENDE', 'NEGOCIO', 'PRO']
const OPCIONES_PLAN = PLANES_PAGO.map((plan) => ({ valor: plan, etiqueta: PLANES[plan].nombre }))

const CUPON_VACIO: DatosCuponSuscripcion = {
  codigo: '',
  porcentaje: 20,
  planes: [],
  usosMaximos: null,
  venceEn: null,
  activo: true,
}

/** Prueba gratis para las nuevas, referidos y cupones de descuento sobre los planes. */
export function SeccionPromos({ admin }: { admin: SesionAdmin }) {
  const dueno = admin.rol === 'DUENO'
  const [promos, setPromos] = useState<Promos | null>(null)
  const [cupones, setCupones] = useState<CuponSuscripcion[] | null>(null)
  const [editando, setEditando] = useState<{ datos: DatosCuponSuscripcion; id?: string } | null>(null)
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    leerPromos().then(setPromos).catch((e: Error) => setError(e.message))
    listarCuponesSuscripcion().then(setCupones).catch((e: Error) => setError(e.message))
  }, [])

  async function guardar() {
    if (!promos) return
    try {
      await guardarPromos({ prueba: promos.prueba, referidos: promos.referidos })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 1800)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    }
  }

  async function guardarCupon() {
    if (!editando) return
    try {
      const cupon = await guardarCuponSuscripcion(editando.datos, editando.id)
      setCupones((lista) => (editando.id ? (lista ?? []).map((otro) => (otro.id === cupon.id ? cupon : otro)) : [cupon, ...(lista ?? [])]))
      setEditando(null)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar el cupón')
    }
  }

  async function borrar(cupon: CuponSuscripcion) {
    if (!(await confirmar({ titulo: `¿Eliminar ${cupon.codigo}?`, mensaje: 'Ya no se podrá usar.', confirmar: 'Eliminar', peligro: true }))) return
    await eliminarCuponSuscripcion(cupon.id)
    setCupones((lista) => lista?.filter((otro) => otro.id !== cupon.id) ?? null)
  }

  return (
    <>
      <TituloSeccion titulo="Promociones" descripcion="Atrae tiendas nuevas y premia a las que invitan a otras." />
      <AnimatePresence>{error && <div className="mb-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>

      {!promos ? (
        <Cargando />
      ) : (
        <div className="flex flex-col gap-2.5">
          <Desplegable
            titulo="Prueba gratis"
            resumen={promos.prueba.activa ? `${promos.prueba.dias} días de ${PLANES[promos.prueba.plan].nombre}` : 'Apagada'}
            abierto
          >
            <p className="mb-4 text-[13px] text-sitio-tenue">
              Cada tienda nueva arranca con un plan pago por unos días. Al terminar le avisamos y, si no paga, pasa a Gratis tras los 5 días de gracia.
            </p>
            <div className="flex flex-col gap-4">
              <Interruptor activo={promos.prueba.activa} alCambiar={(activa) => setPromos({ ...promos, prueba: { ...promos.prueba, activa } })}>
                Dar prueba gratis a las tiendas nuevas
              </Interruptor>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] text-sitio-suave">Plan</span>
                  <Selector
                    etiqueta="Plan de la prueba"
                    valor={promos.prueba.plan}
                    opciones={OPCIONES_PLAN}
                    alCambiar={(plan) => setPromos({ ...promos, prueba: { ...promos.prueba, plan } })}
                  />
                </div>
                <Campo
                  etiqueta="Días"
                  tipo="number"
                  valor={promos.prueba.dias}
                  alCambiar={(valor) => setPromos({ ...promos, prueba: { ...promos.prueba, dias: Number(valor) || 1 } })}
                />
              </div>
            </div>
          </Desplegable>

          <Desplegable titulo="Referidos" resumen={promos.referidos.activa ? `${promos.referidos.dias} días por invitada` : 'Apagado'}>
            <p className="mb-4 text-[13px] text-sitio-tenue">
              Cada tienda tiene un enlace para invitar (en su panel, Plan y pagos). Cuando la invitada paga su primer plan, la que invitó gana días: si estaba en Gratis, recibe Emprende.
            </p>
            <div className="flex flex-col gap-4">
              <Interruptor
                activo={promos.referidos.activa}
                alCambiar={(activa) => setPromos({ ...promos, referidos: { ...promos.referidos, activa } })}
              >
                Programa de referidos activo
              </Interruptor>
              <Campo
                etiqueta="Días de regalo por cada invitada que pague"
                tipo="number"
                valor={promos.referidos.dias}
                alCambiar={(valor) => setPromos({ ...promos, referidos: { ...promos.referidos, dias: Number(valor) || 1 } })}
              />
              {promos.topReferidos && promos.topReferidos.length > 0 && (
                <div>
                  <p className="mb-2 text-[11.5px] text-sitio-suave">Las que más invitan</p>
                  <ul className="text-[13px]">
                    {promos.topReferidos.map((fila) => (
                      <li key={fila.tienda?.id} className="flex justify-between border-b border-sitio-borde py-2 last:border-0">
                        <span>{fila.tienda?.nombre ?? '—'}</span>
                        <span className="text-sitio-tenue">{fila.invitadas} invitadas</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Desplegable>

          {dueno && (
            <div className="flex items-center gap-3">
              <BotonPanel variante="primario" onClick={() => void guardar()}>
                Guardar promociones
              </BotonPanel>
              {guardado && <span className="text-[12.5px] text-sitio-verde">Guardado</span>}
            </div>
          )}

          <Desplegable titulo="Cupones de suscripción" resumen={cupones ? `${cupones.filter((c) => c.activo).length} activos` : ''} abierto>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[13px] text-sitio-tenue">Descuentos que las tiendas escriben al pagar su plan con Bold.</p>
              {dueno && (
                <BotonPanel onClick={() => setEditando({ datos: CUPON_VACIO })}>
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  Nuevo cupón
                </BotonPanel>
              )}
            </div>
            {!cupones ? (
              <Cargando alto="h-20" />
            ) : cupones.length === 0 ? (
              <Vacio>Aún no hay cupones. Crea uno como LANZAMIENTO50.</Vacio>
            ) : (
              <ul>
                {cupones.map((cupon) => {
                  const vencido = cupon.venceEn && new Date(cupon.venceEn) < new Date()
                  const agotado = cupon.usosMaximos !== null && cupon.usos >= cupon.usosMaximos
                  return (
                    <li key={cupon.id} className="flex items-center gap-3 border-b border-sitio-borde py-3 last:border-0">
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[13.5px]">{cupon.codigo}</span>
                        <span className="text-[11.5px] text-sitio-tenue">
                          {cupon.porcentaje}% · {cupon.planes.length ? cupon.planes.map((p) => PLANES[p].nombre).join(', ') : 'todos los planes'} ·{' '}
                          {cupon.usos}
                          {cupon.usosMaximos !== null ? `/${cupon.usosMaximos}` : ''} usos
                          {cupon.venceEn && ` · vence ${fecha(cupon.venceEn)}`}
                        </span>
                      </span>
                      <Etiqueta tono={!cupon.activo ? 'neutro' : vencido || agotado ? 'ambar' : 'verde'}>
                        {!cupon.activo ? 'Pausado' : vencido ? 'Vencido' : agotado ? 'Agotado' : 'Activo'}
                      </Etiqueta>
                      {dueno && (
                        <>
                          <button
                            type="button"
                            aria-label={`Editar ${cupon.codigo}`}
                            onClick={() => setEditando({ id: cupon.id, datos: { ...cupon } })}
                            className="grid h-8 w-8 place-items-center rounded-lg text-sitio-tenue hover:text-white"
                          >
                            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar ${cupon.codigo}`}
                            onClick={() => void borrar(cupon)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-sitio-tenue hover:text-sitio-rojo"
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Desplegable>
        </div>
      )}

      <AnimatePresence>
        {editando && (
          <ModalPanel titulo={editando.id ? 'Editar cupón' : 'Nuevo cupón'} alCerrar={() => setEditando(null)}>
            <div className="flex flex-col gap-4">
              <Campo
                etiqueta="Código"
                valor={editando.datos.codigo}
                alCambiar={(codigo) => setEditando({ ...editando, datos: { ...editando.datos, codigo: codigo.toUpperCase().replace(/\s/g, '') } })}
                marcador="LANZAMIENTO50"
                maximo={24}
              />
              <div className="grid grid-cols-2 gap-4">
                <Campo
                  etiqueta="Descuento (%)"
                  tipo="number"
                  valor={editando.datos.porcentaje}
                  alCambiar={(valor) => setEditando({ ...editando, datos: { ...editando.datos, porcentaje: Math.min(100, Number(valor) || 0) } })}
                />
                <Campo
                  etiqueta="Usos máximos (vacío = sin límite)"
                  tipo="number"
                  valor={editando.datos.usosMaximos ?? ''}
                  alCambiar={(valor) => setEditando({ ...editando, datos: { ...editando.datos, usosMaximos: valor ? Number(valor) : null } })}
                />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] text-sitio-suave">Vence (opcional)</span>
                <input
                  type="date"
                  value={editando.datos.venceEn?.slice(0, 10) ?? ''}
                  onChange={(evento) =>
                    setEditando({ ...editando, datos: { ...editando.datos, venceEn: evento.target.value ? new Date(`${evento.target.value}T23:59:59`).toISOString() : null } })
                  }
                  className={CLASES_ENTRADA}
                />
              </label>
              <div>
                <span className="text-[11.5px] text-sitio-suave">Planes (ninguno marcado = todos)</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLANES_PAGO.map((plan) => {
                    const marcado = editando.datos.planes.includes(plan)
                    return (
                      <button
                        key={plan}
                        type="button"
                        aria-pressed={marcado}
                        onClick={() =>
                          setEditando({
                            ...editando,
                            datos: {
                              ...editando.datos,
                              planes: marcado ? editando.datos.planes.filter((p) => p !== plan) : [...editando.datos.planes, plan],
                            },
                          })
                        }
                        className={cn(
                          'h-8 rounded-lg border px-3 text-[12.5px] transition-colors',
                          marcado ? 'border-white bg-white text-black' : 'border-sitio-borde text-sitio-suave hover:text-white',
                        )}
                      >
                        {PLANES[plan].nombre}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Interruptor activo={editando.datos.activo} alCambiar={(activo) => setEditando({ ...editando, datos: { ...editando.datos, activo } })}>
                Activo
              </Interruptor>
              <BotonPanel variante="primario" onClick={() => void guardarCupon()} className="self-start">
                Guardar cupón
              </BotonPanel>
            </div>
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}
