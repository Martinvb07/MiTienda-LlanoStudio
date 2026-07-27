'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AvisoSinConectar, CampoContrasena, CampoTexto } from './CamposFormulario'

interface Errores {
  email?: string
  contrasena?: string
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function FormularioIngreso() {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [intentado, setIntentado] = useState(false)

  function validar(): Errores {
    const encontrados: Errores = {}
    if (!email.trim()) encontrados.email = 'Escribí tu correo'
    else if (!CORREO.test(email)) encontrados.email = 'Ese correo no parece válido'
    if (!contrasena) encontrados.contrasena = 'Escribí tu contraseña'
    return encontrados
  }

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    const encontrados = validar()
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    // TODO: autenticar con NextAuth/Auth.js contra el modelo Usuario. Se simula
    // la espera para que el estado de carga ya sea el definitivo.
    await new Promise((listo) => setTimeout(listo, 700))
    setEnviando(false)
    setIntentado(true)
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-sitio-tinta">
        Entrá a tu tienda
      </h1>
      <p className="mt-2 text-sitio-suave">
        Administrá productos, diseño y pedidos desde un solo lugar.
      </p>

      <form onSubmit={alEnviar} noValidate className="mt-8 space-y-5">
        <CampoTexto
          etiqueta="Correo"
          tipo="email"
          nombre="email"
          valor={email}
          alCambiar={setEmail}
          marcador="tu@correo.com"
          autoCompletar="email"
          error={errores.email}
          autoFoco
        />

        <CampoContrasena
          etiqueta="Contraseña"
          nombre="contrasena"
          valor={contrasena}
          alCambiar={setContrasena}
          autoCompletar="current-password"
          error={errores.contrasena}
          enlaceOlvido={
            <Link
              href="/panel/recuperar"
              className="text-sm text-sitio-azul transition-colors hover:text-sitio-azul-fuerte"
            >
              ¿La olvidaste?
            </Link>
          }
        />

        {intentado && (
          <AvisoSinConectar>
            El ingreso todavía no está conectado. Falta la autenticación con NextAuth sobre el
            modelo de usuarios, que ya existe en la base de datos.
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
          {enviando ? 'Entrando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-sitio-suave">
        ¿Todavía no tenés tienda?{' '}
        <Link
          href="/panel/crear-cuenta"
          className="font-medium text-sitio-azul transition-colors hover:text-sitio-azul-fuerte"
        >
          Creá una gratis
        </Link>
      </p>
    </>
  )
}
