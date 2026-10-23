'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, CheckCircle2, Copy, Globe, Plus, RefreshCw, Shuffle, Trash2 } from 'lucide-react'
import {
  ErrorPanel,
  agregarDominio,
  agregarMiembro,
  cambiarMiembro,
  listarDominios,
  listarEquipo,
  quitarDominio,
  quitarMiembro,
  verificarDominio,
  type DominioPropio,
  type Miembro,
} from '@/servicios/panel'
import { limitesDe, planMinimo } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'
import { iniciales } from './NavegacionPanel'
import { Aviso, BotonPanel, CURVA, Campo, Candado, Etiqueta, Segmentado } from './ui/basicos'
import { ModalPanel } from './ui/flotantes'
import { confirmar } from './ui/confirmar'

const ROLES = {
  PROPIETARIO: { etiqueta: 'Dueña', detalle: 'Todo, incluida la cuenta' },
  ADMINISTRADOR: { etiqueta: 'Administrador', detalle: 'Todo menos cambiar a la dueña' },
  EDITOR: { etiqueta: 'Editor', detalle: 'Productos, diseño y pedidos' },
} as const

const claveAleatoria = () =>
  Array.from({ length: 10 }, () => 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 55)]).join('')

/** Personas con acceso al panel. Cuántas, según el plan. */
export function GestionEquipo() {
  const { sesion } = useSesion()
  const limites = limitesDe(sesion.tenant.plan)
  const [miembros, setMiembros] = useState<Miembro[] | null>(null)
  const [error, setError] = useState('')
  const [agregando, setAgregando] = useState(false)
  const activos = (miembros ?? []).filter((miembro) => miembro.activo).length
  const lleno = activos >= limites.usuarios

  useEffect(() => {
    listarEquipo()
      .then(setMiembros)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  async function cambiar(miembro: Miembro, cambios: Parameters<typeof cambiarMiembro>[1]) {
    setError('')
    try {
      const nuevo = await cambiarMiembro(miembro.id, cambios)
      setMiembros((lista) => (lista ?? []).map((otro) => (otro.id === nuevo.id ? nuevo : otro)))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    }
  }

  async function quitar(miembro: Miembro) {
    if (!(await confirmar({ titulo: `¿Quitarle el acceso a ${miembro.nombre}?`, mensaje: 'Ya no podrá entrar al panel.', confirmar: 'Quitar acceso', peligro: true }))) return
    try {
      await quitarMiembro(miembro.id)
      setMiembros((lista) => (lista ?? []).filter((otro) => otro.id !== miembro.id))
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo quitar')
    }
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-sitio-borde">
        {(miembros ?? []).map((miembro) => {
          const yo = miembro.email === sesion.usuario.email
          const editable = !yo && miembro.rol !== 'PROPIETARIO'
          return (
            <li key={miembro.id} className={cn('flex flex-wrap items-center gap-3 py-3', !miembro.activo && 'opacity-50')}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11.5px] font-semibold">
                {iniciales(miembro.nombre)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px]">
                  {miembro.nombre} {yo && <span className="text-sitio-tenue">(tú)</span>}
                </span>
                <span className="block truncate text-[11.5px] text-sitio-tenue">{miembro.email}</span>
              </span>
              {editable ? (
                <span className="flex items-center gap-1.5">
                  <Segmentado
                    chico
                    opciones={[
                      { valor: 'ADMINISTRADOR', etiqueta: 'Admin', titulo: ROLES.ADMINISTRADOR.detalle },
                      { valor: 'EDITOR', etiqueta: 'Editor', titulo: ROLES.EDITOR.detalle },
                    ]}
                    valor={miembro.rol as 'ADMINISTRADOR' | 'EDITOR'}
                    alCambiar={(rol) => void cambiar(miembro, { rol })}
                  />
                  <BotonPanel variante="fantasma" onClick={() => void cambiar(miembro, { activo: !miembro.activo })} className="!px-2.5">
                    {miembro.activo ? 'Pausar' : 'Activar'}
                  </BotonPanel>
                  <button
                    type="button"
                    aria-label={`Quitar a ${miembro.nombre}`}
                    onClick={() => void quitar(miembro)}
                    className="grid h-[34px] w-8 place-items-center text-sitio-tenue hover:text-red-300"
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <Etiqueta tono={miembro.rol === 'PROPIETARIO' ? 'azul' : 'neutro'}>{ROLES[miembro.rol].etiqueta}</Etiqueta>
              )}
            </li>
          )
        })}
      </ul>
      {!miembros && <div className="brillo h-14 rounded-lg" />}
      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
      {lleno ? (
        <div className="mt-3">
          <Candado plan={planMinimo((plan) => plan.usuarios > activos)}>
            {limites.usuarios === 1
              ? 'Invita a tu equipo a administrar la tienda.'
              : `Tu plan admite ${limites.usuarios} personas.`}
          </Candado>
        </div>
      ) : (
        <BotonPanel onClick={() => setAgregando(true)} className="mt-3">
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Agregar a alguien
        </BotonPanel>
      )}

      <AnimatePresence>
        {agregando && (
          <FormularioMiembro
            alCerrar={() => setAgregando(false)}
            alAgregar={(miembro) => setMiembros((lista) => [...(lista ?? []), miembro])}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function FormularioMiembro({ alCerrar, alAgregar }: { alCerrar: () => void; alAgregar: (miembro: Miembro) => void }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<'ADMINISTRADOR' | 'EDITOR'>('EDITOR')
  const [contrasena, setContrasena] = useState(claveAleatoria)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [creado, setCreado] = useState<Miembro | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const miembro = await agregarMiembro({ nombre: nombre.trim(), email: email.trim(), rol, contrasena })
      alAgregar(miembro)
      setCreado(miembro)
    } catch (problema) {
      if (problema instanceof ErrorPanel && Object.keys(problema.campos).length) setErrores(problema.campos)
      else setError(problema instanceof Error ? problema.message : 'No se pudo agregar')
    } finally {
      setEnviando(false)
    }
  }

  const mensaje = creado
    ? `Hola ${creado.nombre.split(' ')[0]}, te di acceso al panel de mi tienda.\nEntra en ${window.location.origin}/panel/ingresar\nCorreo: ${creado.email}\nContraseña: ${contrasena}\n(Cámbiala en Configuración al entrar.)`
    : ''

  return (
    <ModalPanel
      titulo={creado ? 'Listo' : 'Agregar a tu equipo'}
      descripcion={creado ? 'Compártele estos datos para que entre.' : 'Le creas una contraseña inicial y se la compartes.'}
      alCerrar={alCerrar}
    >
      {creado ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: CURVA }} className="flex flex-col gap-3">
          <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-sitio-verde" />
          <pre className="rounded-lg border border-sitio-borde bg-sitio-campo p-3 font-mono text-[12px] whitespace-pre-wrap text-sitio-suave">{mensaje}</pre>
          <BotonPanel
            variante="primario"
            className="h-10"
            onClick={() => {
              void navigator.clipboard.writeText(mensaje).then(() => setCopiado(true))
            }}
          >
            {copiado ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
            {copiado ? 'Copiado' : 'Copiar mensaje'}
          </BotonPanel>
        </motion.div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-3.5">
          <Campo etiqueta="Nombre" valor={nombre} alCambiar={setNombre} error={errores.nombre} autoFoco maximo={80} />
          <Campo etiqueta="Correo" tipo="email" valor={email} alCambiar={setEmail} error={errores.email} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] text-sitio-suave">Rol</span>
            <Segmentado
              opciones={[
                { valor: 'EDITOR', etiqueta: 'Editor' },
                { valor: 'ADMINISTRADOR', etiqueta: 'Administrador' },
              ]}
              valor={rol}
              alCambiar={setRol}
              chico
            />
            <span className="text-[11px] text-sitio-tenue">{ROLES[rol].detalle}.</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Campo etiqueta="Contraseña inicial" valor={contrasena} alCambiar={setContrasena} error={errores.contrasena} />
            </div>
            <BotonPanel onClick={() => setContrasena(claveAleatoria())} title="Generar otra" className="mb-px h-[38px]">
              <Shuffle aria-hidden="true" className="h-3.5 w-3.5" />
            </BotonPanel>
          </div>
          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
          <BotonPanel type="submit" variante="primario" disabled={enviando || !nombre || !email} className="mt-1 h-10">
            {enviando ? 'Agregando…' : 'Agregar'}
          </BotonPanel>
        </form>
      )}
    </ModalPanel>
  )
}

