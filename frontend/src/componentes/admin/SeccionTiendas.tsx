'use client'

/* eslint-disable @next/next/no-img-element -- logos y fotos de tiendas */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Download, KeyRound, LayoutGrid, LayoutTemplate, Link2, List, MoreHorizontal, Power, Search, Store } from 'lucide-react'
import {
  cambiarContrasena,
  cambiarTienda,
  descargar,
  leerTokenAdmin,
  listarTiendas,
  obtenerGaleria,
  obtenerResumen,
  type ResumenAdmin,
  type SesionAdmin,
  type TiendaAdmin,
  type TiendaGaleria,
  type TipoSitioAdmin,
} from '@/servicios/admin'
import { urlTienda } from '@/utilidades/dominios'
import { ORDEN_PLANES, PLANES, type Plan } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, CLASES_ENTRADA, Campo, Segmentado } from '../panel/ui/basicos'
import { MenuAcciones, ModalPanel, Selector } from '../panel/ui/flotantes'
import { confirmar } from '../panel/ui/confirmar'
import { SALIDA } from './ui'

/** Una pestaña por producto, con cómo se llama cada cuenta en ese producto. */
const PRODUCTOS_ADMIN: { tipo: TipoSitioAdmin; titulo: string; ninguna: string; sinPublicadas: string; Icono: typeof Store }[] = [
  { tipo: 'tienda', titulo: 'Tiendas', ninguna: 'Ninguna tienda', sinPublicadas: 'Todavía no hay tiendas publicadas.', Icono: Store },
  { tipo: 'pagina', titulo: 'Páginas', ninguna: 'Ninguna página', sinPublicadas: 'Todavía no hay páginas publicadas.', Icono: LayoutTemplate },
  { tipo: 'enlaces', titulo: 'Enlaces', ninguna: 'Ninguna bio', sinPublicadas: 'Todavía no hay bios publicadas.', Icono: Link2 },
]

const OPCIONES_PLAN = ORDEN_PLANES.map((plan) => ({ valor: plan, etiqueta: PLANES[plan].nombre }))

