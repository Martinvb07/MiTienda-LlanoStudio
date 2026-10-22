'use client'

/* eslint-disable @next/next/no-img-element -- logos de tiendas en la tabla */
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence } from 'motion/react'
import {
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
import { ORDEN_PLANES, PLANES } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, CLASES_ENTRADA, Campo, Etiqueta } from '../panel/ui/basicos'

/** Marco del admin: la misma estética del panel de llanostudio.co/admin. */
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
    <div className="relative isolate grid min-h-screen place-items-center overflow-hidden px-6">
      <div aria-hidden="true" className="halo !top-[-10%]" />
      <form onSubmit={enviar} className="entrada w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-8 w-auto" />
          <span className="antetitulo mt-6">Mi Tienda · Administración</span>
          <h1 className="mt-2 text-[32px] leading-none font-normal tracking-[-0.04em]">Panel de Llano Studio</h1>
        </div>
        <div className="mt-8 flex flex-col gap-3.5 rounded-[14px] border border-sitio-borde bg-sitio-superficie p-6">
          <Campo etiqueta="Correo" tipo="email" valor={email} alCambiar={setEmail} autoFoco autoCompletar="username" />
          <Campo
            etiqueta="Contraseña"
            tipo="password"
            valor={contrasena}
            alCambiar={setContrasena}
            autoCompletar="current-password"
          />
          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
          <button type="submit" disabled={enviando} className="boton boton-primario mt-2 w-full">
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Tablero({ alSalir }: { alSalir: () => void }) {
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null)
  const [tiendas, setTiendas] = useState<TiendaAdmin[] | null>(null)
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')
  const [cambiando, setCambiando] = useState<string | null>(null)

  const cargar = useCallback(
    async (termino: string) => {
      try {
        const [datos, lista] = await Promise.all([obtenerResumen(), listarTiendas(termino)])
        setResumen(datos)
        setTiendas(lista)
        setError('')
      } catch (problema) {
        if (!leerTokenAdmin()) return alSalir()
        setError(problema instanceof Error ? problema.message : 'No se pudo cargar')
      }
    },
    [alSalir],
  )

  // La búsqueda espera a que se deje de escribir.
  useEffect(() => {
    const espera = setTimeout(() => void cargar(buscar), 250)
    return () => clearTimeout(espera)
  }, [buscar, cargar])

  async function cambiar(tienda: TiendaAdmin, cambios: { plan?: string; activo?: boolean }) {
    if (cambios.activo === false && !confirm(`¿Suspender "${tienda.nombre}"? Deja de verse y su dueño no podrá entrar.`)) {
      return
    }
    setCambiando(tienda.id)
    try {
      const actualizado = await cambiarTienda(tienda.id, cambios)
      setTiendas((lista) => lista?.map((otra) => (otra.id === tienda.id ? { ...otra, ...actualizado } : otra)) ?? null)
      setResumen(await obtenerResumen())
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    } finally {
      setCambiando(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8 md:py-10">
      <header className="flex items-center justify-between gap-4 border-b border-sitio-borde pb-6">
        <div className="flex items-center gap-[11px]">
          <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} className="h-7 w-auto" />
          <span className="flex flex-col">
            <span className="text-[15px] leading-none font-semibold tracking-[-0.02em]">Mi Tienda</span>
            <span className="mt-1 text-[9.5px] tracking-[0.24em] text-sitio-tenue uppercase">Administración</span>
          </span>
        </div>
        <BotonPanel variante="fantasma" onClick={alSalir}>
          Cerrar sesión
        </BotonPanel>
      </header>

      <h1 className="mt-10 text-[clamp(30px,4vw,52px)] leading-none font-normal tracking-[-0.045em]">Plataforma</h1>

      <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        {[
          { valor: resumen?.tiendas, etiqueta: 'Tiendas' },
          { valor: resumen?.publicadas, etiqueta: 'Publicadas' },
          { valor: resumen?.nuevasEstaSemana, etiqueta: 'Nuevas esta semana' },
          { valor: resumen?.productos, etiqueta: 'Productos' },
          { valor: resumen?.suspendidas, etiqueta: 'Suspendidas' },
        ].map((cifra) => (
          <div key={cifra.etiqueta} className="rounded-[14px] border border-sitio-borde bg-sitio-superficie p-5">
            <p className="text-[36px] leading-none tracking-[-0.045em]">{cifra.valor ?? '—'}</p>
            <p className="mt-2 text-xs text-sitio-tenue">{cifra.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {ORDEN_PLANES.map((plan) => (
          <span key={plan} className="rounded-full border border-sitio-borde px-3 py-1.5 text-xs text-sitio-suave">
            {PLANES[plan].nombre} <b className="ml-1 font-medium text-white">{resumen?.porPlan[plan] ?? 0}</b>
          </span>
        ))}
      </div>

      <section className="mt-10 rounded-[14px] border border-sitio-borde bg-sitio-superficie">
        <div className="flex flex-col gap-3 border-b border-sitio-borde p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-medium">Tiendas</h2>
          <input
            value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)}
            placeholder="Buscar por nombre, dirección o correo"
            className={cn(CLASES_ENTRADA, 'sm:max-w-xs')}
          />
        </div>

        <AnimatePresence>{error && <div className="p-5 pb-0"><Aviso>{error}</Aviso></div>}</AnimatePresence>

        {!tiendas ? (
          <div className="brillo m-5 h-40 rounded-lg" />
        ) : tiendas.length === 0 ? (
          <p className="p-10 text-center text-sm text-sitio-tenue">
            {buscar ? 'Ninguna tienda coincide con la búsqueda.' : 'Todavía no hay tiendas.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead className="text-[11px] tracking-[0.08em] text-sitio-tenue uppercase">
                <tr>
                  <th className="px-5 py-3 font-normal">Tienda</th>
                  <th className="px-3 py-3 font-normal">Dueño</th>
                  <th className="px-3 py-3 font-normal">Productos</th>
                  <th className="px-3 py-3 font-normal">Estado</th>
                  <th className="px-3 py-3 font-normal">Plan</th>
                  <th className="px-5 py-3 text-right font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {tiendas.map((tienda) => (
                  <tr
                    key={tienda.id}
                    className={cn('border-t border-sitio-borde', !tienda.activo && 'opacity-55')}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-[11px] font-semibold text-black">
                          {tienda.logoUrl ? (
                            <img src={tienda.logoUrl} alt="" className="h-full w-full object-contain" />
                          ) : (
                            tienda.nombre.slice(0, 2).toUpperCase()
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{tienda.nombre}</span>
                          <a
                            href={urlTienda(tienda.subdominio)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate font-mono text-[11.5px] text-sitio-tenue hover:text-white"
                          >
                            {tienda.subdominio} ↗
                          </a>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block truncate">{tienda.propietario?.nombre ?? '—'}</span>
                      <span className="block truncate text-[11.5px] text-sitio-tenue">
                        {tienda.propietario?.email}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-sitio-suave">{tienda.productos}</td>
                    <td className="px-3 py-3.5">
                      {!tienda.activo ? (
                        <Etiqueta tono="ambar">Suspendida</Etiqueta>
                      ) : tienda.publicada ? (
                        <Etiqueta tono="verde">Publicada</Etiqueta>
                      ) : (
                        <Etiqueta>Borrador</Etiqueta>
                      )}
                      <span className="mt-1 block text-[11px] text-sitio-tenue">
                        Desde {new Date(tienda.creadoEn).toLocaleDateString('es-CO')}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <select
                        value={tienda.plan}
                        disabled={cambiando === tienda.id}
                        onChange={(evento) => void cambiar(tienda, { plan: evento.target.value })}
                        aria-label={`Plan de ${tienda.nombre}`}
                        className={cn(CLASES_ENTRADA, 'w-auto py-1.5 pr-8')}
                      >
                        {ORDEN_PLANES.map((plan) => (
                          <option key={plan} value={plan}>
                            {PLANES[plan].nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <BotonPanel
                        variante={tienda.activo ? 'peligro' : 'suave'}
                        disabled={cambiando === tienda.id}
                        onClick={() => void cambiar(tienda, { activo: !tienda.activo })}
                      >
                        {tienda.activo ? 'Suspender' : 'Reactivar'}
                      </BotonPanel>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
