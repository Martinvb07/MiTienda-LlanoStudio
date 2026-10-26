import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpRight,
  AtSign,
  BarChart3,
  Clock,
  BellRing,
  Files,
  Inbox,
  MessageCircle,
  Palette,
  QrCode,
  Users,
} from 'lucide-react'
import { Baldosa } from './Caracteristicas'
import { Detalles, type Detalle } from './Detalles'
import { Contenedor } from './Contenedor'
import { Revelar } from './Revelar'
import { PLANTILLAS_ENLACES } from '@/utilidades/plantillasEnlaces'
import { PLANTILLAS_PAGINA } from '@/utilidades/plantillasPagina'

/** Lo que trae cada uno hoy, igual que en /para-negocios y /enlaces. */
const DETALLES_PAGINA: Detalle[] = [
  { icono: Inbox, titulo: 'Formulario de contacto', texto: 'Cotizaciones y preguntas que llegan a tu panel y a tu correo.' },
  { icono: BellRing, titulo: 'Recordatorio de citas', texto: 'Un correo al cliente el día antes, para que no se le olvide.' },
  { icono: Clock, titulo: 'Servicios y horario', texto: 'Con precio, duración y días de atención.' },
  { icono: Users, titulo: 'Tu equipo', texto: 'Foto, nombre y cargo de quienes atienden.', plan: 'Desde Emprende' },
  { icono: Files, titulo: 'Páginas aparte', texto: 'Como /servicios o /equipo, cada una con su enlace.', plan: 'Negocio y Pro' },
  { icono: BarChart3, titulo: 'Clientes y visitas', texto: 'Quién te agenda y cuánta gente entra a tu página.' },
]

const DETALLES_ENLACES: Detalle[] = [
  { icono: QrCode, titulo: 'Código QR', texto: 'Para el mostrador, las bolsas o tu tarjeta.' },
  { icono: Palette, titulo: 'Tu color y tu letra', texto: 'Fondo degradado o de malla, botones a tu gusto.', plan: 'Desde Emprende' },
  { icono: BarChart3, titulo: 'Visitas', texto: 'Cuánta gente entra desde tu bio.' },
]

/** Lo que escribe la persona y el enlace que armamos solos. */
const ATAJOS = [
  { icono: AtSign, escribe: '@tumarca', queda: 'instagram.com/tumarca' },
  { icono: MessageCircle, escribe: '300 123 4567', queda: 'wa.me/573001234567' },
  { icono: AtSign, escribe: '@tumarca', queda: 'tiktok.com/@tumarca' },
]

/** Tres enlaces reales, en abanico. */
const ABANICO = ['coach-mateo', 'yuli-ariza', 'dulce-antojo'] as const

function Cabecera({ rotulo, titulo, texto, href, accion }: { rotulo: string; titulo: string; texto: string; href: string; accion: string }) {
  return (
    <Revelar className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
      <div>
        <span className="antetitulo mb-[22px]">{rotulo}</span>
        <h2 className="titulo-2 max-w-[13ch]">{titulo}</h2>
      </div>
      <div className="md:justify-self-end">
        <p className="bajada">{texto}</p>
        <Link href={href} className="enlace-flecha mt-6">
          {accion}
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </Revelar>
  )
}

/** La página para tu negocio a fondo, con el mismo mosaico de la tienda. */
export function SeccionPagina() {
  return (
    <section id="pagina" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Cabecera
          rotulo="Página para tu negocio"
          titulo="Que te encuentren y te escriban"
          texto="Para abogados, clínicas, restaurantes, gimnasios y oficios. Qué haces, quién atiende y cómo llegar, sin carrito."
          href="/para-negocios"
          accion="Conocer la página"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Baldosa
            ancha
            titulo="Una plantilla por oficio"
            texto={`${PLANTILLAS_PAGINA.length} diseños: salud, comida, belleza, talleres, finca raíz y más.`}
          >
            <div className="absolute top-0 left-7 w-[115%] overflow-hidden rounded-t-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2 md:left-8">
              <Image
                src="/ejemplos/sonrie-odontologia.webp"
                alt="Página de ejemplo Sonríe Odontología hecha con Mi Sitio"
                width={1440}
                height={900}
                sizes="(max-width: 768px) 120vw, 60vw"
                className="h-auto w-full"
              />
            </div>
          </Baldosa>

          <Baldosa retardo={0.08} titulo="Reservas en línea" texto="Eligen servicio, día y hora libre. La cita llega a tu agenda.">
            <MaquetaReservas />
          </Baldosa>
        </div>

        <Detalles detalles={DETALLES_PAGINA} />
      </Contenedor>
    </section>
  )
}

