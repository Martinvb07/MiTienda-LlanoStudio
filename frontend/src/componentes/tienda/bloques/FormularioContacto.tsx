'use client'

import { useState, type FormEvent } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Mail, MapPin, MessageCircle, Send } from 'lucide-react'
import type { PropsFormulario } from '@/tipos/bloques'
import { enviarMensaje } from '@/app/(tienda)/[subdominio]/acciones-sitio'
import { enlaceWhatsapp, telefonoLegible } from '@/utilidades/whatsapp'
import { TituloSeccion } from './TituloSeccion'

const SALIDA = [0.16, 1, 0.3, 1] as const

interface Props extends PropsFormulario {
  whatsapp?: string
  correo?: string
  direccion?: string
  negocio?: string
  editando?: boolean
}

const campo = 'w-full rounded-(--radius-marca) border border-tinta/15 bg-transparent px-3.5 py-3 outline-none transition focus:border-tinta/60'

/**
 * Formulario de contacto: lo que se escribe llega al panel (Mensajes) y al
 * correo del negocio. Lleva un campo oculto que sólo llenan los robots.
 */
export function FormularioContacto({
  titulo,
  subtitulo,
  motivos,
  pedirTelefono,
  pedirCorreo,
  textoBoton,
  mensajeExito,
  conDatos,
  whatsapp,
  correo,
  direccion,
  negocio,
  editando,
}: Props) {
  const ruta = usePathname()
  const opciones = motivos.map((motivo) => motivo.trim()).filter(Boolean)
  const [motivo, setMotivo] = useState(opciones[0] ?? '')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const datos = conDatos && Boolean(whatsapp || correo || direccion)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando || editando) return
    const formulario = new FormData(evento.currentTarget)
    const texto = (clave: string) => String(formulario.get(clave) ?? '').trim()
    setEnviando(true)
    setError('')
    setErrores({})
    const resultado = await enviarMensaje({
      nombre: texto('nombre'),
      email: texto('email') || undefined,
      telefono: texto('telefono') || undefined,
      motivo: motivo || undefined,
      mensaje: texto('mensaje'),
      pagina: ruta,
      sitioWeb: texto('sitio_web') || undefined,
    })
    setEnviando(false)
    if (resultado.ok) setEnviado(true)
    else {
      setErrores(resultado.campos)
      setError(Object.keys(resultado.campos).length ? '' : resultado.mensaje)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <TituloSeccion titulo={titulo} subtitulo={subtitulo} />
      <div className={`grid gap-6 ${datos ? 'md:grid-cols-[1.4fr_1fr]' : 'mx-auto max-w-2xl'}`}>
        <div className="rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-6 sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            {enviado ? (
              <motion.div
                key="listo"
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: SALIDA }}
                className="flex flex-col items-center py-10 text-center"
              >
                <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-emerald-500" strokeWidth={1.5} />
                <p className="mt-5 max-w-sm text-lg text-tinta/80">{mensajeExito || '¡Gracias! Recibimos tu mensaje.'}</p>
              </motion.div>
            ) : (
              <motion.form key="formulario" exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }} transition={{ duration: 0.4, ease: SALIDA }} onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
                {opciones.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:col-span-2" role="radiogroup" aria-label="Motivo">
                    {opciones.map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        role="radio"
                        aria-checked={motivo === opcion}
                        onClick={() => setMotivo(opcion)}
                        className={`boton-tienda rounded-full border px-4 py-2 text-sm transition ${
                          motivo === opcion ? 'border-marca bg-marca text-marca-contraste' : 'border-tinta/15 hover:border-tinta/40'
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                )}
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                  <span className="text-tinta/70">Nombre</span>
                  <input name="nombre" autoComplete="name" required className={campo} aria-invalid={Boolean(errores.nombre)} />
                  {errores.nombre && <span className="text-xs text-red-600">{errores.nombre}</span>}
                </label>
                {pedirCorreo && (
                  <label className={`flex flex-col gap-1.5 text-sm ${pedirTelefono ? '' : 'sm:col-span-2'}`}>
                    <span className="text-tinta/70">Correo</span>
                    <input name="email" type="email" autoComplete="email" className={campo} aria-invalid={Boolean(errores.email)} />
                    {errores.email && <span className="text-xs text-red-600">{errores.email}</span>}
                  </label>
                )}
                {pedirTelefono && (
                  <label className={`flex flex-col gap-1.5 text-sm ${pedirCorreo ? '' : 'sm:col-span-2'}`}>
                    <span className="text-tinta/70">Celular</span>
                    <input name="telefono" type="tel" autoComplete="tel" className={campo} aria-invalid={Boolean(errores.telefono)} />
                    {errores.telefono && <span className="text-xs text-red-600">{errores.telefono}</span>}
                  </label>
                )}
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                  <span className="text-tinta/70">Mensaje</span>
                  <textarea name="mensaje" rows={5} maxLength={3000} required className={campo} aria-invalid={Boolean(errores.mensaje)} />
                  {errores.mensaje && <span className="text-xs text-red-600">{errores.mensaje}</span>}
                </label>
                {/* Trampa para robots: invisible para las personas. */}
                <input name="sitio_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                {error && <p className="rounded-(--radius-marca) bg-red-500/10 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
                <button
                  type="submit"
                  disabled={enviando || editando}
                  className="boton-tienda inline-flex items-center justify-center gap-2 rounded-(--radius-marca) bg-marca px-6 py-3.5 font-medium text-marca-contraste transition hover:opacity-90 disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                  {enviando ? 'Enviando…' : textoBoton || 'Enviar'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {datos && (
          <ul className="flex h-fit flex-col gap-5 rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-6 text-tinta/80 sm:p-8">
            {whatsapp && (
              <li>
                <a href={enlaceWhatsapp(whatsapp, `Hola${negocio ? ` ${negocio}` : ''}`)} target="_blank" rel="noopener noreferrer" className="flex gap-3 transition hover:text-tinta">
                  <MessageCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-marca" />
                  <span>
                    <span className="block text-sm text-tinta/55">WhatsApp</span>
                    {telefonoLegible(whatsapp)}
                  </span>
                </a>
              </li>
            )}
            {correo && (
              <li>
                <a href={`mailto:${correo}`} className="flex gap-3 transition hover:text-tinta">
                  <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-marca" />
                  <span className="min-w-0">
                    <span className="block text-sm text-tinta/55">Correo</span>
                    <span className="break-all">{correo}</span>
                  </span>
                </a>
              </li>
            )}
            {direccion && (
              <li className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-marca" />
                <span>
                  <span className="block text-sm text-tinta/55">Dirección</span>
                  {direccion}
                </span>
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}
