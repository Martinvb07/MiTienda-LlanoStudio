'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, MoreHorizontal, Pencil, Plus, Shuffle, Ticket, Trash2 } from 'lucide-react'
import { ErrorPanel, eliminarCupon, guardarCupon, listarCupones } from '@/servicios/panel'
import type { Cupon, DatosCupon, TipoCupon } from '@/tipos/pedidos'
import { formatearPrecio } from '@/utilidades/formato'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { Aviso, BotonPanel, CURVA, Campo, Candado, Etiqueta, Interruptor, Segmentado } from './ui/basicos'
import { MenuAcciones, ModalPanel } from './ui/flotantes'
import { Aparecer } from './ui/movimiento'
import { confirmar } from './ui/confirmar'

function describir(cupon: Pick<Cupon, 'tipo' | 'valor'>) {
  if (cupon.tipo === 'PORCENTAJE') return `${Number(cupon.valor)}% de descuento`
  if (cupon.tipo === 'FIJO') return `${formatearPrecio(cupon.valor)} de descuento`
  return 'Envío gratis'
}

function estadoDe(cupon: Cupon): { texto: string; tono: 'verde' | 'ambar' | 'neutro' } {
  if (!cupon.activo) return { texto: 'Pausado', tono: 'neutro' }
  if (cupon.venceEn && new Date(cupon.venceEn).getTime() < Date.now()) return { texto: 'Vencido', tono: 'ambar' }
  if (cupon.usosMaximos !== null && cupon.usos >= cupon.usosMaximos) return { texto: 'Agotado', tono: 'ambar' }
  return { texto: 'Activo', tono: 'verde' }
}

const codigoAleatorio = () =>
  Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')

