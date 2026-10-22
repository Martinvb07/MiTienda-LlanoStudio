'use client'

/* eslint-disable @next/next/no-img-element -- logos de tiendas en la lista */
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, KeyRound, LogOut, MoreHorizontal, Power, Search } from 'lucide-react'
import {
  cambiarContrasena,
  cambiarTienda,
  cerrarSesionAdmin,
  ingresarAdmin,
  leerTokenAdmin,
  listarTiendas,
  obtenerResumen,
  type ResumenAdmin,
  type TiendaAdmin,
} from '@/servicios/admin'
import { urlTienda } from '@/utilidades/dominios'
import { ORDEN_PLANES, PLANES, type Plan } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, CLASES_ENTRADA, Campo } from '../panel/ui/basicos'
import { MenuAcciones, ModalPanel, Selector } from '../panel/ui/flotantes'
import { EditorPlanes } from './EditorPlanes'

const SALIDA = [0.16, 1, 0.3, 1] as const
const OPCIONES_PLAN = ORDEN_PLANES.map((plan) => ({ valor: plan, etiqueta: PLANES[plan].nombre }))

/** Panel de la plataforma (sólo Llano Studio): tiendas, planes y precios. */
export function PantallaAdmin() {
  const [listo, setListo] = useState(false)
  const [conSesion, setConSesion] = useState(false)

  useEffect(() => {
    setConSesion(Boolean(leerTokenAdmin()))
    setListo(true)
  }, [])

  return (
    <div className="marco-oscuro min-h-screen font-sans">
      {listo &&
        (conSesion ? (
          <Tablero
            alSalir={() => {
              cerrarSesionAdmin()
              setConSesion(false)
            }}
          />
        ) : (
          <Ingreso alEntrar={() => setConSesion(true)} />
        ))}
    </div>
  )
}

function Ingreso({ alEntrar }: { alEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await ingresarAdmin(email, contrasena)
      alEntrar()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo ingresar')
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <motion.form
        onSubmit={enviar}
        initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, ease: SALIDA }}
        className="w-full max-w-[380px]"
      >
        <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-8 w-auto" />
        <p className="antetitulo mt-8">Mi Tienda · Plataforma</p>
        <h1 className="mt-3 text-[40px] leading-none tracking-[-0.045em]">Administración</h1>
        <div className="mt-9 flex flex-col gap-4">
          <Campo etiqueta="Correo" tipo="email" valor={email} alCambiar={setEmail} autoFoco autoCompletar="username" />
          <Campo etiqueta="Contraseña" tipo="password" valor={contrasena} alCambiar={setContrasena} autoCompletar="current-password" />
          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
          <button type="submit" disabled={enviando} className="boton boton-primario mt-2 w-full">
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

type Pestana = 'tiendas' | 'planes'

