'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PRODUCTOS, type ProductoSitio } from '@/componentes/sitio/productos'
import { ErrorPanel, registrar } from '@/servicios/panel'
import { AvisoFormulario, CampoContrasena, CampoTexto } from './CamposFormulario'
import { configuracionDominios, esSubdominioValido } from '@/utilidades/dominios'
import { generarSlug } from '@/utilidades/formato'
import { leerOrigen } from '@/utilidades/origen'
import { esPlantillaPagina } from '@/utilidades/plantillasPagina'

interface Errores {
  nombre?: string
  email?: string
  contrasena?: string
  tienda?: string
  subdominio?: string
  condiciones?: string
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Interes = ProductoSitio['clave']

const SALIDA = [0.16, 1, 0.3, 1] as const
const PASO = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.2 } },
  transition: { duration: 0.6, ease: SALIDA },
}

export function FormularioRegistro() {
  // Primero se pregunta qué quiere armar. Quien llega con plantilla o plan ya
  // eligió (la plantilla dice si es tienda o página); ?producto= lo deja elegido desde la web.
  const [interes, setInteres] = useState<Interes | null>(null)
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search)
    const producto = parametros.get('producto')
    if (esPlantillaPagina(parametros.get('plantilla'))) setInteres('pagina')
    else if (PRODUCTOS.some((otro) => otro.clave === producto)) setInteres(producto as Interes)
    else if (parametros.has('plantilla') || parametros.has('plan')) setInteres('tienda')
  }, [])

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [tienda, setTienda] = useState('')
  const [subdominio, setSubdominio] = useState('')
  const [condiciones, setCondiciones] = useState(false)

  // Mientras no toque el subdominio a mano, se deriva del nombre de la tienda.
  // En cuanto lo edita, deja de pisarse: es su decisión, no la nuestra.
  const [subdominioEditado, setSubdominioEditado] = useState(false)

  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState('')
  const router = useRouter()

  const subdominioFinal = subdominioEditado ? subdominio : generarSlug(tienda)
  const dominioCompleto = `${subdominioFinal || 'tunegocio'}.${configuracionDominios.dominioBase}`

  function alCambiarTienda(valor: string) {
    setTienda(valor)
    if (!subdominioEditado) setSubdominio(generarSlug(valor))
  }

  function alCambiarSubdominio(valor: string) {
    setSubdominioEditado(true)
    setSubdominio(generarSlug(valor))
  }

  function validar(): Errores {
    const encontrados: Errores = {}

    if (!nombre.trim()) encontrados.nombre = 'Escribe tu nombre'

    if (!email.trim()) encontrados.email = 'Escribe tu correo'
    else if (!CORREO.test(email)) encontrados.email = 'Ese correo no parece válido'

    if (!contrasena) encontrados.contrasena = 'Elige una contraseña'
    else if (contrasena.length < 8) encontrados.contrasena = 'Tiene que tener al menos 8 caracteres'

    if (!tienda.trim()) encontrados.tienda = interes === 'tienda' ? 'Escribe el nombre de tu tienda' : 'Escribe el nombre de tu negocio'

    if (!subdominioFinal) encontrados.subdominio = 'Elige tu dirección'
    else if (!esSubdominioValido(subdominioFinal)) {
      encontrados.subdominio =
        subdominioFinal.length < 3
          ? 'Tiene que tener al menos 3 caracteres'
          : 'Esa dirección no está disponible. Prueba con otra.'
    }

    if (!condiciones) encontrados.condiciones = 'Tienes que aceptar las condiciones'

    return encontrados
  }

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    const encontrados = validar()
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    setErrorServidor('')
    try {
      await registrar({
        nombre: nombre.trim(),
        email: email.trim(),
        contrasena,
        tienda: tienda.trim(),
        subdominio: subdominioFinal,
        tipo: interes === 'pagina' ? 'pagina' : 'tienda',
        ...leerOrigen(),
      })
      // Recién creada: primero elige con qué plantilla arranca; después se abre el editor.
      // Si llegó desde "Usar esta plantilla", ya la eligió: el editor abre con ella aplicada.
      const plantilla = new URLSearchParams(window.location.search).get('plantilla')
      // Si venía de elegir un plan pago en /precios, primero a pagarlo.
      if (new URLSearchParams(window.location.search).has('plan')) router.push('/panel/plan')
      else if (plantilla) router.push(`/panel/plantillas?editar=1&plantilla=${encodeURIComponent(plantilla)}`)
      else router.push('/panel/plantillas?elegir=1')
    } catch (error) {
      if (error instanceof ErrorPanel && Object.keys(error.campos).length > 0) {
        setErrores(error.campos as Errores)
      } else {
        setErrorServidor(error instanceof Error ? error.message : 'No pudimos crear tu cuenta')
      }
      setEnviando(false)
    }
  }

  const elegido = PRODUCTOS.find((producto) => producto.clave === interes)

  if (!elegido) {
    return (
      <motion.div key="elegir" {...PASO}>
        <h1 className="text-[clamp(28px,2.6vw,36px)] leading-[1.02] font-normal tracking-[-0.045em]">
          ¿Qué quieres armar?
        </h1>
        <p className="mt-1.5 text-sm text-sitio-tenue">Puedes sumar los otros después, con la misma cuenta.</p>

        <div className="mt-6 space-y-2.5">
          {PRODUCTOS.map((producto, indice) => (
            <motion.button
              key={producto.clave}
              type="button"
              onClick={() => setInteres(producto.clave)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 + indice * 0.06, ease: SALIDA }}
              className="group flex w-full items-center gap-4 rounded-lg border border-sitio-borde bg-sitio-campo p-4 text-left transition-colors duration-300 hover:border-white/30"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-sitio-borde text-white/70 transition-colors group-hover:text-white">
                <producto.icono aria-hidden="true" strokeWidth={1.5} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2.5">
                  <span className="text-[15px] tracking-[-0.01em] text-white">{producto.nombre}</span>
                  {!producto.disponible && (
                    <span className="text-[10px] tracking-[0.14em] text-sitio-tenue uppercase">Próximamente</span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-sitio-tenue">{producto.resumen}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-white/30 transition-[transform,color] duration-500 ease-salida group-hover:translate-x-1 group-hover:text-white"
              />
            </motion.button>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-sitio-tenue">
          ¿Ya tienes cuenta?{' '}
          <Link href="/panel/ingresar" className="font-medium text-white underline-offset-4 transition-colors hover:underline">
            Ingresa
          </Link>
        </p>
      </motion.div>
    )
  }

  const esTienda = elegido.clave === 'tienda'
  const esPagina = elegido.clave === 'pagina'

  return (
    <motion.div key="datos" {...PASO}>
      <button
        type="button"
        onClick={() => setInteres(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-sitio-tenue transition-colors hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {elegido.nombre}
      </button>
      <h1 className="text-[clamp(28px,2.6vw,36px)] leading-[1.02] font-normal tracking-[-0.045em]">
        {esTienda ? 'Crea tu tienda gratis' : esPagina ? 'Crea tu página gratis' : 'Crea tu cuenta gratis'}
      </h1>
      <p className="mt-1.5 text-sm text-sitio-tenue">
        {esTienda || esPagina
          ? 'En un par de minutos la tienes publicada. Sin tarjeta de crédito.'
          : 'Sin tarjeta de crédito. Tu dirección queda reservada desde hoy.'}
      </p>

      {!elegido.disponible && (
        <div className="mt-4">
          <AvisoFormulario tono="pendiente">
            {elegido.nombre} está en construcción. Mientras tanto empiezas con la tienda, y cuando esté lista la
            activas desde la misma cuenta.
          </AvisoFormulario>
        </div>
      )}

      <form onSubmit={alEnviar} noValidate className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3.5 sm:gap-x-4">
        <CampoTexto
          etiqueta="Tu nombre"
          nombre="nombre"
          valor={nombre}
          alCambiar={setNombre}
          marcador="Martín Vargas"
          autoCompletar="name"
          error={errores.nombre}
          autoFoco
        />

        <CampoTexto
          etiqueta="Correo"
          tipo="email"
          nombre="email"
          valor={email}
          alCambiar={setEmail}
          marcador="tu@correo.com"
          autoCompletar="email"
          error={errores.email}
        />

        <div className="col-span-2">
          <CampoContrasena
            etiqueta="Contraseña"
            nombre="contrasena"
            valor={contrasena}
            alCambiar={setContrasena}
            autoCompletar="new-password"
            error={errores.contrasena}
            medirFortaleza
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <CampoTexto
            etiqueta={esTienda ? 'Nombre de tu tienda' : 'Nombre de tu negocio'}
            nombre="tienda"
            valor={tienda}
            alCambiar={alCambiarTienda}
            marcador={esTienda ? 'Ropa Llanera' : 'Consultorio Morichal'}
            error={errores.tienda}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="subdominio" className="text-[12px] text-sitio-suave">
            {esTienda ? 'La dirección de tu tienda' : 'Tu dirección'}
          </label>

          {/* El dominio va pegado al campo, no debajo: así se lee de corrido
              como la dirección completa que va a quedar. */}
          <div
            className={`mt-1.5 flex items-stretch overflow-hidden rounded-lg border bg-sitio-campo transition-colors focus-within:border-white/40 ${
              errores.subdominio ? 'border-red-400/60' : 'border-sitio-borde'
            }`}
          >
            <input
              id="subdominio"
              name="subdominio"
              value={subdominioFinal}
              onChange={(evento) => alCambiarSubdominio(evento.target.value)}
              placeholder="tunegocio"
              aria-invalid={Boolean(errores.subdominio)}
              className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[14px] text-white outline-none placeholder:text-sitio-tenue"
            />
            <span className="flex shrink-0 items-center border-l border-sitio-borde bg-white/[0.03] px-3 text-[13px] text-sitio-tenue">
              .{configuracionDominios.dominioBase}
            </span>
          </div>

          {errores.subdominio ? (
            <p className="mt-1.5 text-[12.5px] text-red-300">{errores.subdominio}</p>
          ) : (
            <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[12px] text-sitio-tenue" title="Tu tienda va a vivir en esta dirección">
              <span aria-hidden="true" className="estado-punto mr-1" data-tono="verde" />
              <span className="truncate font-mono text-white/80">{dominioCompleto}</span>
            </p>
          )}
        </div>

        {/*
          El texto va fuera de la etiqueta a propósito. Un <label> que envuelva
          enlaces se los come: al pulsarlos, el navegador marca la casilla en
          vez de navegar. La casilla recibe su nombre accesible por aria-label.
        */}
        <div className="flex items-start gap-2.5 col-span-2">
          <input
            type="checkbox"
            name="condiciones"
            checked={condiciones}
            onChange={(evento) => setCondiciones(evento.target.checked)}
            aria-label="Acepto los términos y condiciones y la política de privacidad"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-sitio-borde-fuerte accent-white"
          />
          <p className="text-[13px] leading-relaxed text-sitio-suave">
            Acepto los{' '}
            <Link
              href="/terminos"
              className="text-white underline underline-offset-2 hover:text-sitio-suave"
            >
              términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link
              href="/privacidad"
              className="text-white underline underline-offset-2 hover:text-sitio-suave"
            >
              política de privacidad
            </Link>
            .
          </p>
        </div>
        {errores.condiciones && <p className="text-[12.5px] text-red-300 col-span-2">{errores.condiciones}</p>}

        {errorServidor && <div className="col-span-2"><AvisoFormulario>{errorServidor}</AvisoFormulario></div>}

        <button
          type="submit"
          disabled={enviando}
          className="boton boton-primario w-full col-span-2"
        >
          {enviando && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"
            />
          )}
          {enviando ? 'Creando tu cuenta…' : esTienda ? 'Crear mi tienda' : esPagina ? 'Crear mi página' : 'Crear mi cuenta'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-sitio-tenue">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/panel/ingresar"
          className="font-medium text-white underline-offset-4 transition-colors hover:underline"
        >
          Ingresa
        </Link>
      </p>
    </motion.div>
  )
}
