'use client'

/* eslint-disable @next/next/no-img-element -- logo de la tienda */
import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CalendarPlus, LogIn, Mail, MessageCircle, Trash2, X } from 'lucide-react'
import {
  agregarNota,
  cambiarEtiquetas,
  extenderPlan,
  leerPlantillasWhatsapp,
  obtenerFicha,
  quitarNota,
  tokenParaEntrar,
  type FichaTienda as Ficha,
  type PlanPagoClave,
  type PlantillaWhatsapp,
  type SesionAdmin,
} from '@/servicios/admin'
import { guardarToken } from '@/servicios/panel'
import { urlTienda } from '@/utilidades/dominios'
import { PLANES, type Plan } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, CLASES_ENTRADA, Campo, Etiqueta } from '../panel/ui/basicos'
import { ModalPanel, Selector } from '../panel/ui/flotantes'
import { Desplegable, SALIDA, Vacio, enlaceWhatsapp, fecha, haceCuanto, pesos } from './ui'

export const CLAVE_SOPORTE = 'mitienda:soporte'

const MOTIVOS: Record<string, string> = {
  PAGO: 'Pago',
  ADMIN: 'Cambio del admin',
  VENCIMIENTO: 'Venció sin pago',
  PRUEBA: 'Prueba gratis',
  REFERIDO: 'Premio por referido',
  EXTENSION: 'Extensión',
}
const nombrePlan = (plan: string) => PLANES[plan as Plan]?.nombre ?? plan

function rellenar(texto: string, ficha: Ficha) {
  return texto
    .replaceAll('{nombre}', ficha.duena?.nombre.split(' ')[0] ?? '')
    .replaceAll('{tienda}', ficha.tienda.nombre)
    .replaceAll('{plan}', nombrePlan(ficha.tienda.plan))
}

