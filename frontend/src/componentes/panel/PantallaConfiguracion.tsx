'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check, ChevronDown, Copy, Globe, CreditCard, KeyRound, Link2, LogOut, Sparkles, UserRound, Users, X } from 'lucide-react'
import {
  ErrorPanel,
  actualizarCuenta,
  cambiarContrasena,
  cerrarSesion,
  listarProductos,
} from '@/servicios/panel'
import { configuracionDominios, urlTienda } from '@/utilidades/dominios'
import { limitesDe } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { BotonPanel, Campo, Etiqueta } from './ui/basicos'
import { Aparecer, SALIDA } from './ui/movimiento'
import { GestionDominio, GestionEquipo } from './GestionEquipo'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Sección plegable de la configuración: una fila con ícono, título y un
 * resumen corto a la derecha; al abrirla se despliega el contenido.
 */
function Bloque({
  titulo,
  descripcion,
  resumen,
  Icono,
  orden,
  abierto: abiertoInicial = false,
  children,
}: {
  titulo: string
  descripcion?: string
  resumen?: ReactNode
  Icono: typeof UserRound
  orden: number
  abierto?: boolean
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(abiertoInicial)

  return (
    <Aparecer orden={orden}>
      <section
        className={cn(
          'rounded-[14px] border bg-sitio-superficie transition-colors duration-300',
          abierto ? 'border-sitio-borde-fuerte' : 'border-sitio-borde hover:border-sitio-borde-fuerte',
        )}
      >
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((valor) => !valor)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-sitio-borde bg-white/[0.03]">
            <Icono aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-medium tracking-[-0.01em]">{titulo}</span>
            {descripcion && <span className="mt-0.5 block truncate text-[12.5px] text-sitio-tenue">{descripcion}</span>}
          </span>
          {resumen && <span className="hidden shrink-0 text-[12.5px] text-sitio-suave sm:block">{resumen}</span>}
          <ChevronDown
            aria-hidden="true"
            className={cn('h-4 w-4 shrink-0 text-sitio-tenue transition-transform duration-500 ease-salida', abierto && 'rotate-180')}
          />
        </button>
        <AnimatePresence initial={false}>
          {abierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: SALIDA }}
              className="overflow-hidden"
            >
              <div className="border-t border-sitio-borde px-5 pt-5 pb-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </Aparecer>
  )
}

