'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AvisoSinConectar, CampoContrasena, CampoTexto } from './CamposFormulario'
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
  const [intentado, setIntentado] = useState(false)

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

    if (!nombre.trim()) encontrados.nombre = 'Escribí tu nombre'

    if (!email.trim()) encontrados.email = 'Escribí tu correo'
    else if (!CORREO.test(email)) encontrados.email = 'Ese correo no parece válido'

    if (!contrasena) encontrados.contrasena = 'Elegí una contraseña'
    else if (contrasena.length < 8) encontrados.contrasena = 'Tiene que tener al menos 8 caracteres'

    if (!tienda.trim()) encontrados.tienda = 'Escribí el nombre de tu tienda'

    if (!subdominioFinal) encontrados.subdominio = 'Elegí una dirección para tu tienda'
    else if (!esSubdominioValido(subdominioFinal)) {
      encontrados.subdominio =
        subdominioFinal.length < 3
          ? 'Tiene que tener al menos 3 caracteres'
          : 'Esa dirección no está disponible. Probá con otra.'
    }

    if (!condiciones) encontrados.condiciones = 'Tenés que aceptar las condiciones'

    return encontrados
  }

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    const encontrados = validar()
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    // TODO: POST al backend para crear Tenant + Tienda + Usuario en una
    // transacción, y comprobar allí que el subdominio siga libre.
    await new Promise((listo) => setTimeout(listo, 800))
    setEnviando(false)
    setIntentado(true)
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-sitio-tinta">
        Creá tu tienda gratis
      </h1>
      <p className="mt-2 text-sitio-suave">
        En un par de minutos la tenés publicada. Sin tarjeta de crédito.
      </p>

      <form onSubmit={alEnviar} noValidate className="mt-8 space-y-5">
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

        <CampoContrasena
          etiqueta="Contraseña"
          nombre="contrasena"
          valor={contrasena}
          alCambiar={setContrasena}
          autoCompletar="new-password"
          error={errores.contrasena}
          medirFortaleza
        />

        <div className="border-t border-sitio-borde pt-5">
          <CampoTexto
            etiqueta="Nombre de tu tienda"
            nombre="tienda"
            valor={tienda}
            alCambiar={alCambiarTienda}
            marcador="Ropa Llanera"
            error={errores.tienda}
          />
        </div>

        <div>
          <label htmlFor="subdominio" className="text-sm font-medium text-sitio-tinta">
            La dirección de tu tienda
          </label>

          {/* El dominio va pegado al campo, no debajo: así se lee de corrido
              como la dirección completa que va a quedar. */}
          <div
            className={`mt-1.5 flex items-stretch overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-sitio-azul ${
              errores.subdominio ? 'border-red-400' : 'border-sitio-borde-fuerte'
            }`}
          >
            <input
              id="subdominio"
              name="subdominio"
              value={subdominioFinal}
              onChange={(evento) => alCambiarSubdominio(evento.target.value)}
              placeholder="tunegocio"
              aria-invalid={Boolean(errores.subdominio)}
              className="min-w-0 flex-1 px-3.5 py-2.5 text-sitio-tinta outline-none placeholder:text-sitio-tenue/70"
            />
            <span className="flex shrink-0 items-center border-l border-sitio-borde bg-sitio-crema px-3 text-sm text-sitio-tenue">
              .{configuracionDominios.dominioBase}
            </span>
          </div>

          {errores.subdominio ? (
            <p className="mt-1.5 text-sm text-red-600">{errores.subdominio}</p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-sitio-tenue">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Tu tienda va a vivir en{' '}
              <span className="font-medium text-sitio-tinta">{dominioCompleto}</span>
            </p>
          )}
        </div>

        {/*
          El texto va fuera de la etiqueta a propósito. Un <label> que envuelva
          enlaces se los come: al pulsarlos, el navegador marca la casilla en
          vez de navegar. La casilla recibe su nombre accesible por aria-label.
        */}
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="condiciones"
            checked={condiciones}
            onChange={(evento) => setCondiciones(evento.target.checked)}
            aria-label="Acepto los términos y condiciones y la política de privacidad"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-sitio-borde-fuerte accent-sitio-azul"
          />
          <p className="text-sm leading-relaxed text-sitio-suave">
            Acepto los{' '}
            <Link
              href="/terminos"
              className="text-sitio-azul underline underline-offset-2 hover:text-sitio-azul-fuerte"
            >
              términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link
              href="/privacidad"
              className="text-sitio-azul underline underline-offset-2 hover:text-sitio-azul-fuerte"
            >
              política de privacidad
            </Link>
            .
          </p>
        </div>
        {errores.condiciones && <p className="text-sm text-red-600">{errores.condiciones}</p>}

        {intentado && (
          <AvisoSinConectar>
            El alta todavía no está conectada. Falta el endpoint que cree el tenant, la tienda y
            el usuario en una sola transacción.
          </AvisoSinConectar>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sitio-azul px-6 py-3 font-medium text-white transition-colors hover:bg-sitio-azul-fuerte disabled:opacity-60"
        >
          {enviando && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {enviando ? 'Creando tu tienda…' : 'Crear mi tienda'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-sitio-suave">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/panel/ingresar"
          className="font-medium text-sitio-azul transition-colors hover:text-sitio-azul-fuerte"
        >
          Ingresá
        </Link>
      </p>
    </>
  )
}