/** Todo sobre una tienda en un panel lateral: uso, salud, pagos, notas y acciones de soporte. */
export function FichaTienda({ id, admin, alCerrar }: { id: string; admin: SesionAdmin; alCerrar: () => void }) {
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [error, setError] = useState('')
  const [nota, setNota] = useState('')
  const [etiquetaNueva, setEtiquetaNueva] = useState('')
  const [extender, setExtender] = useState(false)
  const [plantillas, setPlantillas] = useState<PlantillaWhatsapp[]>([])
  const escribe = admin.rol !== 'LECTURA'

  useEffect(() => {
    obtenerFicha(id).then(setFicha).catch((e: Error) => setError(e.message))
    leerPlantillasWhatsapp().then(setPlantillas).catch(() => undefined)
    const alTeclear = (evento: KeyboardEvent) => evento.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [id, alCerrar])

  async function guardarNota(evento: FormEvent) {
    evento.preventDefault()
    if (!nota.trim() || !ficha) return
    const nueva = await agregarNota(id, nota.trim())
    setFicha({ ...ficha, notas: [nueva, ...ficha.notas] })
    setNota('')
  }

  async function ponerEtiquetas(etiquetas: string[]) {
    if (!ficha) return
    const guardadas = await cambiarEtiquetas(id, etiquetas)
    setFicha({ ...ficha, tienda: { ...ficha.tienda, etiquetas: guardadas } })
  }

  async function entrar() {
    try {
      const token = await tokenParaEntrar(id)
      guardarToken(token)
      try {
        localStorage.setItem(CLAVE_SOPORTE, ficha?.tienda.nombre ?? 'una tienda')
      } catch {
        // Sin almacenamiento sólo se pierde la franja de aviso.
      }
      window.open('/panel', '_blank')
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo entrar')
    }
  }

  return (
    <div className="fixed inset-0 z-[250] flex justify-end" role="dialog" aria-modal="true" aria-label="Ficha de la tienda">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={alCerrar}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.55, ease: SALIDA }}
        className="relative flex h-full w-full max-w-[620px] flex-col overflow-y-auto border-l border-sitio-borde bg-sitio-fondo"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sitio-borde bg-sitio-fondo/90 px-5 py-4 backdrop-blur">
          <span className="text-[11px] tracking-[0.14em] text-sitio-tenue uppercase">Ficha de tienda</span>
          <button type="button" onClick={alCerrar} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-sitio-suave hover:text-white">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-5">
            <Aviso>{error}</Aviso>
          </div>
        )}
        {!ficha ? (
          !error && <div className="brillo m-5 h-64 rounded-[14px]" />
        ) : (
          <div className="flex flex-col gap-2.5 p-5">
            {/* Cabecera */}
            <div className="flex items-start gap-4 pb-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-[13px] font-semibold text-black">
                {ficha.tienda.logoUrl ? <img src={ficha.tienda.logoUrl} alt="" className="h-full w-full object-contain" /> : ficha.tienda.nombre.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[24px] leading-tight tracking-[-0.03em]">{ficha.tienda.nombre}</h2>
                <a
                  href={urlTienda(ficha.tienda.subdominio)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[12px] text-sitio-tenue hover:text-white"
                >
                  {ficha.tienda.subdominio}
                  <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                </a>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Etiqueta tono="azul">{nombrePlan(ficha.tienda.plan)}</Etiqueta>
                  <Etiqueta tono={!ficha.tienda.activo ? 'ambar' : ficha.tienda.publicada ? 'verde' : 'neutro'}>
                    {!ficha.tienda.activo ? 'Suspendida' : ficha.tienda.publicada ? 'Publicada' : 'Borrador'}
                  </Etiqueta>
                  {ficha.tienda.suscripcion.venceEn && (
                    <span className="text-[11.5px] text-sitio-tenue">
                      {ficha.tienda.suscripcion.estado === 'gracia' ? 'Venció' : 'Paga hasta'} {fecha(ficha.tienda.suscripcion.venceEn)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pb-2">
              {escribe && (
                <BotonPanel variante="primario" onClick={() => void entrar()}>
                  <LogIn aria-hidden="true" className="h-3.5 w-3.5" />
                  Entrar a su panel
                </BotonPanel>
              )}
              {admin.rol === 'DUENO' && (
                <BotonPanel onClick={() => setExtender(true)}>
                  <CalendarPlus aria-hidden="true" className="h-3.5 w-3.5" />
                  Extender plan
                </BotonPanel>
              )}
              {ficha.duena && (
                <a href={`mailto:${ficha.duena.email}`} className="inline-flex h-[34px] items-center gap-[7px] rounded-lg border border-sitio-borde bg-white/[0.04] px-[13px] text-[12.5px] font-medium text-sitio-suave hover:text-white">
                  <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                  Correo
                </a>
              )}
            </div>

            {/* Salud */}
            <div className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11.5px] text-sitio-tenue">Salud de la tienda</p>
                  <p className={cn('mt-1 text-[30px] leading-none tracking-[-0.04em]', ficha.salud.puntaje < 60 && 'text-sitio-ambar')}>
                    {ficha.salud.puntaje}
                    <span className="text-[14px] text-sitio-tenue">/100</span>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-5 text-right text-[12px]">
                  <span>
                    <span className="block text-[18px] tracking-[-0.03em]">{ficha.uso.productos}</span>
                    <span className="text-sitio-tenue">productos</span>
                  </span>
                  <span>
                    <span className="block text-[18px] tracking-[-0.03em]">{ficha.uso.pedidos}</span>
                    <span className="text-sitio-tenue">pedidos</span>
                  </span>
                  <span>
                    <span className="block text-[18px] tracking-[-0.03em]">{ficha.uso.visitas30}</span>
                    <span className="text-sitio-tenue">visitas 30 d</span>
                  </span>
                </div>
              </div>
              {ficha.salud.problemas.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-sitio-borde pt-4">
                  {ficha.salud.problemas.map((problema) => (
                    <li key={problema}>
                      <Etiqueta tono="ambar">{problema}</Etiqueta>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11.5px] text-sitio-tenue">Ventas totales: {pesos(ficha.uso.ventas)}</p>
            </div>

            <Desplegable titulo="Dueña y equipo" resumen={ficha.duena?.email} abierto>
              <ul className="text-[13px]">
                {ficha.equipo.map((persona) => (
                  <li key={persona.id} className="flex items-center justify-between gap-3 border-b border-sitio-borde py-2.5 last:border-0">
                    <span className="min-w-0">
                      <span className="block truncate">{persona.nombre}</span>
                      <span className="block truncate text-[11.5px] text-sitio-tenue">{persona.email}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11.5px] text-sitio-tenue">
                      {persona.rol === 'PROPIETARIO' ? 'Dueña' : persona.rol === 'ADMINISTRADOR' ? 'Admin' : 'Editor'}
                      <span className="block">{persona.ultimoAccesoEn ? `Entró ${haceCuanto(persona.ultimoAccesoEn)}` : 'Nunca entró'}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] text-sitio-tenue">
                Creada el {fecha(ficha.tienda.creadoEn)} · llegó por {ficha.tienda.origen ?? 'directo'}
                {ficha.referidos.invitadaPor && ` (la invitó ${ficha.referidos.invitadaPor.nombre})`}
                {ficha.referidos.invitadas > 0 && ` · invitó a ${ficha.referidos.invitadas}`}
              </p>
            </Desplegable>

            {ficha.tienda.whatsapp && plantillas.length > 0 && (
              <Desplegable titulo="Escribir por WhatsApp" resumen={ficha.tienda.whatsapp}>
                <ul className="flex flex-col gap-2">
                  {plantillas.map((plantilla) => (
                    <li key={plantilla.titulo}>
                      <a
                        href={enlaceWhatsapp(ficha.tienda.whatsapp, rellenar(plantilla.texto, ficha))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 rounded-lg border border-sitio-borde p-3 transition-colors hover:border-sitio-borde-fuerte"
                      >
                        <MessageCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sitio-verde" />
                        <span className="min-w-0">
                          <span className="block text-[13px]">{plantilla.titulo}</span>
                          <span className="line-clamp-2 text-[11.5px] text-sitio-tenue">{rellenar(plantilla.texto, ficha)}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Desplegable>
            )}

            <Desplegable titulo="Etiquetas y notas" resumen={`${ficha.notas.length} notas`} abierto={ficha.notas.length > 0}>
              <div className="flex flex-wrap items-center gap-1.5">
                {ficha.tienda.etiquetas.map((nombre) => (
                  <span key={nombre} className="inline-flex h-7 items-center gap-1 rounded-md border border-sitio-borde px-2.5 text-[11.5px]">
                    #{nombre}
                    {escribe && (
                      <button
                        type="button"
                        aria-label={`Quitar ${nombre}`}
                        onClick={() => void ponerEtiquetas(ficha.tienda.etiquetas.filter((otra) => otra !== nombre))}
                        className="text-sitio-tenue hover:text-white"
                      >
                        <X aria-hidden="true" className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {escribe && (
                  <form
                    onSubmit={(evento) => {
                      evento.preventDefault()
                      const limpia = etiquetaNueva.trim().toLowerCase().replace(/^#/, '')
                      if (limpia) void ponerEtiquetas([...ficha.tienda.etiquetas, limpia])
                      setEtiquetaNueva('')
                    }}
                  >
                    <input
                      value={etiquetaNueva}
                      onChange={(evento) => setEtiquetaNueva(evento.target.value)}
                      placeholder="+ etiqueta (vip, en riesgo…)"
                      aria-label="Nueva etiqueta"
                      maxLength={24}
                      className="h-7 w-48 rounded-md border border-dashed border-sitio-borde bg-transparent px-2.5 text-[11.5px] outline-none placeholder:text-sitio-tenue focus:border-white/40"
                    />
                  </form>
                )}
              </div>
              {escribe && (
                <form onSubmit={(evento) => void guardarNota(evento)} className="mt-4 flex gap-2">
                  <input
                    value={nota}
                    onChange={(evento) => setNota(evento.target.value)}
                    placeholder="Nota interna: pidió factura, es amiga de…"
                    aria-label="Nueva nota"
                    className={CLASES_ENTRADA}
                  />
                  <BotonPanel type="submit" variante="primario">
                    Anotar
                  </BotonPanel>
                </form>
              )}
              <ul className="mt-3">
                {ficha.notas.map((fila) => (
                  <li key={fila.id} className="group flex items-start gap-3 border-b border-sitio-borde py-2.5 last:border-0">
                    <p className="min-w-0 flex-1 text-[13px] whitespace-pre-wrap">
                      {fila.texto}
                      <span className="mt-0.5 block text-[11px] text-sitio-tenue">
                        {fila.autor} · {haceCuanto(fila.creadoEn)}
                      </span>
                    </p>
                    {escribe && (
                      <button
                        type="button"
                        aria-label="Borrar nota"
                        onClick={() =>
                          void quitarNota(id, fila.id).then(() => setFicha({ ...ficha, notas: ficha.notas.filter((otra) => otra.id !== fila.id) }))
                        }
                        className="text-sitio-tenue opacity-0 transition-opacity group-hover:opacity-100 hover:text-sitio-rojo"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Desplegable>

            <Desplegable titulo="Pagos" resumen={`${ficha.pagos.filter((pago) => pago.estado === 'APROBADO').length} aprobados`}>
              {ficha.pagos.length === 0 ? (
                <Vacio>No ha pagado ningún plan.</Vacio>
              ) : (
                <ul className="text-[13px]">
                  {ficha.pagos.map((pago) => (
                    <li key={pago.referencia} className="flex items-center justify-between gap-3 border-b border-sitio-borde py-2.5 last:border-0">
                      <span>
                        {nombrePlan(pago.plan)} {pago.periodo === 'ANUAL' ? 'anual' : 'mensual'}
                        <span className="block text-[11px] text-sitio-tenue">
                          {fecha(pago.creadoEn)} · <span className="font-mono">{pago.referencia}</span>
                        </span>
                      </span>
                      <span className="text-right">
                        {pesos(pago.monto)}
                        <span className="block text-[11px] text-sitio-tenue">{pago.estado.toLowerCase()}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Desplegable>

            <Desplegable titulo="Historial de plan" resumen={`${ficha.historial.length} cambios`}>
              {ficha.historial.length === 0 ? (
                <Vacio>Siempre ha estado en el mismo plan.</Vacio>
              ) : (
                <ul className="text-[13px]">
                  {ficha.historial.map((cambio) => (
                    <li key={cambio.id} className="border-b border-sitio-borde py-2.5 last:border-0">
                      {nombrePlan(cambio.planAnterior)} → {nombrePlan(cambio.planNuevo)}
                      <span className="block text-[11px] text-sitio-tenue">
                        {MOTIVOS[cambio.motivo] ?? cambio.motivo}
                        {cambio.detalle && ` · ${cambio.detalle}`} · {fecha(cambio.creadoEn)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Desplegable>

            <Desplegable titulo="Soporte y actividad" resumen={`${ficha.tickets.length} conversaciones`}>
              {ficha.tickets.length > 0 && (
                <ul className="mb-4 text-[13px]">
                  {ficha.tickets.map((ticket) => (
                    <li key={ticket.id} className="flex justify-between gap-3 border-b border-sitio-borde py-2.5 last:border-0">
                      <span className="truncate">
                        #{ticket.numero} {ticket.asunto}
                      </span>
                      <span className="shrink-0 text-[11.5px] text-sitio-tenue">{ticket.estado.toLowerCase().replace('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              )}
              {ficha.actividad.length === 0 ? (
                <Vacio>Ningún admin ha tocado esta tienda.</Vacio>
              ) : (
                <ul className="text-[12.5px]">
                  {ficha.actividad.map((fila) => (
                    <li key={fila.id} className="border-b border-sitio-borde py-2 last:border-0">
                      {fila.accion}
                      {fila.detalle && <span className="text-sitio-tenue"> · {fila.detalle}</span>}
                      <span className="block text-[11px] text-sitio-tenue">
                        {fila.admin} · {haceCuanto(fila.creadoEn)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Desplegable>
          </div>
        )}
      </motion.aside>

      <AnimatePresence>
        {extender && ficha && (
          <ModalExtender
            ficha={ficha}
            alCerrar={() => setExtender(false)}
            alListo={() => {
              setExtender(false)
              obtenerFicha(id).then(setFicha).catch(() => undefined)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ModalExtender({ ficha, alCerrar, alListo }: { ficha: Ficha; alCerrar: () => void; alListo: () => void }) {
  const [dias, setDias] = useState('15')
  const [plan, setPlan] = useState<PlanPagoClave>(ficha.tienda.plan === 'GRATIS' ? 'EMPRENDE' : (ficha.tienda.plan as PlanPagoClave))
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  async function guardar() {
    try {
      await extenderPlan(ficha.tienda.id, { dias: Number(dias), plan, motivo: motivo || undefined })
      alListo()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo')
    }
  }

  return (
    <ModalPanel titulo="Extender o regalar plan" descripcion={ficha.tienda.nombre} alCerrar={alCerrar}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Días" tipo="number" valor={dias} alCambiar={setDias} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Plan</span>
            <Selector
              etiqueta="Plan"
              valor={plan}
              opciones={(['EMPRENDE', 'NEGOCIO', 'PRO'] as const).map((valor) => ({ valor, etiqueta: PLANES[valor].nombre }))}
              alCambiar={setPlan}
            />
          </div>
        </div>
        <Campo etiqueta="Motivo (queda en el historial)" valor={motivo} alCambiar={setMotivo} marcador="Compensación por la caída del martes" />
        <p className="text-[12px] text-sitio-tenue">Si es el mismo plan que ya paga, los días se suman a lo que le queda.</p>
        {error && <Aviso>{error}</Aviso>}
        <BotonPanel variante="primario" onClick={() => void guardar()} className="self-start">
          Extender {dias} días
        </BotonPanel>
      </div>
    </ModalPanel>
  )
}