export function SeccionTiendas({
  admin,
  alSalir,
  alAbrirTienda,
}: {
  admin: SesionAdmin
  alSalir: () => void
  alAbrirTienda: (id: string) => void
}) {
  const dueno = admin.rol === 'DUENO'
  const [vista, setVista] = useState<'lista' | 'galeria'>('lista')
  const [etiqueta, setEtiqueta] = useState<string | null>(null)
  const [tiendas, setTiendas] = useState<TiendaAdmin[] | null>(null)
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [contrasenaDe, setContrasenaDe] = useState<TiendaAdmin | null>(null)
  const [tipo, setTipo] = useState<TipoSitioAdmin>('tienda')
  const producto = PRODUCTOS_ADMIN.find((opcion) => opcion.tipo === tipo)!
  // Cifras de cada producto; se vuelven a pedir cuando algo cambia.
  const [resumenes, setResumenes] = useState<Partial<Record<TipoSitioAdmin, ResumenAdmin>>>({})
  const [version, setVersion] = useState(0)
  const resumen = resumenes[tipo] ?? null

  useEffect(() => {
    for (const { tipo: clave } of PRODUCTOS_ADMIN) {
      obtenerResumen(clave)
        .then((datos) => setResumenes((actuales) => ({ ...actuales, [clave]: datos })))
        .catch(() => undefined)
    }
  }, [version])

  useEffect(() => {
    setTiendas(null)
    setEtiqueta(null)
  }, [tipo])

  useEffect(() => {
    const espera = setTimeout(() => {
      listarTiendas(buscar, tipo)
        .then((lista) => {
          setTiendas(lista)
          setError('')
        })
        .catch((problema: Error) => (leerTokenAdmin() ? setError(problema.message) : alSalir()))
    }, 250)
    return () => clearTimeout(espera)
  }, [buscar, tipo, alSalir])

  async function cambiar(tienda: TiendaAdmin, cambios: { plan?: string; activo?: boolean }) {
    if (
      cambios.activo === false &&
      !(await confirmar({
        titulo: `¿Suspender "${tienda.nombre}"?`,
        mensaje: 'Deja de verse y su dueño no podrá entrar.',
        confirmar: 'Suspender',
        peligro: true,
      }))
    )
      return
    setCambiando(tienda.id)
    try {
      const actualizado = await cambiarTienda(tienda.id, cambios)
      setTiendas((lista) => lista?.map((otra) => (otra.id === tienda.id ? { ...otra, ...actualizado } : otra)) ?? null)
      setVersion((actual) => actual + 1)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    } finally {
      setCambiando(null)
    }
  }

  const etiquetas = [...new Set((tiendas ?? []).flatMap((tienda) => tienda.etiquetas))].sort()
  const visibles = (tiendas ?? []).filter((tienda) => !etiqueta || tienda.etiquetas.includes(etiqueta))

  const cifras = [
    { valor: resumen?.tiendas, etiqueta: producto.titulo },
    { valor: resumen?.publicadas, etiqueta: 'Publicadas' },
    { valor: resumen?.nuevasEstaSemana, etiqueta: 'Nuevas esta semana' },
    tipo === 'tienda'
      ? { valor: resumen?.productos, etiqueta: 'Productos' }
      : tipo === 'enlaces'
        ? { valor: resumen?.enlaces, etiqueta: 'Botones en total' }
        : { valor: resumen?.suspendidas, etiqueta: 'Suspendidas' },
  ]

  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h1 className="text-[clamp(30px,3.6vw,48px)] leading-none tracking-[-0.045em]">{producto.titulo}</h1>
        <p className="text-[13px] text-white/45">
          {ORDEN_PLANES.map((plan) => `${PLANES[plan].nombre} ${resumen?.porPlan[plan] ?? 0}`).join(' · ')}
          {resumen?.suspendidas ? ` · ${resumen.suspendidas} suspendidas` : ''}
        </p>
      </div>

      <div role="tablist" aria-label="Producto" className="mt-7 flex gap-1 overflow-x-auto border-b border-white/10">
        {PRODUCTOS_ADMIN.map(({ tipo: clave, titulo, Icono }) => {
          const elegido = clave === tipo
          return (
            <button
              key={clave}
              type="button"
              role="tab"
              aria-selected={elegido}
              onClick={() => setTipo(clave)}
              className={cn(
                'relative inline-flex h-11 shrink-0 items-center gap-2 px-3.5 text-[13.5px] transition-colors duration-300',
                elegido ? 'text-white' : 'text-white/50 hover:text-white',
              )}
            >
              <Icono aria-hidden="true" strokeWidth={1.6} className="h-4 w-4" />
              {titulo}
              <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', elegido ? 'bg-white/[0.12]' : 'bg-white/[0.06]')}>
                {resumenes[clave]?.tiendas ?? '·'}
              </span>
              {elegido && (
                <motion.span
                  layoutId="pestana-producto-admin"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-white"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 border-y border-white/10 md:grid-cols-4">
        {cifras.map((cifra, indice) => (
          <div key={cifra.etiqueta} className={cn('py-6', indice > 0 && 'md:border-l md:border-white/10 md:pl-7', indice % 2 === 1 && 'border-l border-white/10 pl-6')}>
            <p className="text-[clamp(32px,3.4vw,44px)] leading-none tracking-[-0.045em]">{cifra.valor ?? '—'}</p>
            <p className="mt-2 text-[12px] text-white/45">{cifra.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Segmentado
          opciones={[
            { valor: 'lista', etiqueta: <List aria-hidden="true" className="h-3.5 w-3.5" />, titulo: 'Lista' },
            { valor: 'galeria', etiqueta: <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" />, titulo: 'Galería de publicadas' },
          ]}
          valor={vista}
          alCambiar={setVista}
        />
        {dueno && (
          <div className="flex gap-2">
            <BotonPanel onClick={() => void descargar('/exportar/tiendas', 'mitienda-tiendas.csv').catch((e: Error) => setError(e.message))}>
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Tiendas CSV
            </BotonPanel>
            <BotonPanel onClick={() => void descargar('/exportar/correos', 'mitienda-correos.csv').catch((e: Error) => setError(e.message))}>
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Correos CSV
            </BotonPanel>
          </div>
        )}
      </div>

      {vista === 'galeria' ? (
        <Galeria key={tipo} tipo={tipo} vacio={producto.sinPublicadas} alAbrirTienda={alAbrirTienda} />
      ) : (
      <>
      <div className="relative mt-4">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={buscar}
          onChange={(evento) => setBuscar(evento.target.value)}
          placeholder="Buscar por nombre, dirección o correo del dueño"
          className={cn(CLASES_ENTRADA, 'h-11 !pl-10 text-[14px]')}
        />
      </div>

      {etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {etiquetas.map((nombre) => (
            <button
              key={nombre}
              type="button"
              aria-pressed={etiqueta === nombre}
              onClick={() => setEtiqueta(etiqueta === nombre ? null : nombre)}
              className={cn(
                'h-7 rounded-md border px-2.5 text-[11.5px] transition-colors',
                etiqueta === nombre ? 'border-white bg-white text-black' : 'border-sitio-borde text-sitio-suave hover:text-white',
              )}
            >
              #{nombre}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>{error && <div className="mt-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>

      <div className="mt-4">
        {!tiendas ? (
          <div className="brillo h-48 rounded-[10px]" />
        ) : visibles.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/45">
            {buscar ? `${producto.ninguna} coincide con la búsqueda.` : `Todavía no hay ${producto.titulo.toLowerCase()}.`}
          </p>
        ) : (
          <ul className="border-b border-white/10">
            <AnimatePresence initial={false}>
              {visibles.map((tienda, indice) => (
                <motion.li
                  key={tienda.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: Math.min(indice, 10) * 0.03, ease: SALIDA }}
                  className={cn(
                    'grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-3 border-t border-white/10 py-4 md:grid-cols-[2fr_1.6fr_0.7fr_1fr_140px_40px]',
                    !tienda.activo && 'opacity-50',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-white text-[11px] font-semibold text-black">
                      {tienda.logoUrl ? <img src={tienda.logoUrl} alt="" className="h-full w-full object-contain" /> : tienda.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <button
                        type="button"
                        onClick={() => alAbrirTienda(tienda.id)}
                        className="block max-w-full truncate text-left text-[14.5px] underline-offset-4 hover:underline"
                      >
                        {tienda.nombre}
                      </button>
                      {tienda.etiquetas.length > 0 && (
                        <span className="ml-0 block truncate text-[10.5px] text-sitio-tenue">
                          {tienda.etiquetas.map((nombre) => `#${nombre}`).join(' ')}
                        </span>
                      )}
                      <a
                        href={urlTienda(tienda.subdominio)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 truncate font-mono text-[11.5px] text-white/40 transition-colors hover:text-white"
                      >
                        {tienda.subdominio}
                        <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                      </a>
                    </span>
                  </div>
                  <div className="hidden min-w-0 md:block">
                    <span className="block truncate text-[13.5px]">{tienda.propietario?.nombre ?? '—'}</span>
                    <span className="block truncate text-[12px] text-white/40">{tienda.propietario?.email}</span>
                  </div>
                  <span className="hidden text-[13px] text-white/60 md:block">
                    {tienda.tipo === 'tienda' ? `${tienda.productos} prod.` : tienda.enlaces !== undefined ? `${tienda.enlaces} enlaces` : '—'}
                  </span>
                  <span className="hidden text-[12px] md:block">
                    <span
                      aria-hidden="true"
                      className="estado-punto mr-2.5 inline-block align-middle"
                      data-tono={!tienda.activo ? 'ambar' : tienda.publicada ? 'verde' : 'neutro'}
                    />
                    <span className="text-white/70">{!tienda.activo ? 'Suspendida' : tienda.publicada ? 'Publicada' : 'Borrador'}</span>
                    <span className="mt-0.5 block pl-3.5 text-[11px] text-white/35">
                      Desde {new Date(tienda.creadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                    {tienda.planVenceEn && (
                      <span
                        className={cn(
                          'mt-0.5 block pl-3.5 text-[11px]',
                          new Date(tienda.planVenceEn).getTime() < Date.now() ? 'text-sitio-ambar' : 'text-white/35',
                        )}
                      >
                        Pago hasta {new Date(tienda.planVenceEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </span>
                  <Selector
                    etiqueta={`Plan de ${tienda.nombre}`}
                    valor={tienda.plan as Plan}
                    opciones={OPCIONES_PLAN}
                    deshabilitado={cambiando === tienda.id || !dueno}
                    alCambiar={(plan) => void cambiar(tienda, { plan })}
                    className="col-start-1 w-[140px] md:col-start-auto"
                  />
                  <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
                    <MenuAcciones
                      disparador={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />}
                      acciones={[
                        {
                          etiqueta: 'Abrir ficha',
                          icono: <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />,
                          alElegir: () => alAbrirTienda(tienda.id),
                        },
                        {
                          etiqueta: 'Cambiar contraseña',
                          icono: <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />,
                          alElegir: () => setContrasenaDe(tienda),
                        },
                        {
                          etiqueta: 'Ver tienda',
                          icono: <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />,
                          alElegir: () => window.open(urlTienda(tienda.subdominio), '_blank', 'noopener'),
                        },
                        ...(dueno ? [{
                          etiqueta: tienda.activo ? 'Suspender' : 'Reactivar',
                          icono: <Power aria-hidden="true" className="h-3.5 w-3.5" />,
                          peligro: tienda.activo,
                          alElegir: () => void cambiar(tienda, { activo: !tienda.activo }),
                        }] : []),
                      ]}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      </>
      )}

      <AnimatePresence>
        {contrasenaDe && <ModalContrasena tienda={contrasenaDe} alCerrar={() => setContrasenaDe(null)} />}
      </AnimatePresence>
    </>
  )
}

function ModalContrasena({ tienda, alCerrar }: { tienda: TiendaAdmin; alCerrar: () => void }) {
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [listo, setListo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    if (contrasena.length < 8) return setError('Tiene que tener al menos 8 caracteres.')
    setEnviando(true)
    setError('')
    try {
      setListo(await cambiarContrasena(tienda.id, contrasena))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalPanel
      titulo="Cambiar contraseña"
      descripcion={
        <>
          Dueño de <span className="text-white">{tienda.nombre}</span>
          {tienda.propietario && <> · {tienda.propietario.email}</>}
        </>
      }
      alCerrar={alCerrar}
    >
      {listo ? (
        <div>
          <p className="text-[14px] leading-relaxed text-white/75">
            Listo. <span className="text-white">{listo}</span> ya puede entrar con la contraseña nueva. Compártela por un
            canal privado y pídele que la cambie cuando exista esa opción.
          </p>
          <button type="button" onClick={alCerrar} className="boton boton-primario boton-chico mt-6 w-full">
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <Campo etiqueta="Contraseña nueva" tipo="text" valor={contrasena} alCambiar={setContrasena} autoFoco ayuda="Mínimo 8 caracteres." />
          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
          <button type="submit" disabled={enviando} className="boton boton-primario boton-chico w-full">
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </ModalPanel>
  )
}

/** Las publicadas de la pestaña elegida, en miniatura: para ver cómo quedan y elegir ejemplos para la web. */
function Galeria({ tipo, vacio, alAbrirTienda }: { tipo: TipoSitioAdmin; vacio: string; alAbrirTienda: (id: string) => void }) {
  const [tiendas, setTiendas] = useState<TiendaGaleria[] | null>(null)
  useEffect(() => {
    obtenerGaleria(tipo).then(setTiendas).catch(() => setTiendas([]))
  }, [tipo])

  if (!tiendas) return <div className="brillo mt-4 h-64 rounded-[14px]" />
  if (tiendas.length === 0) return <p className="mt-10 text-center text-sm text-sitio-tenue">{vacio}</p>

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiendas.map((tienda, indice) => (
        <motion.article
          key={tienda.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: Math.min(indice, 12) * 0.03, ease: SALIDA }}
          className="group overflow-hidden rounded-[14px] border border-sitio-borde bg-sitio-superficie"
        >
          <div className="grid aspect-[16/10] grid-cols-2 grid-rows-2 gap-px bg-sitio-borde">
            {[0, 1, 2, 3].map((posicion) => (
              <div key={posicion} className="overflow-hidden bg-sitio-campo">
                {tienda.fotos[posicion] && (
                  <img
                    src={tienda.fotos[posicion]}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-salida group-hover:scale-105"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-[10px] font-semibold text-black">
              {tienda.logoUrl ? <img src={tienda.logoUrl} alt="" className="h-full w-full object-contain" /> : tienda.nombre.slice(0, 2).toUpperCase()}
            </span>
            <button type="button" onClick={() => alAbrirTienda(tienda.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13.5px]">{tienda.nombre}</span>
              <span className="text-[11px] text-sitio-tenue">
                {PLANES[tienda.plan as Plan]?.nombre} · {tienda.plantilla}
                {tienda.tipo === 'tienda' && ` · ${tienda.productos} productos · ${tienda.pedidos} pedidos`}
              </span>
            </button>
            <a
              href={urlTienda(tienda.subdominio)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${tienda.nombre}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sitio-borde text-sitio-suave hover:text-white"
            >
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
