'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  BadgeDollarSign,
  BarChart3,
  CreditCard,
  FileText,
  Gift,
  LogOut,
  Megaphone,
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
import { Selector } from '../panel/ui/flotantes'
import { LogoMarca } from '@/componentes/comunes/LogoMarca'
import { BotonTema } from '@/componentes/comunes/BotonTema'
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

  useEffect(() => setSeccion(seccionDeLaUrl()), [])

  const ir = (clave: Clave) => {
    setSeccion(clave)
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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barra lateral */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sitio-borde bg-sitio-lateral md:flex">
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

      {/* Celular: barra superior con selector de sección */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-sitio-borde bg-black/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <LogoMarca className="h-6 w-auto" />
        <Selector
          etiqueta="Sección"
          valor={seccion}
          opciones={SECCIONES.map((item) => ({
            valor: item.clave,
            etiqueta: item.clave === 'soporte' && sinLeer > 0 ? `${item.etiqueta} (${sinLeer})` : item.etiqueta,
          }))}
          alCambiar={ir}
          className="min-w-0 flex-1"
        />
        <BotonTema />
        <button type="button" onClick={alSalir} aria-label="Salir" className="grid h-9 w-9 place-items-center text-sitio-tenue">
          <LogOut aria-hidden="true" className="h-4 w-4" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1180px] min-w-0 flex-1 px-4 pt-8 pb-24 sm:px-6 md:px-10 md:pt-12">
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

      <AnimatePresence>{ficha && <FichaTienda key={ficha} id={ficha} admin={admin} alCerrar={() => setFicha(null)} />}</AnimatePresence>
    </div>
  )
}