/** Cupones de descuento: porcentaje, valor fijo o envío gratis, con mínimo, usos y vencimiento. */
export function PantallaDescuentos() {
  const limites = limitesDe(useSesion().sesion.tenant.plan)
  const [cupones, setCupones] = useState<Cupon[] | null>(null)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState<Cupon | null | undefined>(undefined)
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    listarCupones()
      .then(setCupones)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  const activos = (cupones ?? []).filter((cupon) => cupon.activo).length
  const sinCupones = limites.cupones === 0
  const lleno = limites.cupones !== null && activos >= limites.cupones

  function reemplazar(cupon: Cupon) {
    setCupones((lista) => {
      const actual = lista ?? []
      return actual.some((otro) => otro.id === cupon.id)
        ? actual.map((otro) => (otro.id === cupon.id ? cupon : otro))
        : [cupon, ...actual]
    })
  }

  async function alternar(cupon: Cupon) {
    setError('')
    try {
      reemplazar(
        await guardarCupon(
          {
            codigo: cupon.codigo,
            tipo: cupon.tipo,
            valor: Number(cupon.valor),
            minimo: cupon.minimo ? Number(cupon.minimo) : null,
            usosMaximos: cupon.usosMaximos,
            venceEn: cupon.venceEn,
            activo: !cupon.activo,
          },
          cupon.id,
        ),
      )
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    }
  }

  async function eliminar(cupon: Cupon) {
    if (!(await confirmar({ titulo: `¿Eliminar el cupón ${cupon.codigo}?`, mensaje: 'Quien lo tenga ya no podrá usarlo.', confirmar: 'Eliminar', peligro: true }))) return
    try {
      await eliminarCupon(cupon.id)
      setCupones((lista) => (lista ?? []).filter((otro) => otro.id !== cupon.id))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo eliminar')
    }
  }

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(codigo)
      setTimeout(() => setCopiado(''), 1500)
    } catch {
      // Sin portapapeles: el código está a la vista.
    }
  }

  return (
    <>
      <CabeceraPanel
        titulo="Descuentos"
        descripcion={
          sinCupones
            ? 'Crea códigos de descuento para tus clientes.'
            : limites.cupones === null
              ? 'Códigos de descuento sin límite en tu plan.'
              : `Llevas ${activos} de ${limites.cupones} cupones activos en tu plan ${limites.nombre}.`
        }
        accion={
          <BotonPanel variante="primario" disabled={sinCupones || lleno} onClick={() => setEditando(null)} className="h-10 px-5">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Nuevo cupón
          </BotonPanel>
        }
      />

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

      {(sinCupones || lleno) && (
        <div className="mb-5">
          <Candado plan={planMinimo((plan) => plan.cupones === null || plan.cupones > (sinCupones ? 0 : activos))}>
            {sinCupones
              ? 'Los cupones de descuento no están en tu plan.'
              : `Tienes los ${limites.cupones} cupones activos que admite tu plan. Pausa uno para crear otro.`}
          </Candado>
        </div>
      )}

      {!cupones ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="brillo h-40 rounded-[16px]" />
          ))}
        </div>
      ) : cupones.length === 0 ? (
        <Aparecer>
          <div className="relative isolate grid place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/15 px-6 py-20 text-center">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,96,255,0.16),transparent_60%)]" />
            <Ticket aria-hidden="true" className="h-9 w-9 text-sitio-tenue" strokeWidth={1.4} />
            <p className="mt-4 text-2xl tracking-[-0.03em]">Todavía no tienes cupones</p>
            <p className="mt-2 max-w-sm text-sm text-sitio-tenue">
              Crea uno como BIENVENIDA10 y compártelo en tus redes: el cliente lo escribe al pagar.
            </p>
          </div>
        </Aparecer>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {cupones.map((cupon, indice) => {
              const estado = estadoDe(cupon)
              return (
                <motion.li
                  key={cupon.id}
                  layout
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, delay: Math.min(indice, 8) * 0.04, ease: CURVA }}
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-[16px] border bg-sitio-superficie p-5',
                    cupon.activo ? 'border-sitio-borde' : 'border-sitio-borde opacity-60',
                  )}
                >
                  {/* Muescas de ticket a los lados */}
                  <span aria-hidden="true" className="absolute top-[58px] -left-2 h-4 w-4 rounded-full border border-sitio-borde bg-black" />
                  <span aria-hidden="true" className="absolute top-[58px] -right-2 h-4 w-4 rounded-full border border-sitio-borde bg-black" />
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void copiar(cupon.codigo)}
                      className="group flex items-center gap-2 font-mono text-[18px] tracking-[0.04em]"
                      title="Copiar código"
                    >
                      {cupon.codigo}
                      {copiado === cupon.codigo ? (
                        <Check aria-hidden="true" className="h-3.5 w-3.5 text-sitio-verde" />
                      ) : (
                        <Copy aria-hidden="true" className="h-3.5 w-3.5 text-sitio-tenue opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                    <MenuAcciones
                      disparador={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />}
                      acciones={[
                        { etiqueta: 'Editar', icono: <Pencil aria-hidden="true" className="h-3.5 w-3.5" />, alElegir: () => setEditando(cupon) },
                        { etiqueta: 'Eliminar', icono: <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />, peligro: true, alElegir: () => void eliminar(cupon) },
                      ]}
                    />
                  </div>
                  <div className="my-4 border-t border-dashed border-sitio-borde" />
                  <p className="text-[15px]">{describir(cupon)}</p>
                  <p className="mt-1 text-[12px] text-sitio-tenue">
                    {[
                      cupon.minimo ? `Desde ${formatearPrecio(cupon.minimo)}` : 'Sin mínimo',
                      cupon.venceEn ? `vence ${new Date(cupon.venceEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-[12px] text-sitio-suave">
                      {cupon.usos} {cupon.usosMaximos !== null ? `de ${cupon.usosMaximos} usos` : cupon.usos === 1 ? 'uso' : 'usos'}
                    </span>
                    <span className="flex items-center gap-2.5">
                      <Etiqueta tono={estado.tono}>{estado.texto}</Etiqueta>
                      <Interruptor activo={cupon.activo} alCambiar={() => void alternar(cupon)}>
                        <span className="sr-only">{cupon.activo ? 'Pausar' : 'Activar'}</span>
                      </Interruptor>
                    </span>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {editando !== undefined && (
          <FormularioCupon
            cupon={editando}
            alGuardar={(cupon) => {
              reemplazar(cupon)
              setEditando(undefined)
            }}
            alCerrar={() => setEditando(undefined)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function FormularioCupon({
  cupon,
  alGuardar,
  alCerrar,
}: {
  cupon: Cupon | null
  alGuardar: (cupon: Cupon) => void
  alCerrar: () => void
}) {
  const [codigo, setCodigo] = useState(cupon?.codigo ?? '')
  const [tipo, setTipo] = useState<TipoCupon>(cupon?.tipo ?? 'PORCENTAJE')
  const [valor, setValor] = useState(cupon ? String(Number(cupon.valor)) : '10')
  const [minimo, setMinimo] = useState(cupon?.minimo ? String(Number(cupon.minimo)) : '')
  const [usos, setUsos] = useState(cupon?.usosMaximos ? String(cupon.usosMaximos) : '')
  const [vence, setVence] = useState(cupon?.venceEn ? cupon.venceEn.slice(0, 10) : '')
  const [activo, setActivo] = useState(cupon?.activo ?? true)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const digitos = (texto: string) => texto.replace(/\D/g, '').slice(0, 10)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const datos: DatosCupon = {
      codigo: codigo.trim().toUpperCase(),
      tipo,
      valor: tipo === 'ENVIO_GRATIS' ? 0 : Number(valor) || 0,
      minimo: minimo ? Number(minimo) : null,
      usosMaximos: usos ? Number(usos) : null,
      // Vence al final de ese día.
      venceEn: vence ? new Date(`${vence}T23:59:59`).toISOString() : null,
      activo,
    }
    setEnviando(true)
    setError('')
    try {
      alGuardar(await guardarCupon(datos, cupon?.id))
    } catch (problema) {
      if (problema instanceof ErrorPanel && Object.keys(problema.campos).length) setErrores(problema.campos)
      else setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalPanel titulo={cupon ? 'Editar cupón' : 'Nuevo cupón'} descripcion="El cliente lo escribe al pagar." alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Campo
              etiqueta="Código"
              valor={codigo}
              alCambiar={(texto) => setCodigo(texto.toUpperCase().replace(/\s/g, ''))}
              marcador="BIENVENIDA10"
              error={errores.codigo}
              maximo={30}
              autoFoco
            />
          </div>
          <BotonPanel onClick={() => setCodigo(codigoAleatorio())} title="Generar uno" className="mb-px h-[38px]">
            <Shuffle aria-hidden="true" className="h-3.5 w-3.5" />
          </BotonPanel>
        </div>
        <Segmentado
          opciones={[
            { valor: 'PORCENTAJE', etiqueta: 'Porcentaje' },
            { valor: 'FIJO', etiqueta: 'Valor fijo' },
            { valor: 'ENVIO_GRATIS', etiqueta: 'Envío gratis' },
          ]}
          valor={tipo}
          alCambiar={setTipo}
          chico
        />
        {tipo !== 'ENVIO_GRATIS' && (
          <Campo
            etiqueta={tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Valor'}
            prefijo={tipo === 'PORCENTAJE' ? '%' : '$'}
            valor={valor}
            alCambiar={(texto) => setValor(digitos(texto))}
            error={errores.valor}
          />
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Campo etiqueta="Compra mínima" prefijo="$" valor={minimo} alCambiar={(texto) => setMinimo(digitos(texto))} marcador="Opcional" />
          <Campo etiqueta="Usos máximos" valor={usos} alCambiar={(texto) => setUsos(digitos(texto).slice(0, 6))} marcador="Sin límite" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vence-cupon" className="text-[11.5px] text-sitio-suave">
            Vence el (opcional)
          </label>
          <input
            id="vence-cupon"
            type="date"
            value={vence}
            onChange={(evento) => setVence(evento.target.value)}
            className="rounded-lg border border-sitio-borde bg-sitio-campo px-[11px] py-[9px] text-[13.5px] text-white outline-none [color-scheme:dark] focus:border-white/40"
          />
        </div>
        <Interruptor activo={activo} alCambiar={setActivo}>
          Activo
        </Interruptor>
        <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
        <BotonPanel type="submit" variante="primario" disabled={enviando || !codigo} className="mt-1 h-10">
          {enviando ? 'Guardando…' : cupon ? 'Guardar cambios' : 'Crear cupón'}
        </BotonPanel>
      </form>
    </ModalPanel>
  )
}