function Tablero({ alSalir }: { alSalir: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('tiendas')
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null)

  const recargarResumen = useCallback(() => {
    obtenerResumen()
      .then(setResumen)
      .catch(() => (leerTokenAdmin() ? undefined : alSalir()))
  }, [alSalir])

  useEffect(recargarResumen, [recargarResumen])

  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-20 md:px-8">
      <header className="sticky top-0 z-40 -mx-5 flex h-[72px] items-center justify-between gap-4 border-b border-white/[0.06] bg-black/80 px-5 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex items-center gap-[11px]">
          <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-7 w-auto" />
          <span className="flex flex-col">
            <span className="text-[15px] leading-none font-semibold tracking-[-0.02em]">Mi Tienda</span>
            <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">Plataforma</span>
          </span>
        </div>

        <nav className="flex gap-1 rounded-full border border-white/10 p-1">
          {(['tiendas', 'planes'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setPestana(opcion)}
              className={cn(
                'relative rounded-full px-4 py-1.5 text-[12.5px] transition-colors',
                pestana === opcion ? 'text-black' : 'text-white/60 hover:text-white',
              )}
            >
              {pestana === opcion && (
                <motion.span
                  layoutId="pestana-admin"
                  transition={{ duration: 0.5, ease: SALIDA }}
                  className="absolute inset-0 rounded-full bg-white"
                />
              )}
              <span className="relative">{opcion === 'tiendas' ? 'Tiendas' : 'Planes y precios'}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={alSalir}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.1em] text-white/50 uppercase transition-colors hover:text-white"
        >
          <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={pestana}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          transition={{ duration: 0.7, ease: SALIDA }}
        >
          {pestana === 'tiendas' ? (
            <Tiendas resumen={resumen} alCambio={recargarResumen} alSalir={alSalir} />
          ) : (
            <EditorPlanes />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Tiendas({
  resumen,
  alCambio,
  alSalir,
}: {
  resumen: ResumenAdmin | null
  alCambio: () => void
  alSalir: () => void
}) {
  const [tiendas, setTiendas] = useState<TiendaAdmin[] | null>(null)
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [contrasenaDe, setContrasenaDe] = useState<TiendaAdmin | null>(null)

  useEffect(() => {
    const espera = setTimeout(() => {
      listarTiendas(buscar)
        .then((lista) => {
          setTiendas(lista)
          setError('')
        })
        .catch((problema: Error) => (leerTokenAdmin() ? setError(problema.message) : alSalir()))
    }, 250)
    return () => clearTimeout(espera)
  }, [buscar, alSalir])

  async function cambiar(tienda: TiendaAdmin, cambios: { plan?: string; activo?: boolean }) {
    if (cambios.activo === false && !confirm(`¿Suspender "${tienda.nombre}"? Deja de verse y su dueño no podrá entrar.`)) return
    setCambiando(tienda.id)
    try {
      const actualizado = await cambiarTienda(tienda.id, cambios)
      setTiendas((lista) => lista?.map((otra) => (otra.id === tienda.id ? { ...otra, ...actualizado } : otra)) ?? null)
      alCambio()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    } finally {
      setCambiando(null)
    }
  }

  const cifras = [
    { valor: resumen?.tiendas, etiqueta: 'Tiendas' },
    { valor: resumen?.publicadas, etiqueta: 'Publicadas' },
    { valor: resumen?.nuevasEstaSemana, etiqueta: 'Nuevas esta semana' },
    { valor: resumen?.productos, etiqueta: 'Productos' },
  ]

  return (
    <>
      <div className="mt-12 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h1 className="text-[clamp(34px,4.4vw,60px)] leading-none tracking-[-0.045em]">Tiendas</h1>
        <p className="text-[13px] text-white/45">
          {ORDEN_PLANES.map((plan) => `${PLANES[plan].nombre} ${resumen?.porPlan[plan] ?? 0}`).join(' · ')}
          {resumen?.suspendidas ? ` · ${resumen.suspendidas} suspendidas` : ''}
        </p>
      </div>

      <div className="mt-9 grid grid-cols-2 border-y border-white/10 md:grid-cols-4">
        {cifras.map((cifra, indice) => (
          <div key={cifra.etiqueta} className={cn('py-6', indice > 0 && 'md:border-l md:border-white/10 md:pl-7', indice % 2 === 1 && 'border-l border-white/10 pl-6')}>
            <p className="text-[clamp(32px,3.4vw,44px)] leading-none tracking-[-0.045em]">{cifra.valor ?? '—'}</p>
            <p className="mt-2 text-[12px] text-white/45">{cifra.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-10">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={buscar}
          onChange={(evento) => setBuscar(evento.target.value)}
          placeholder="Buscar por nombre, dirección o correo del dueño"
          className={cn(CLASES_ENTRADA, 'h-11 !pl-10 text-[14px]')}
        />
      </div>

      <AnimatePresence>{error && <div className="mt-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>

      <div className="mt-4">
        {!tiendas ? (
          <div className="brillo h-48 rounded-[10px]" />
        ) : tiendas.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/45">
            {buscar ? 'Ninguna tienda coincide con la búsqueda.' : 'Todavía no hay tiendas.'}
          </p>
        ) : (
          <ul className="border-b border-white/10">
            <AnimatePresence initial={false}>
              {tiendas.map((tienda, indice) => (
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
                      <span className="block truncate text-[14.5px]">{tienda.nombre}</span>
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
                  <span className="hidden text-[13px] text-white/60 md:block">{tienda.productos} prod.</span>
                  <span className="hidden text-[12px] md:block">
                    <span
                      className={cn(
                        'mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle',
                        !tienda.activo ? 'bg-sitio-ambar' : tienda.publicada ? 'bg-sitio-verde' : 'bg-white/30',
                      )}
                    />
                    <span className="text-white/70">{!tienda.activo ? 'Suspendida' : tienda.publicada ? 'Publicada' : 'Borrador'}</span>
                    <span className="mt-0.5 block pl-3.5 text-[11px] text-white/35">
                      Desde {new Date(tienda.creadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <Selector
                    etiqueta={`Plan de ${tienda.nombre}`}
                    valor={tienda.plan as Plan}
                    opciones={OPCIONES_PLAN}
                    deshabilitado={cambiando === tienda.id}
                    alCambiar={(plan) => void cambiar(tienda, { plan })}
                    className="col-start-1 w-[140px] md:col-start-auto"
                  />
                  <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
                    <MenuAcciones
                      disparador={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />}
                      acciones={[
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
                        {
                          etiqueta: tienda.activo ? 'Suspender' : 'Reactivar',
                          icono: <Power aria-hidden="true" className="h-3.5 w-3.5" />,
                          peligro: tienda.activo,
                          alElegir: () => void cambiar(tienda, { activo: !tienda.activo }),
                        },
                      ]}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

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