/** Mensaje breve bajo un formulario: guardado o error. */
function Estado({ ok, error }: { ok: string; error: string }) {
  return (
    <AnimatePresence mode="wait">
      {(ok || error) && (
        <motion.p
          key={ok || error}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: SALIDA }}
          className={cn('flex items-center gap-1.5 text-[12.5px]', ok ? 'text-sitio-verde' : 'text-red-300')}
        >
          {ok ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <X aria-hidden="true" className="h-3.5 w-3.5" />}
          {ok || error}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

function FormularioPerfil() {
  const { sesion, recargar } = useSesion()
  const [nombre, setNombre] = useState(sesion.usuario.nombre)
  const [email, setEmail] = useState(sesion.usuario.email)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')
  const cambio = nombre.trim() !== sesion.usuario.nombre || email.trim().toLowerCase() !== sesion.usuario.email

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados: Record<string, string> = {}
    if (!nombre.trim()) encontrados.nombre = 'Escribe tu nombre'
    if (!CORREO.test(email.trim())) encontrados.email = 'Ese correo no parece válido'
    setErrores(encontrados)
    setOk('')
    setError('')
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    try {
      await actualizarCuenta({ nombre: nombre.trim(), email: email.trim() })
      await recargar()
      setOk('Datos guardados')
    } catch (problema) {
      if (problema instanceof ErrorPanel && Object.keys(problema.campos).length) setErrores(problema.campos)
      else setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-3.5">
      <Campo etiqueta="Nombre" valor={nombre} alCambiar={setNombre} autoCompletar="name" error={errores.nombre} maximo={80} />
      <Campo etiqueta="Correo" tipo="email" valor={email} alCambiar={setEmail} autoCompletar="email" error={errores.email} />
      <div className="mt-1 flex items-center gap-3">
        <BotonPanel type="submit" variante="primario" disabled={!cambio || enviando}>
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </BotonPanel>
        <Estado ok={ok} error={error} />
      </div>
    </form>
  )
}

function FormularioContrasena() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetida, setRepetida] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados: Record<string, string> = {}
    if (!actual) encontrados.actual = 'Escribe tu contraseña actual'
    if (nueva.length < 8) encontrados.nueva = 'Tiene que tener al menos 8 caracteres'
    else if (nueva === actual) encontrados.nueva = 'Tiene que ser distinta a la actual'
    if (repetida !== nueva) encontrados.repetida = 'No coincide con la nueva'
    setErrores(encontrados)
    setOk('')
    setError('')
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    try {
      await cambiarContrasena(actual, nueva)
      setActual('')
      setNueva('')
      setRepetida('')
      setOk('Contraseña actualizada')
    } catch (problema) {
      if (problema instanceof ErrorPanel && Object.keys(problema.campos).length) setErrores(problema.campos)
      else setError(problema instanceof Error ? problema.message : 'No se pudo cambiar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-3.5">
      <Campo
        etiqueta="Contraseña actual"
        tipo="password"
        valor={actual}
        alCambiar={setActual}
        autoCompletar="current-password"
        error={errores.actual}
      />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Campo
          etiqueta="Nueva"
          tipo="password"
          valor={nueva}
          alCambiar={setNueva}
          autoCompletar="new-password"
          error={errores.nueva}
        />
        <Campo
          etiqueta="Repítela"
          tipo="password"
          valor={repetida}
          alCambiar={setRepetida}
          autoCompletar="new-password"
          error={errores.repetida}
        />
      </div>
      <div className="mt-1 flex items-center gap-3">
        <BotonPanel type="submit" variante="primario" disabled={enviando || !actual || !nueva}>
          {enviando ? 'Cambiando…' : 'Cambiar contraseña'}
        </BotonPanel>
        <Estado ok={ok} error={error} />
      </div>
    </form>
  )
}

export function PantallaConfiguracion() {
  const { sesion } = useSesion()
  const plan = limitesDe(sesion.tenant.plan)
  const gestiona = sesion.usuario.rol !== 'EDITOR'
  const [productos, setProductos] = useState<number | null>(null)
  const [copiado, setCopiado] = useState(false)
  const direccion = `${sesion.tenant.subdominio}.${configuracionDominios.dominioBase}`

  useEffect(() => {
    listarProductos()
      .then((lista) => setProductos(lista.length))
      .catch(() => setProductos(null))
  }, [])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(urlTienda(sesion.tenant.subdominio))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      // Sin portapapeles: la dirección queda a la vista para copiarla a mano.
    }
  }

  const incluye = [
    { texto: plan.productos === null ? 'Productos ilimitados' : `Hasta ${plan.productos} productos`, si: true },
    { texto: `${plan.fotosPorProducto} fotos por producto`, si: true },
    { texto: `${plan.secciones} secciones en la portada`, si: true },
    { texto: 'Colores y letra a tu gusto', si: plan.temaLibre },
    { texto: 'Cabecera completa y buscador', si: plan.cabeceraCompleta },
    { texto: 'Quitar "Hecho con Mi Tienda"', si: plan.quitarMarca },
  ]
  const uso = plan.productos && productos !== null ? Math.min(productos / plan.productos, 1) : null

  return (
    <>
      <CabeceraPanel titulo="Configuración" descripcion="Tu cuenta, tu plan y la dirección de tu tienda." />

      <div className="flex max-w-3xl flex-col gap-2.5">
        <Bloque
          titulo="Perfil"
          descripcion="Con estos datos entras al panel."
          resumen={sesion.usuario.nombre}
          Icono={UserRound}
          orden={1}
        >
          <FormularioPerfil />
        </Bloque>

        <Bloque titulo="Contraseña" descripcion="Te pedimos la actual para confirmar que eres tú." Icono={KeyRound} orden={2}>
          <FormularioContrasena />
        </Bloque>

        {gestiona && (
        <Bloque
          titulo="Tu plan"
          descripcion="Lo que incluye tu plan hoy."
          resumen={uso !== null ? `${plan.nombre} · ${productos} de ${plan.productos} productos` : plan.nombre}
          Icono={Sparkles}
          orden={3}
        >
          {uso !== null && (
            <div className="mb-5">
              <div className="flex justify-between text-[12px] text-sitio-tenue">
                <span>Productos</span>
                <span>
                  {productos} de {plan.productos}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className={cn('h-full rounded-full', uso >= 0.9 ? 'bg-sitio-ambar' : 'bg-white')}
                  initial={{ width: 0 }}
                  animate={{ width: `${uso * 100}%` }}
                  transition={{ duration: 1.3, delay: 0.3, ease: SALIDA }}
                />
              </div>
            </div>
          )}
          <ul className="grid gap-x-4 gap-y-2.5 text-[13px] sm:grid-cols-2">
            {incluye.map((item) => (
              <li key={item.texto} className={cn('flex items-center gap-2', item.si ? 'text-white/85' : 'text-sitio-tenue line-through')}>
                {item.si ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-sitio-verde" />
                ) : (
                  <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                )}
                {item.texto}
              </li>
            ))}
          </ul>
          {sesion.tenant.plan !== 'PRO' && (
            <Link href="/panel/plan" className="group boton boton-primario boton-chico mt-6">
              Mejorar mi plan
              <ArrowUpRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          )}
        </Bloque>
        )}

        <Bloque
          titulo="Dirección de la tienda"
          descripcion="Viene incluida con tu cuenta."
          resumen={<span className="font-mono text-[12px]">{direccion}</span>}
          Icono={Globe}
          orden={4}
        >
          <div className="flex items-center gap-2 rounded-lg border border-sitio-borde bg-sitio-campo p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{direccion}</span>
            <BotonPanel onClick={() => void copiar()} aria-label="Copiar dirección">
              {copiado ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-sitio-verde" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
            </BotonPanel>
            <a
              href={urlTienda(sesion.tenant.subdominio)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir tienda"
              className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-sitio-borde bg-white/[0.04] text-sitio-suave transition-colors hover:text-white"
            >
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-sitio-tenue">
            Para cambiar el nombre, el logo o los colores usa{' '}
            <Link href="/panel/plantillas?editar=1" className="text-white underline-offset-4 hover:underline">
              el editor
            </Link>
            .
          </p>
        </Bloque>

        {gestiona && (
          <>
            <Bloque titulo="Equipo" descripcion="Quién más puede entrar a administrar la tienda." Icono={Users} orden={5}>
              <GestionEquipo />
            </Bloque>

            <Bloque titulo="Dominio propio" descripcion="Tu tienda en www.tutienda.com." Icono={Link2} orden={6}>
              <GestionDominio />
            </Bloque>
          </>
        )}

        <Bloque
          titulo="Pagos en línea"
          descripcion="Conecta tu cuenta de Wompi, ePayco o Bold para cobrar en la tienda."
          resumen={<Etiqueta tono="azul">Próximamente</Etiqueta>}
          Icono={CreditCard}
          orden={7}
        >
          <p className="text-[13px] leading-relaxed text-sitio-tenue">
            Muy pronto vas a poder conectar tu propia pasarela y recibir el dinero directo en tu cuenta. Mientras
            tanto tus clientes te pagan por WhatsApp, transferencia o contra entrega.
          </p>
        </Bloque>

        <Bloque titulo="Sesión" descripcion={`Conectado como ${sesion.usuario.email}.`} Icono={LogOut} orden={8}>
          <BotonPanel
            variante="peligro"
            onClick={() => {
              cerrarSesion()
              window.location.assign('/panel/ingresar')
            }}
          >
            <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
            Cerrar sesión
          </BotonPanel>
        </Bloque>
      </div>
    </>
  )
}