/** Los enlaces para la bio a fondo, con capturas reales y lo que se arma solo. */
export function SeccionEnlaces() {
  return (
    <section id="enlaces" className="py-[110px] md:py-[150px]">
      <Contenedor>
        <Cabecera
          rotulo="Enlaces para tu bio"
          titulo="Un solo link para tu bio"
          texto="Tu WhatsApp, tus redes, tu tienda o tu página en una pantalla corta. Para Instagram y TikTok."
          href="/enlaces"
          accion="Conocer los enlaces"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Baldosa
            ancha
            titulo="Hechos para el celular"
            texto={`${PLANTILLAS_ENLACES.length} plantillas: creadores, artistas, comida, coaches y más.`}
          >
            <div className="absolute inset-x-0 top-0 bottom-0 flex items-start justify-center">
              {ABANICO.map((ejemplo, indice) => {
                const centro = indice === 1
                return (
                  <div
                    key={ejemplo}
                    className={`relative -mx-4 w-[150px] shrink-0 overflow-hidden rounded-t-[24px] border-[5px] border-b-0 border-sitio-elevado bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] transition-transform duration-[1.2s] ease-salida md:w-[170px] ${
                      centro
                        ? 'z-10 group-hover:-translate-y-2'
                        : `mt-6 hidden opacity-90 sm:block ${indice === 0 ? '-rotate-6 group-hover:-translate-x-2' : 'rotate-6 group-hover:translate-x-2'}`
                    }`}
                  >
                    <Image
                      src={`/ejemplos/${ejemplo}-movil.webp`}
                      alt={centro ? 'Enlaces de ejemplo de Yuli Ariza hechos con Mi Sitio' : ''}
                      width={560}
                      height={1212}
                      sizes="170px"
                      className="h-auto w-full"
                    />
                  </div>
                )
              })}
            </div>
          </Baldosa>

          <Baldosa retardo={0.08} titulo="Escribe @usuario o el número" texto="Armamos el enlace solos, sin copiar direcciones largas.">
            <div className="absolute inset-x-7 top-0 bottom-7 flex flex-col justify-center gap-2 md:inset-x-8">
              {ATAJOS.map((atajo) => (
                <div
                  key={atajo.queda}
                  className="rounded-[8px] border border-white/10 bg-black/30 px-4 py-3 transition-colors duration-500 group-hover:border-white/15"
                >
                  <div className="flex items-center gap-3">
                    <atajo.icono aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-white/55" />
                    <span className="text-[13.5px] text-white/85">{atajo.escribe}</span>
                  </div>
                  <p className="mt-1 truncate pl-7 font-mono text-[11px] text-white/40">→ {atajo.queda}</p>
                </div>
              ))}
            </div>
          </Baldosa>
        </div>

        <Detalles detalles={DETALLES_ENLACES} />
      </Contenedor>
    </section>
  )
}

const DIAS_MUESTRA = [
  ['Lun', '26'],
  ['Mar', '27'],
  ['Mié', '28'],
  ['Jue', '29'],
] as const
const HORAS_MUESTRA = ['8:00', '9:30', '10:00', '11:30', '2:00', '3:30']

/** El paso de elegir día y hora de la sección de reservas, en un celular. No finge ser captura. */
function MaquetaReservas() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-1/2 w-[220px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border-[6px] border-b-0 border-sitio-elevado bg-[#f7f4ef] px-4 pt-5 pb-8 text-[#1c1917] transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2"
    >
      <p className="text-center font-serif text-[15px] font-semibold">Agenda tu cita</p>
      <p className="mt-3 text-[10px] font-medium">Elige el día</p>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
        {DIAS_MUESTRA.map(([dia, numero], indice) => (
          <span
            key={numero}
            className={`flex flex-col items-center rounded-md border py-1.5 text-[9px] ${indice === 1 ? 'border-[#1c1917] bg-[#1c1917]/[0.05]' : 'border-[#1c1917]/15'}`}
          >
            <span className="text-[#1c1917]/55">{dia}</span>
            <span className="text-[14px] font-semibold">{numero}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[10px] font-medium">Elige la hora</p>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {HORAS_MUESTRA.map((hora, indice) => (
          <span
            key={hora}
            className={`rounded-md border py-1.5 text-center text-[10px] ${indice === 2 ? 'border-[#1c1917] bg-[#1c1917] text-[#ffffff]' : 'border-[#1c1917]/15'}`}
          >
            {hora}
          </span>
        ))}
      </div>
      <span className="mt-4 block rounded-md bg-[#1c1917] py-2 text-center text-[10.5px] font-medium text-[#ffffff]">Confirmar cita · 10:00 a. m.</span>
    </div>
  )
}