/** Conectar www.tutienda.com: se agrega, se muestran los registros DNS y se verifica. */
export function GestionDominio() {
  const limites = limitesDe(useSesion().sesion.tenant.plan)
  const [datos, setDatos] = useState<Awaited<ReturnType<typeof listarDominios>> | null>(null)
  const [nuevo, setNuevo] = useState('')
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    listarDominios()
      .then(setDatos)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  function reemplazar(dominio: DominioPropio) {
    setDatos((actual) => actual && { ...actual, dominios: actual.dominios.map((otro) => (otro.id === dominio.id ? dominio : otro)) })
  }

  async function agregar(evento: FormEvent) {
    evento.preventDefault()
    setTrabajando('nuevo')
    setError('')
    try {
      const dominio = await agregarDominio(nuevo)
      setDatos((actual) => actual && { ...actual, dominios: [...actual.dominios, dominio] })
      setNuevo('')
    } catch (problema) {
      if (problema instanceof ErrorPanel && problema.campos.dominio) setError(problema.campos.dominio)
      else setError(problema instanceof Error ? problema.message : 'No se pudo agregar')
    } finally {
      setTrabajando(null)
    }
  }

  async function verificar(dominio: DominioPropio) {
    setTrabajando(dominio.id)
    setError('')
    try {
      const actualizado = await verificarDominio(dominio.id)
      reemplazar(actualizado)
      if (!actualizado.verificado) setError('Todavía no vemos el registro DNS. Puede tardar unas horas en propagarse; lo revisamos solos cada hora y se conecta en cuanto aparezca.')
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo verificar')
    } finally {
      setTrabajando(null)
    }
  }

  async function quitar(dominio: DominioPropio) {
    if (!(await confirmar({ titulo: `¿Desconectar ${dominio.dominio}?`, mensaje: 'Tu tienda dejará de abrir en ese dominio.', confirmar: 'Desconectar', peligro: true }))) return
    await quitarDominio(dominio.id).catch(() => undefined)
    setDatos((actual) => actual && { ...actual, dominios: actual.dominios.filter((otro) => otro.id !== dominio.id) })
  }

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto).catch(() => undefined)
    setCopiado(texto)
    setTimeout(() => setCopiado(''), 1500)
  }

  if (!limites.dominioPropio) {
    return <Candado plan={planMinimo((plan) => plan.dominioPropio)}>Tu tienda en www.tutienda.com, con tu propio dominio.</Candado>
  }

  return (
    <div className="flex flex-col gap-3">
      {(datos?.dominios ?? []).map((dominio) => (
        <div key={dominio.id} className="rounded-xl border border-sitio-borde p-3.5">
          <div className="flex items-center gap-2">
            <Globe aria-hidden="true" className="h-4 w-4 text-sitio-tenue" />
            <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{dominio.dominio}</span>
            <Etiqueta tono={dominio.verificado ? 'verde' : 'ambar'}>{dominio.verificado ? 'Conectado' : 'Pendiente'}</Etiqueta>
            <button type="button" aria-label="Quitar" onClick={() => void quitar(dominio)} className="grid h-7 w-7 place-items-center text-sitio-tenue hover:text-red-300">
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          {dominio.verificado && (
            <p className="mt-2.5 text-[12px] leading-relaxed text-sitio-tenue">
              El DNS ya apunta a Mi Sitio. El candado de seguridad (HTTPS) se activa solo en unos 5 a 10 minutos; después abre{' '}
              <a href={`https://${dominio.dominio}`} target="_blank" rel="noopener noreferrer" className="text-sitio-suave underline-offset-4 hover:underline">
                https://{dominio.dominio}
              </a>
              .
            </p>
          )}
          {!dominio.verificado && datos && (
            <div className="mt-3 rounded-lg bg-white/[0.03] p-3 text-[12px] leading-relaxed text-sitio-suave">
              <p>En el panel de tu proveedor de dominio (GoDaddy, Namecheap, Hostinger…) crea este registro:</p>
              <dl className="mt-2.5 grid grid-cols-[70px_1fr] gap-x-3 gap-y-1.5 font-mono text-[12px]">
                <dt className="text-sitio-tenue">Tipo</dt>
                <dd>{dominio.dominio.split('.').length > 2 || !datos.instrucciones.ip ? 'CNAME' : 'A'}</dd>
                <dt className="text-sitio-tenue">Nombre</dt>
                <dd>{dominio.dominio.split('.').length > 2 ? dominio.dominio.split('.')[0] : '@'}</dd>
                <dt className="text-sitio-tenue">Valor</dt>
                <dd>
                  {(() => {
                    const valor = dominio.dominio.split('.').length > 2 || !datos.instrucciones.ip ? datos.instrucciones.cname : datos.instrucciones.ip!
                    return (
                      <button type="button" onClick={() => void copiar(valor)} className="inline-flex items-center gap-1.5 hover:text-white">
                        {valor}
                        {copiado === valor ? <Check aria-hidden="true" className="h-3 w-3 text-sitio-verde" /> : <Copy aria-hidden="true" className="h-3 w-3" />}
                      </button>
                    )
                  })()}
                </dd>
              </dl>
              <BotonPanel onClick={() => void verificar(dominio)} disabled={trabajando === dominio.id} className="mt-3">
                <RefreshCw aria-hidden="true" className={cn('h-3.5 w-3.5', trabajando === dominio.id && 'animate-spin')} />
                Ya lo hice, verificar
              </BotonPanel>
            </div>
          )}
        </div>
      ))}
      {(datos?.dominios.length ?? 0) === 0 && (
        <form onSubmit={agregar} className="flex items-end gap-2">
          <div className="flex-1">
            <Campo etiqueta="Tu dominio" valor={nuevo} alCambiar={setNuevo} marcador="www.tutienda.com" />
          </div>
          <BotonPanel type="submit" variante="primario" disabled={!nuevo.trim() || trabajando === 'nuevo'} className="mb-px h-[38px]">
            Conectar
          </BotonPanel>
        </form>
      )}
      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
    </div>
  )
}
