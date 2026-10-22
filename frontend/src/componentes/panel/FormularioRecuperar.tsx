'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AvisoFormulario, CampoTexto } from './CamposFormulario'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Recuperación de contraseña. El envío del enlace todavía no existe en el
 * backend (falta un proveedor de correo), así que en vez de aparentar que se
 * mandó, se le dice a la persona cómo pedir ayuda.
 */
export function FormularioRecuperar() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [intentado, setIntentado] = useState(false)

  function alEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!email.trim()) return setError('Escribe tu correo')
    if (!CORREO.test(email)) return setError('Ese correo no parece válido')
    setError(undefined)
    setIntentado(true)
  }

  return (
    <>
      <h1 className="text-[clamp(34px,3.4vw,46px)] leading-[1.02] font-normal tracking-[-0.045em]">Recupera tu contraseña</h1>
      <p className="mt-2 text-sm text-sitio-tenue">
        Escribe el correo con el que te registraste y te ayudamos a cambiarla.
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
          error={error}
          autoFoco
        />

        {intentado && (
          <AvisoFormulario tono="pendiente">
            El enlace por correo todavía no está conectado. Mientras tanto escríbenos por{' '}
            <a
              href="https://www.instagram.com/llanostudio.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2"
            >
              Instagram
            </a>{' '}
            desde la cuenta de tu tienda y te ayudamos a recuperarla.
          </AvisoFormulario>
        )}

        <button type="submit" className="boton boton-primario w-full">
          Recuperar acceso
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-sitio-tenue">
        <Link href="/panel/ingresar" className="font-medium text-white underline-offset-4 hover:underline">
          ← Volver a ingresar
        </Link>
      </p>
    </>
  )
}
