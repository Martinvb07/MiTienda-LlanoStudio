'use client'

import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BadgeCheck, CheckCircle2, PenLine, Star } from 'lucide-react'
import type { ResenaPublica, ResumenResenas } from '@/tipos/tienda'
import { enviarResena } from '@/app/(tienda)/[subdominio]/acciones-sitio'
import { Estrellas } from '../Estrellas'

const SALIDA = [0.16, 1, 0.3, 1] as const
const campo = 'w-full rounded-(--radius-marca) border border-tinta/15 bg-transparent px-3.5 py-3 outline-none transition focus:border-tinta/60'

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Opiniones de un producto: el resumen con barras por estrellas, las
 * aprobadas y un formulario para dejar la propia (sale cuando la tienda la
 * aprueba).
 */
export function Opiniones({
  productoId,
  resenas,
  resumen,
  editando,
}: {
  productoId: string
  resenas: ResenaPublica[]
  resumen: ResumenResenas | null
  editando?: boolean
}) {
  const [escribiendo, setEscribiendo] = useState(false)
  const [estrellas, setEstrellas] = useState(0)
  const [encima, setEncima] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [visibles, setVisibles] = useState(6)

  const conteo = [5, 4, 3, 2, 1].map((valor) => ({ valor, cantidad: resenas.filter((resena) => resena.estrellas === valor).length }))

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando || editando) return
    if (!estrellas) {
      setErrores({ estrellas: 'Elige de 1 a 5 estrellas' })
      return
    }
    const datos = new FormData(evento.currentTarget)
    const texto = (clave: string) => String(datos.get(clave) ?? '').trim()
    setEnviando(true)
    setError('')
    setErrores({})
    const resultado = await enviarResena({
      productoId,
      nombre: texto('nombre'),
      email: texto('email'),
      ciudad: texto('ciudad') || undefined,
      estrellas,
      texto: texto('texto'),
      sitioWeb: texto('sitio_web') || undefined,
    })
    setEnviando(false)
    if (resultado.ok) setEnviada(true)
    else {
      setErrores(resultado.campos)
      setError(Object.keys(resultado.campos).length ? '' : resultado.mensaje)
    }
  }

  return (
    <section id="opiniones" className="mt-24 scroll-mt-24">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
        <div className="lg:w-[300px] lg:shrink-0">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Opiniones</h2>
          {resumen && resumen.total > 0 ? (
            <>
              <div className="mt-4 flex items-center gap-3">
                <span className="font-display text-5xl font-semibold tabular-nums">{resumen.promedio.toLocaleString('es-CO', { minimumFractionDigits: 1 })}</span>
                <span className="flex flex-col gap-1">
                  <Estrellas valor={resumen.promedio} />
                  <span className="text-sm text-tinta/60">
                    {resumen.total} {resumen.total === 1 ? 'opinión' : 'opiniones'}
                  </span>
                </span>
              </div>
              <ul className="mt-5 flex flex-col gap-1.5">
                {conteo.map(({ valor, cantidad }) => (
                  <li key={valor} className="flex items-center gap-2.5 text-sm text-tinta/65">
                    <span className="inline-flex w-7 items-center gap-0.5 tabular-nums">
                      {valor}
                      <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-tinta/10">
                      <motion.span
                        className="block h-full rounded-full bg-amber-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${resenas.length ? (cantidad / resenas.length) * 100 : 0}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: SALIDA }}
                      />
                    </span>
                    <span className="w-6 text-right tabular-nums">{cantidad}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-tinta/60">Todavía no hay opiniones. ¡Sé la primera persona en contar cómo le fue!</p>
          )}
          {!escribiendo && !enviada && (
            <button
              type="button"
              onClick={() => setEscribiendo(true)}
              className="boton-tienda mt-6 inline-flex items-center gap-2 rounded-(--radius-marca) border border-tinta/20 px-5 py-3 font-medium transition hover:bg-tinta/5"
            >
              <PenLine aria-hidden="true" className="h-4 w-4" />
              Escribir una opinión
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <AnimatePresence initial={false}>
            {(escribiendo || enviada) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.6, ease: SALIDA }}
                className="mb-10 overflow-hidden"
              >
                <div className="rounded-(--radius-marca) border border-tinta/10 bg-tinta/[0.02] p-6">
                  {enviada ? (
                    <p className="flex items-center gap-3 text-tinta/80">
                      <CheckCircle2 aria-hidden="true" className="h-6 w-6 shrink-0 text-emerald-500" strokeWidth={1.6} />
                      ¡Gracias por tu opinión! La publicamos en cuanto la revisemos.
                    </p>
                  ) : (
                    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-sm text-tinta/70">Tu calificación</span>
                        <div className="flex gap-1" onMouseLeave={() => setEncima(0)} role="radiogroup" aria-label="Estrellas">
                          {[1, 2, 3, 4, 5].map((valor) => (
                            <button
                              key={valor}
                              type="button"
                              role="radio"
                              aria-checked={estrellas === valor}
                              aria-label={`${valor} ${valor === 1 ? 'estrella' : 'estrellas'}`}
                              onMouseEnter={() => setEncima(valor)}
                              onClick={() => setEstrellas(valor)}
                              className="p-0.5 transition-transform active:scale-90"
                            >
                              <Star
                                aria-hidden="true"
                                strokeWidth={1.5}
                                className={`h-7 w-7 transition-colors ${valor <= (encima || estrellas) ? 'fill-amber-400 text-amber-400' : 'text-tinta/25'}`}
                              />
                            </button>
                          ))}
                        </div>
                        {errores.estrellas && <span className="text-xs text-red-600">{errores.estrellas}</span>}
                      </div>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-tinta/70">Nombre</span>
                        <input name="nombre" autoComplete="given-name" required className={campo} />
                        {errores.nombre && <span className="text-xs text-red-600">{errores.nombre}</span>}
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-tinta/70">Ciudad (opcional)</span>
                        <input name="ciudad" autoComplete="address-level2" className={campo} />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                        <span className="text-tinta/70">Correo (no se publica)</span>
                        <input name="email" type="email" autoComplete="email" required className={campo} />
                        {errores.email && <span className="text-xs text-red-600">{errores.email}</span>}
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                        <span className="text-tinta/70">Tu opinión</span>
                        <textarea name="texto" rows={4} maxLength={1500} required className={campo} placeholder="¿Qué te gustó? ¿Cómo te quedó?" />
                        {errores.texto && <span className="text-xs text-red-600">{errores.texto}</span>}
                      </label>
                      <input name="sitio_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                      {error && <p className="rounded-(--radius-marca) bg-red-500/10 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
                      <div className="flex gap-3 sm:col-span-2">
                        <button
                          type="submit"
                          disabled={enviando || editando}
                          className="boton-tienda rounded-(--radius-marca) bg-marca px-6 py-3 font-medium text-marca-contraste transition hover:opacity-90 disabled:opacity-50"
                        >
                          {enviando ? 'Enviando…' : 'Publicar opinión'}
                        </button>
                        <button type="button" onClick={() => setEscribiendo(false)} className="px-3 text-sm text-tinta/60 hover:text-tinta">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {resenas.length > 0 && (
            <ul className="divide-y divide-tinta/10 border-y border-tinta/10">
              {resenas.slice(0, visibles).map((resena) => (
                <li key={resena.id} className="py-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Estrellas valor={resena.estrellas} />
                    <span className="text-xs text-tinta/45">{fecha(resena.creadoEn)}</span>
                  </div>
                  <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta/85">{resena.texto}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta/60">
                    <span className="font-medium text-tinta/80">{resena.nombre}</span>
                    {resena.ciudad && <span>· {resena.ciudad}</span>}
                    {resena.verificada && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <BadgeCheck aria-hidden="true" className="h-4 w-4" /> Compra verificada
                      </span>
                    )}
                  </p>
                  {resena.respuesta && (
                    <div className="mt-4 rounded-(--radius-marca) bg-tinta/[0.04] px-4 py-3 text-sm text-tinta/75">
                      <span className="mb-1 block text-xs font-medium tracking-wide text-tinta/55 uppercase">Respuesta de la tienda</span>
                      {resena.respuesta}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {resenas.length > visibles && (
            <button type="button" onClick={() => setVisibles((valor) => valor + 6)} className="mt-6 text-sm font-medium underline underline-offset-4">
              Ver más opiniones
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
