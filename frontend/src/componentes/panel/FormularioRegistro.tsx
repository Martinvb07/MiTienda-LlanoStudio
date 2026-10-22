'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ErrorPanel, registrar } from '@/servicios/panel'
import { AvisoFormulario, CampoContrasena, CampoTexto } from './CamposFormulario'
import { configuracionDominios, esSubdominioValido } from '@/utilidades/dominios'
import { generarSlug } from '@/utilidades/formato'

interface Errores {
  nombre?: string
  email?: string
  contrasena?: string
  tienda?: string
  subdominio?: string
  condiciones?: string
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function FormularioRegistro() {
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

    if (!tienda.trim()) encontrados.tienda = 'Escribe el nombre de tu tienda'

    if (!subdominioFinal) encontrados.subdominio = 'Elige una dirección para tu tienda'
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
      })
      // Recién creada: directo al editor para que la arme.
      // Si llegó desde "Usar esta plantilla", el editor abre con ella aplicada.
      const plantilla = new URLSearchParams(window.location.search).get('plantilla')
      router.push(`/panel/plantillas?editar=1${plantilla ? `&plantilla=${encodeURIComponent(plantilla)}` : ''}`)
    } catch (error) {
      if (error instanceof ErrorPanel && Object.keys(error.campos).length > 0) {
        setErrores(error.campos as Errores)
      } else {
        setErrorServidor(error instanceof Error ? error.message : 'No pudimos crear tu tienda')
      }
      setEnviando(false)
    }
  }

  return (
    <>
      <h1 className="text-[clamp(28px,2.6vw,36px)] leading-[1.02] font-normal tracking-[-0.045em]">
        Crea tu tienda gratis
      </h1>
      <p className="mt-1.5 text-sm text-sitio-tenue">
        En un par de minutos la tienes publicada. Sin tarjeta de crédito.
      </p>

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
            etiqueta="Nombre de tu tienda"
            nombre="tienda"
            valor={tienda}
            alCambiar={alCambiarTienda}
            marcador="Ropa Llanera"
            error={errores.tienda}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="subdominio" className="text-[12px] text-sitio-suave">
            La dirección de tu tienda
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
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sitio-verde" />
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
          {enviando ? 'Creando tu tienda…' : 'Crear mi tienda'}
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
    </>
  )
}
