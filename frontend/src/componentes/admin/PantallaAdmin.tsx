'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  BadgeDollarSign,
  BarChart3,
  ChevronDown,
  CreditCard,
  FileText,
  Gift,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Server,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'
import {
  cerrarSesionAdmin,
  leerTokenAdmin,
  listarTickets,
  obtenerResumen,
  quienSoy,
  type ResumenAdmin,
  type SesionAdmin,
} from '@/servicios/admin'
import { cn } from '@/utilidades/clases'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'
import { BotonTema } from '@/componentes/comunes/BotonTema'
import { useHojaAbierta } from '@/componentes/comunes/hojaAbierta'
import { EditorPlanes } from './EditorPlanes'
import { FichaTienda } from './FichaTienda'
import { SeccionComunicacion } from './SeccionComunicacion'
import { SeccionContenido } from './SeccionContenido'
import { SeccionCrecimiento } from './SeccionCrecimiento'
import { SeccionDinero } from './SeccionDinero'
import { SeccionEquipo, ROLES } from './SeccionEquipo'
import { SeccionPagos } from './SeccionPagos'
import { SeccionPromos } from './SeccionPromos'
import { SeccionSistema } from './SeccionSistema'
import { SeccionSoporte } from './SeccionSoporte'
import { SeccionTiendas } from './SeccionTiendas'
import { SALIDA } from './ui'

const SECCIONES = [
  { clave: 'dinero', etiqueta: 'Dinero', Icono: BadgeDollarSign, grupo: 'Negocio' },
  { clave: 'tiendas', etiqueta: 'Tiendas', Icono: Store, grupo: 'Negocio' },
  { clave: 'soporte', etiqueta: 'Soporte', Icono: MessagesSquare, grupo: 'Negocio' },
  { clave: 'pagos', etiqueta: 'Pagos', Icono: CreditCard, grupo: 'Negocio' },
  { clave: 'crecimiento', etiqueta: 'Crecimiento', Icono: BarChart3, grupo: 'Negocio' },
  { clave: 'promos', etiqueta: 'Promociones', Icono: Gift, grupo: 'Crecer' },
  { clave: 'comunicacion', etiqueta: 'Comunicación', Icono: Megaphone, grupo: 'Crecer' },
  { clave: 'contenido', etiqueta: 'Contenido', Icono: FileText, grupo: 'Crecer' },
  { clave: 'planes', etiqueta: 'Planes y precios', Icono: Sparkles, grupo: 'Plataforma' },
  { clave: 'sistema', etiqueta: 'Sistema', Icono: Server, grupo: 'Plataforma' },
  { clave: 'equipo', etiqueta: 'Equipo', Icono: Users, grupo: 'Plataforma' },
] as const

type Clave = (typeof SECCIONES)[number]['clave']
const GRUPOS = [...new Set(SECCIONES.map((seccion) => seccion.grupo))]
/** Las que van como pestañas en el celular; el resto, en la hoja "Más". */
const PESTANAS: Clave[] = ['dinero', 'tiendas', 'soporte', 'pagos']

function seccionDeLaUrl(): Clave {
  const valor = new URLSearchParams(window.location.search).get('s')
  return SECCIONES.some((seccion) => seccion.clave === valor) ? (valor as Clave) : 'dinero'
}

/**
 * Admin de la plataforma (Llano Studio). Se entra por el login normal del
 * panel con los datos de un admin; cada sección respeta el rol.
 */
export function PantallaAdmin() {
  const router = useRouter()
  const [admin, setAdmin] = useState<SesionAdmin | null>(null)

  const salir = useCallback(() => {
    cerrarSesionAdmin()
    router.replace('/panel/ingresar')
  }, [router])

  useEffect(() => {
    if (!leerTokenAdmin()) return router.replace('/panel/ingresar')
    quienSoy()
      .then(setAdmin)
      .catch(() => salir())
  }, [router, salir])

  return (
    <div className="marco-oscuro min-h-screen font-sans">
      {admin ? (
        <Tablero admin={admin} alSalir={salir} />
      ) : (
        <div className="grid min-h-screen place-items-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-white" />
        </div>
      )}
    </div>
  )
}

