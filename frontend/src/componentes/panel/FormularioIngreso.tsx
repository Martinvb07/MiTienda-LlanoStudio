'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ingresar } from '@/servicios/panel'
import { AvisoFormulario, CampoContrasena, CampoTexto } from './CamposFormulario'

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
  const [errorServidor, setErrorServidor] = useState('')
  const router = useRouter()

  function validar(): Errores {
    const encontrados: Errores = {}
    if (!email.trim()) encontrados.email = 'Escribe tu correo'
    else if (!CORREO.test(email)) encontrados.email = 'Ese correo no parece válido'
    if (!contrasena) encontrados.contrasena = 'Escribe tu contraseña'
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
      await ingresar(email.trim(), contrasena)
      router.push('/panel')
    } catch (error) {
      setErrorServidor(error instanceof Error ? error.message : 'No pudimos iniciar tu sesión')
      setEnviando(false)
    }
  }

  return (
    <>
      <h1 className="text-[32px] leading-[1.05] font-normal tracking-[-0.04em]">
        Entra a tu tienda
      </h1>
      <p className="mt-2 text-sm text-sitio-tenue">
        Administra productos, diseño y pedidos desde un solo lugar.
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
              className="text-[12px] text-sitio-suave transition-colors hover:text-white"
            >
              ¿La olvidaste?
            </Link>
          }
        />

        {errorServidor && <AvisoFormulario>{errorServidor}</AvisoFormulario>}

        <button
          type="submit"
          disabled={enviando}
          className="boton boton-primario w-full"
        >
          {enviando && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"
            />
          )}
          {enviando ? 'Entrando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-sitio-tenue">
        ¿Todavía no tienes tienda?{' '}
        <Link
          href="/panel/crear-cuenta"
          className="font-medium text-white underline-offset-4 transition-colors hover:underline"
        >
          Crea una gratis
        </Link>
      </p>
    </>
  )
}
