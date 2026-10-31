'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Boton } from './Boton'
import { moverLuz } from './Caracteristicas'
import { Contenedor } from './Contenedor'
import { PRODUCTOS, type ProductoSitio } from './productos'
import { Revelar } from './Revelar'
import { cn } from '@/utilidades/clases'

const SALIDA = [0.16, 1, 0.3, 1] as const
const CAMBIO = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(6px)' },
  transition: { duration: 0.55, ease: SALIDA },
} as const

type Que = 'productos' | 'servicios' | 'redes'
type Como = 'en-linea' | 'whatsapp' | 'no-cobro'
type Citas = 'si' | 'no'

interface Respuestas {
  que?: Que
  como?: Como
  citas?: Citas
}

const PREGUNTAS = [
  {
    clave: 'que',
    titulo: '¿Qué ofreces?',
    opciones: [
      { valor: 'productos', etiqueta: 'Productos', detalle: 'Ropa, comida, artesanías, repuestos…' },
      { valor: 'servicios', etiqueta: 'Servicios', detalle: 'Consultas, cortes, clases, asesorías…' },
      { valor: 'redes', etiqueta: 'Mi contenido o mi marca', detalle: 'Vivo en Instagram o TikTok' },
    ],
  },
  {
    clave: 'como',
    titulo: '¿Cómo te pagan hoy?',
    opciones: [
      { valor: 'en-linea', etiqueta: 'En línea o contra entrega', detalle: 'Tarjeta, PSE, Nequi o al recibir' },
      { valor: 'whatsapp', etiqueta: 'Lo acordamos por WhatsApp', detalle: 'O en persona' },
      { valor: 'no-cobro', etiqueta: 'No cobro por internet', detalle: 'Sólo quiero que me encuentren' },
    ],
  },
  {
    clave: 'citas',
    titulo: '¿Te piden citas o turnos?',
    opciones: [
      { valor: 'si', etiqueta: 'Sí, a diario', detalle: 'Quiero que agenden solos' },
      { valor: 'no', etiqueta: 'No', detalle: 'Me escriben y ya' },
    ],
  },
] as const

/** De las respuestas al producto, con la razón en una frase. */
function recomendar({ que, como, citas }: Required<Respuestas>): { producto: ProductoSitio; razon: string; extra?: string } {
  const de = (clave: ProductoSitio['clave']) => PRODUCTOS.find((producto) => producto.clave === clave)!
  if (que === 'productos') {
    return {
      producto: de('tienda'),
      razon:
        como === 'whatsapp'
          ? 'Tus clientes arman el pedido en tu tienda y te llega por WhatsApp listo para cerrar.'
          : 'Catálogo, carrito, pagos y envíos por zona. Tú sólo preparas el pedido.',
      extra: citas === 'si' ? 'Y si también agendas, la tienda puede llevar la sección de reservas.' : undefined,
    }
  }
  if (que === 'servicios' || citas === 'si') {
    return {
      producto: de('pagina'),
      razon:
        citas === 'si'
          ? 'Tus servicios, tu horario y reservas en línea: eligen día y hora libre, y la cita llega a tu agenda.'
          : 'Qué haces, quién atiende, cómo llegar y un formulario para que te escriban.',
    }
  }
  return {
    producto: de('enlaces'),
    razon: 'Un solo link para tu bio con tu WhatsApp, tus redes y lo que quieras mostrar.',
    extra: como === 'en-linea' ? 'Cuando quieras vender, sumas la tienda con la misma cuenta.' : undefined,
  }
}

/**
 * Tres preguntas y una recomendación: tienda, página o enlaces. El botón deja
 * elegido el producto al crear la cuenta.
 */