function Tablero({ admin, alSalir }: { admin: SesionAdmin; alSalir: () => void }) {
  const [seccion, setSeccion] = useState<Clave>('dinero')
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null)
  const [ficha, setFicha] = useState<string | null>(null)
  const [sinLeer, setSinLeer] = useState(0)
  const [mas, setMas] = useState(false)

  useEffect(() => setSeccion(seccionDeLaUrl()), [])

  const ir = (clave: Clave) => {
    setSeccion(clave)
    setMas(false)
    window.history.replaceState(null, '', `?s=${clave}`)
    window.scrollTo({ top: 0 })
  }

  const recargarResumen = useCallback(() => {
    obtenerResumen()
      .then(setResumen)
      .catch(() => (leerTokenAdmin() ? undefined : alSalir()))
  }, [alSalir])
  useEffect(recargarResumen, [recargarResumen])

  // Mensajes sin leer en soporte, para el globo del menú y el título de la pestaña.
  useEffect(() => {
    const contar = () =>
      listarTickets()
        .then(({ tickets }) => setSinLeer(tickets.reduce((suma, ticket) => suma + ticket.noLeidosAsesor, 0)))
        .catch(() => undefined)
    contar()
    const intervalo = setInterval(contar, 30_000)
    return () => clearInterval(intervalo)
  }, [])
  useEffect(() => {
    document.title = sinLeer > 0 ? `(${sinLeer}) Admin · Mi Tienda` : 'Admin · Mi Tienda'
  }, [sinLeer])

  const abrirTienda = useCallback((id: string) => setFicha(id), [])

  return (
    <div className="flex min-h-screen flex-col md:pl-[248px]">
      {/* Barra lateral: fija, para que nunca se corte al bajar. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] shrink-0 flex-col border-r border-sitio-borde bg-sitio-lateral md:flex">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-[11px]">
            <LogoMarca className="h-7 w-auto" />
            <span className="flex flex-col">
              <span className="text-[15px] leading-none font-semibold tracking-[-0.02em]">Mi Tienda</span>
              <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">Plataforma</span>
            </span>
          </div>
          <BotonTema />
        </div>

        <nav className="mt-7 flex-1 overflow-y-auto px-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo} className="mb-5">
              <p className="px-3 pb-2 text-[9.5px] tracking-[0.16em] text-sitio-tenue uppercase">{grupo}</p>
              <ul className="flex flex-col gap-0.5">
                {SECCIONES.filter((item) => item.grupo === grupo).map((item) => {
                  const activo = seccion === item.clave
                  return (
                    <li key={item.clave}>
                      <button
                        type="button"
                        onClick={() => ir(item.clave)}
                        aria-current={activo ? 'page' : undefined}
                        className={cn(
                          'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-300',
                          activo ? 'text-white' : 'text-sitio-suave hover:text-white',
                        )}
                      >
                        {activo && (
                          <motion.span
                            layoutId="admin-activo"
                            transition={{ duration: 0.5, ease: SALIDA }}
                            className="absolute inset-0 rounded-lg border border-white/[0.07] bg-white/[0.07]"
                          />
                        )}
                        <item.Icono aria-hidden="true" strokeWidth={1.6} className="relative h-4 w-4 shrink-0" />
                        <span className="relative">{item.etiqueta}</span>
                        {item.clave === 'soporte' && sinLeer > 0 && (
                          <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-sitio-azul px-1.5 text-[10.5px] font-semibold text-[#fff]">
                            {sinLeer}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-sitio-borde p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11.5px] font-semibold">
            {admin.nombre.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px]">{admin.nombre}</span>
            <span className="block truncate text-[11px] text-sitio-tenue">{ROLES[admin.rol].etiqueta}</span>
          </span>
          <button type="button" onClick={alSalir} aria-label="Salir" className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-white">
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Celular: barra superior */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-sitio-borde bg-black/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <LogoMarca className="h-6 w-auto" />
        <span className="min-w-0 flex-1">
          <span className="block text-[9.5px] tracking-[0.16em] text-sitio-tenue uppercase">Plataforma</span>
          <span className="block truncate text-[14px] leading-tight font-medium">{SECCIONES.find((item) => item.clave === seccion)?.etiqueta}</span>
        </span>
        <BotonTema />
      </header>

      <main className="mx-auto w-full max-w-[1180px] min-w-0 flex-1 px-4 pt-8 pb-32 sm:px-6 md:px-10 md:pb-24 md:pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={seccion}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.55, ease: SALIDA }}
          >
            {seccion === 'dinero' && <SeccionDinero alAbrirTienda={abrirTienda} />}
            {seccion === 'tiendas' && (
              <SeccionTiendas admin={admin} resumen={resumen} alCambio={recargarResumen} alSalir={alSalir} alAbrirTienda={abrirTienda} />
            )}
            {seccion === 'soporte' && <SeccionSoporte admin={admin} alAbrirTienda={abrirTienda} alPendientes={setSinLeer} />}
            {seccion === 'pagos' && <SeccionPagos admin={admin} alAbrirTienda={abrirTienda} />}
            {seccion === 'crecimiento' && <SeccionCrecimiento />}
            {seccion === 'promos' && <SeccionPromos admin={admin} />}
            {seccion === 'comunicacion' && <SeccionComunicacion admin={admin} />}
            {seccion === 'contenido' && <SeccionContenido admin={admin} />}
            {seccion === 'planes' && <EditorPlanes />}
            {seccion === 'sistema' && <SeccionSistema admin={admin} />}
            {seccion === 'equipo' && <SeccionEquipo admin={admin} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <NavegacionMovil admin={admin} seccion={seccion} sinLeer={sinLeer} mas={mas} alMas={setMas} alIr={ir} alSalir={alSalir} />

      <AnimatePresence>{ficha && <FichaTienda key={ficha} id={ficha} admin={admin} alCerrar={() => setFicha(null)} />}</AnimatePresence>
    </div>
  )
}

/** Celular: pestañas flotantes abajo, como el panel de los dueños, y una hoja con el resto por grupos. */
function NavegacionMovil({
  admin,
  seccion,
  sinLeer,
  mas,
  alMas,
  alIr,
  alSalir,
}: {
  admin: SesionAdmin
  seccion: Clave
  sinLeer: number
  mas: boolean
  alMas: (abierto: boolean) => void
  alIr: (clave: Clave) => void
  alSalir: () => void
}) {
  const enMas = !PESTANAS.includes(seccion)
  const grupoActual = SECCIONES.find((item) => item.clave === seccion)?.grupo
  const [grupo, setGrupo] = useState<string | undefined>(grupoActual)

  useEffect(() => {
    if (mas) setGrupo(grupoActual)
  }, [mas, grupoActual])

  useHojaAbierta(mas, () => alMas(false))

  return (
    <>
      <nav
        aria-label="Secciones del admin"
        className="fixed bottom-3 left-1/2 z-40 grid w-[calc(100%-1.5rem)] max-w-[420px] -translate-x-1/2 grid-cols-5 rounded-2xl border border-white/10 bg-sitio-modal/90 p-1.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,1)] backdrop-blur-xl md:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PESTANAS.map((clave) => {
          const item = SECCIONES.find((seccionItem) => seccionItem.clave === clave)!
          const activo = seccion === clave
          return (
            <button
              key={clave}
              type="button"
              onClick={() => alIr(clave)}
              aria-current={activo ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] transition-colors duration-300',
                activo ? 'text-white' : 'text-sitio-tenue',
              )}
            >
              {activo && (
                <motion.span
                  layoutId="admin-pestana"
                  transition={{ duration: 0.5, ease: SALIDA }}
                  className="absolute inset-0 rounded-xl bg-white/[0.08]"
                />
              )}
              <item.Icono aria-hidden="true" strokeWidth={1.7} className="relative h-[18px] w-[18px]" />
              <span className="relative">{item.etiqueta}</span>
              {clave === 'soporte' && sinLeer > 0 && <span className="absolute top-1 right-[22%] h-2 w-2 rounded-full bg-sitio-azul-claro" />}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => alMas(true)}
          aria-haspopup="dialog"
          className={cn(
            'relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] transition-colors duration-300',
            enMas ? 'text-white' : 'text-sitio-tenue',
          )}
        >
          {enMas && (
            <motion.span
              layoutId="admin-pestana"
              transition={{ duration: 0.5, ease: SALIDA }}
              className="absolute inset-0 rounded-xl bg-white/[0.08]"
            />
          )}
          <Menu aria-hidden="true" strokeWidth={1.7} className="relative h-[18px] w-[18px]" />
          <span className="relative">Más</span>
        </button>
      </nav>

      <AnimatePresence>
        {mas && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Más secciones">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => alMas(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.5, ease: SALIDA }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => (info.offset.y > 90 || info.velocity.y > 500) && alMas(false)}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[22px] border-t border-white/10 bg-sitio-modal px-4 pt-3 pb-8"
            >
              <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-white/20" />
              <div className="flex flex-col gap-1.5">
                {GRUPOS.map((nombre) => {
                  const items = SECCIONES.filter((item) => item.grupo === nombre && !PESTANAS.includes(item.clave))
                  if (!items.length) return null
                  const abierto = grupo === nombre
                  return (
                    <section key={nombre} className={cn('rounded-xl border transition-colors duration-300', abierto ? 'border-white/10' : 'border-transparent')}>
                      <button
                        type="button"
                        aria-expanded={abierto}
                        onClick={() => setGrupo(abierto ? undefined : nombre)}
                        className="flex w-full items-center justify-between px-3 py-3 text-left"
                      >
                        <span className="text-[10.5px] tracking-[0.16em] text-sitio-tenue uppercase">{nombre}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={cn('h-4 w-4 text-sitio-tenue transition-transform duration-500 ease-salida', abierto && 'rotate-180')}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {abierto && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: SALIDA }}
                            className="overflow-hidden px-1.5"
                          >
                            {items.map((item, indice) => (
                              <motion.li
                                key={item.clave}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.04 + indice * 0.04, ease: SALIDA }}
                                className="pb-1.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => alIr(item.clave)}
                                  aria-current={seccion === item.clave ? 'page' : undefined}
                                  className={cn(
                                    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[15px] transition-colors',
                                    seccion === item.clave ? 'bg-white/[0.08] text-white' : 'text-sitio-suave',
                                  )}
                                >
                                  <item.Icono aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                                  {item.etiqueta}
                                </button>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </section>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-sitio-borde px-3 pt-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11.5px] font-semibold">
                  {admin.nombre.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px]">{admin.nombre}</span>
                  <span className="block truncate text-[11.5px] text-sitio-tenue">{ROLES[admin.rol].etiqueta}</span>
                </span>
                <button type="button" onClick={alSalir} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] text-sitio-suave">
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Salir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
