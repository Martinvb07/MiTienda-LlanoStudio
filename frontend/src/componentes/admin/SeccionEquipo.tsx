'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'
import {
  cambiarAdmin,
  cambiarMiContrasena,
  crearAdmin,
  listarAdmins,
  type AdminPlataforma,
  type RolAdmin,
  type SesionAdmin,
} from '@/servicios/admin'
import { Aviso, BotonPanel, Campo, Etiqueta } from '../panel/ui/basicos'
import { ModalPanel, Selector } from '../panel/ui/flotantes'
import { Desplegable, TituloSeccion, haceCuanto } from './ui'

export const ROLES: Record<RolAdmin, { etiqueta: string; detalle: string }> = {
  DUENO: { etiqueta: 'Dueño', detalle: 'Todo: dinero, planes, admins y servidor' },
  SOPORTE: { etiqueta: 'Soporte', detalle: 'Chat, notas, entrar a tiendas y comunicación' },
  LECTURA: { etiqueta: 'Sólo lectura', detalle: 'Ve todo, no cambia nada' },
}
const OPCIONES_ROL = (Object.keys(ROLES) as RolAdmin[]).map((rol) => ({ valor: rol, etiqueta: ROLES[rol].etiqueta, detalle: ROLES[rol].detalle }))

/** Tu contraseña de admin y las personas de Llano Studio con acceso al admin. */
export function SeccionEquipo({ admin }: { admin: SesionAdmin }) {
  const dueno = admin.rol === 'DUENO'
  const [admins, setAdmins] = useState<AdminPlataforma[] | null>(null)
  const [delEntorno, setDelEntorno] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState<{ nombre: string; email: string; rol: RolAdmin; contrasena: string } | null>(null)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [error, setError] = useState('')
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (!dueno) return
    listarAdmins()
      .then((respuesta) => {
        setAdmins(respuesta.admins)
        setDelEntorno(respuesta.delEntorno)
      })
      .catch((e: Error) => setError(e.message))
  }, [dueno])

  const fallar = (problema: unknown) => setError(problema instanceof Error ? problema.message : 'No se pudo')

  async function cambiarClave(evento: FormEvent) {
    evento.preventDefault()
    setError('')
    if (nueva.length < 10) return setError('La contraseña nueva necesita al menos 10 caracteres.')
    try {
      await cambiarMiContrasena(actual, nueva)
      setActual('')
      setNueva('')
      setNota('Contraseña cambiada. Desde ahora entras con la nueva; ya no hace falta tocar el .env.')
    } catch (problema) {
      fallar(problema)
    }
  }

  async function guardarNuevo() {
    if (!nuevo) return
    try {
      const creado = await crearAdmin(nuevo)
      setAdmins((lista) => [...(lista ?? []), creado])
      setNuevo(null)
    } catch (problema) {
      fallar(problema)
    }
  }

  async function cambiar(fila: AdminPlataforma, datos: { rol?: RolAdmin; activo?: boolean }) {
    try {
      const guardado = await cambiarAdmin(fila.id, datos)
      setAdmins((lista) => lista?.map((otro) => (otro.id === guardado.id ? guardado : otro)) ?? null)
    } catch (problema) {
      fallar(problema)
    }
  }

  return (
    <>
      <TituloSeccion titulo="Equipo" descripcion={`Conectado como ${admin.email} · ${ROLES[admin.rol].etiqueta}`} />
      <AnimatePresence>{error && <div className="mb-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>
      {nota && <div className="mb-4"><Aviso tono="nota">{nota}</Aviso></div>}

      <div className="flex flex-col gap-2.5">
        <Desplegable titulo="Mi contraseña" resumen="Cambiarla desde aquí" abierto={!dueno}>
          <form onSubmit={(evento) => void cambiarClave(evento)} className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Contraseña actual" tipo="password" valor={actual} alCambiar={setActual} autoCompletar="current-password" />
            <Campo etiqueta="Contraseña nueva" tipo="password" valor={nueva} alCambiar={setNueva} autoCompletar="new-password" ayuda="Mínimo 10 caracteres." />
            <BotonPanel type="submit" variante="primario" className="self-start">
              Cambiar contraseña
            </BotonPanel>
          </form>
        </Desplegable>

        {dueno && (
          <Desplegable titulo="Personas con acceso al admin" resumen={admins ? `${admins.length + (delEntorno ? 1 : 0)}` : ''} abierto>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[13px] text-sitio-tenue">Cada quien entra con su correo por el mismo login del panel.</p>
              <BotonPanel onClick={() => setNuevo({ nombre: '', email: '', rol: 'SOPORTE', contrasena: '' })}>
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                Agregar
              </BotonPanel>
            </div>
            <ul>
              {delEntorno && (
                <li className="flex items-center gap-3 border-b border-sitio-borde py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px]">{delEntorno}</span>
                    <span className="text-[11.5px] text-sitio-tenue">Dueño del .env del servidor</span>
                  </span>
                  <Etiqueta tono="azul">Dueño</Etiqueta>
                </li>
              )}
              {(admins ?? []).map((fila) => (
                <li key={fila.id} className="flex flex-wrap items-center gap-3 border-b border-sitio-borde py-3 last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px]">
                      {fila.nombre} <span className="text-sitio-tenue">· {fila.email}</span>
                    </span>
                    <span className="text-[11.5px] text-sitio-tenue">
                      {fila.ultimoAccesoEn ? `Entró ${haceCuanto(fila.ultimoAccesoEn)}` : 'Nunca ha entrado'}
                      {!fila.activo && ' · desactivado'}
                    </span>
                  </span>
                  <Selector
                    etiqueta={`Rol de ${fila.nombre}`}
                    valor={fila.rol}
                    opciones={OPCIONES_ROL}
                    alCambiar={(rol) => void cambiar(fila, { rol })}
                    deshabilitado={fila.email === admin.email}
                    className="w-[150px]"
                  />
                  {fila.email !== admin.email && (
                    <BotonPanel variante={fila.activo ? 'peligro' : 'normal'} onClick={() => void cambiar(fila, { activo: !fila.activo })}>
                      {fila.activo ? 'Desactivar' : 'Reactivar'}
                    </BotonPanel>
                  )}
                </li>
              ))}
            </ul>
          </Desplegable>
        )}
      </div>

      <AnimatePresence>
        {nuevo && (
          <ModalPanel titulo="Agregar admin" alCerrar={() => setNuevo(null)}>
            <div className="flex flex-col gap-4">
              <Campo etiqueta="Nombre" valor={nuevo.nombre} alCambiar={(nombre) => setNuevo({ ...nuevo, nombre })} />
              <Campo etiqueta="Correo" tipo="email" valor={nuevo.email} alCambiar={(email) => setNuevo({ ...nuevo, email })} />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] text-sitio-suave">Rol</span>
                <Selector etiqueta="Rol" valor={nuevo.rol} opciones={OPCIONES_ROL} alCambiar={(rol) => setNuevo({ ...nuevo, rol })} />
              </div>
              <Campo
                etiqueta="Contraseña inicial"
                tipo="text"
                valor={nuevo.contrasena}
                alCambiar={(contrasena) => setNuevo({ ...nuevo, contrasena })}
                ayuda="Mínimo 10 caracteres. Pídele que la cambie al entrar."
              />
              <BotonPanel variante="primario" className="self-start" onClick={() => void guardarNuevo()}>
                Agregar
              </BotonPanel>
            </div>
          </ModalPanel>
        )}
      </AnimatePresence>
    </>
  )
}