export function CualTeConviene() {
  const [respuestas, setRespuestas] = useState<Respuestas>({})
  const paso = !respuestas.que ? 0 : !respuestas.como ? 1 : !respuestas.citas ? 2 : 3
  const listo = paso === 3
  const resultado = listo ? recomendar(respuestas as Required<Respuestas>) : null

  function atras() {
    const claves = ['que', 'como', 'citas'] as const
    const ultima = claves[paso - 1]
    if (ultima) setRespuestas((actual) => ({ ...actual, [ultima]: undefined }))
  }

  return (
    <section id="cual-te-conviene" className="py-[72px] md:py-[112px]">
      <Contenedor>
        <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <span className="antetitulo mb-[22px]">¿Cuál te conviene?</span>
            <h2 className="titulo-2 max-w-[13ch]">Tres preguntas y te decimos</h2>
          </div>
          <p className="bajada md:justify-self-end">Sin registrarte. Si después quieres otro, lo sumas con la misma cuenta.</p>
        </Revelar>

        <Revelar>
          <div onPointerMove={moverLuz} className="baldosa foco relative overflow-hidden p-6 md:p-10">
            {/* Avance: una raya por pregunta */}
            <div className="mb-8 flex items-center gap-3">
              {PREGUNTAS.map((pregunta, indice) => (
                <span key={pregunta.clave} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="block h-full bg-white"
                    initial={false}
                    animate={{ width: indice < paso ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: SALIDA }}
                  />
                </span>
              ))}
            </div>

            <div className="min-h-[300px]">
              <AnimatePresence mode="wait" initial={false}>
                {!listo ? (
                  <motion.div key={PREGUNTAS[paso]!.clave} {...CAMBIO}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[13px] text-white/40">0{paso + 1} / 03</span>
                      {paso > 0 && (
                        <button type="button" onClick={atras} className="inline-flex items-center gap-1.5 text-[13px] text-white/50 transition hover:text-white">
                          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Atrás
                        </button>
                      )}
                    </div>
                    <h3 className="mt-4 text-[clamp(26px,3vw,40px)] leading-[1.05] tracking-[-0.04em]">{PREGUNTAS[paso]!.titulo}</h3>
                    <div className={cn('mt-8 grid gap-3', PREGUNTAS[paso]!.opciones.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
                      {PREGUNTAS[paso]!.opciones.map((opcion, indice) => (
                        <motion.button
                          key={opcion.valor}
                          type="button"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.08 + indice * 0.06, ease: SALIDA }}
                          onClick={() => setRespuestas((actual) => ({ ...actual, [PREGUNTAS[paso]!.clave]: opcion.valor }))}
                          className="group flex flex-col items-start rounded-[10px] border border-white/12 bg-white/[0.02] px-5 py-5 text-left transition-[border-color,background] duration-500 hover:border-white/35 hover:bg-white/[0.05]"
                        >
                          <span className="text-[17px] tracking-[-0.02em] text-white">{opcion.etiqueta}</span>
                          <span className="mt-1 text-[13px] text-white/50">{opcion.detalle}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  resultado && (
                    <motion.div key="resultado" {...CAMBIO} className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                      <div>
                        <span className="text-[13px] text-white/45">Te conviene</span>
                        <h3 className="mt-2 flex items-center gap-3 text-[clamp(30px,4vw,52px)] leading-[1.02] tracking-[-0.045em]">
                          <resultado.producto.icono aria-hidden="true" strokeWidth={1.4} className="h-[0.8em] w-[0.8em] shrink-0 text-sitio-azul-claro" />
                          {resultado.producto.nombre}
                        </h3>
                        <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-white/65">{resultado.razon}</p>
                        {resultado.extra && <p className="mt-2 max-w-[52ch] text-[14px] text-white/45">{resultado.extra}</p>}
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                        <Boton href={`/panel/crear-cuenta?producto=${resultado.producto.clave}`} flecha>
                          Empezar gratis
                        </Boton>
                        <Boton href={resultado.producto.href} variante="secundario">
                          Conocer {resultado.producto.clave === 'enlaces' ? 'los enlaces' : resultado.producto.clave === 'pagina' ? 'la página' : 'la tienda'}
                        </Boton>
                        <button
                          type="button"
                          onClick={() => setRespuestas({})}
                          className="inline-flex items-center justify-center gap-1.5 py-2 text-[13px] text-white/45 transition hover:text-white"
                        >
                          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Empezar de nuevo
                        </button>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>
        </Revelar>
      </Contenedor>
    </section>
  )
}
