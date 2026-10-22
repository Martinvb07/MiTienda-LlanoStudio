import type { Metadata } from 'next'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Contenedor } from '@/componentes/sitio/Contenedor'
import { Revelar } from '@/componentes/sitio/Revelar'

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Escríbenos si tienes dudas sobre Mi Tienda, necesitas ayuda con tu tienda o quieres el plan Pro.',
}

const CANALES = [
  {
    nombre: 'Instagram',
    detalle: '@llanostudio.co',
    texto: 'Lo más rápido para una consulta corta.',
    url: 'https://www.instagram.com/llanostudio.co/',
    externo: true,
  },
  {
    nombre: 'El estudio',
    detalle: 'llanostudio.co',
    texto: 'Para proyectos a medida que no son una tienda.',
    url: 'https://llanostudio.co',
    externo: true,
  },
]

export default function PaginaContacto() {
  return (
    <>
      <CabeceraPagina
        rotulo="Contacto"
        titulo="Hablemos de tu tienda"
        descripcion="Cuéntanos qué vendes y en qué estás trabado. Si es algo que la plataforma ya resuelve, te lo decimos derecho."
      />

      <section className="py-16 lg:py-20">
        <Contenedor>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <Revelar>
              {/*
                El envío todavía no está conectado: hace falta un endpoint en la
                API que reciba el mensaje. Los campos quedan deshabilitados para
                no aparentar que funciona.
              */}
              <form className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-sitio-tinta">Nombre</span>
                    <input
                      type="text"
                      name="nombre"
                      disabled
                      placeholder="Tu nombre"
                      className="mt-1.5 w-full rounded-lg border border-sitio-borde-fuerte px-3.5 py-2.5 text-sitio-tinta outline-none transition-colors placeholder:text-sitio-tenue/70 focus:border-sitio-azul disabled:bg-sitio-crema"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-sitio-tinta">Correo</span>
                    <input
                      type="email"
                      name="correo"
                      disabled
                      placeholder="tu@correo.com"
                      className="mt-1.5 w-full rounded-lg border border-sitio-borde-fuerte px-3.5 py-2.5 text-sitio-tinta outline-none transition-colors placeholder:text-sitio-tenue/70 focus:border-sitio-azul disabled:bg-sitio-crema"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-sitio-tinta">¿Qué vendes?</span>
                  <input
                    type="text"
                    name="negocio"
                    disabled
                    placeholder="Ropa, café, artesanías…"
                    className="mt-1.5 w-full rounded-lg border border-sitio-borde-fuerte px-3.5 py-2.5 text-sitio-tinta outline-none transition-colors placeholder:text-sitio-tenue/70 focus:border-sitio-azul disabled:bg-sitio-crema"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-sitio-tinta">Mensaje</span>
                  <textarea
                    name="mensaje"
                    rows={5}
                    disabled
                    placeholder="Cuéntanos en qué te podemos ayudar"
                    className="mt-1.5 w-full resize-y rounded-lg border border-sitio-borde-fuerte px-3.5 py-2.5 text-sitio-tinta outline-none transition-colors placeholder:text-sitio-tenue/70 focus:border-sitio-azul disabled:bg-sitio-crema"
                  />
                </label>

                <button
                  type="submit"
                  disabled
                  className="w-full rounded-full bg-sitio-azul px-6 py-3 font-medium text-white transition-colors hover:bg-sitio-azul-claro disabled:opacity-40 sm:w-auto"
                >
                  Enviar mensaje
                </button>

                <p className="text-sm text-sitio-tenue">
                  El formulario todavía no está conectado. Mientras tanto, escríbenos por
                  Instagram y te respondemos igual.
                </p>
              </form>
            </Revelar>

            <Revelar retardo={0.1}>
              <div className="space-y-4">
                {CANALES.map((canal) => (
                  <a
                    key={canal.nombre}
                    href={canal.url}
                    target={canal.externo ? '_blank' : undefined}
                    rel={canal.externo ? 'noopener noreferrer' : undefined}
                    className="group block baldosa foco p-5 transition-colors hover:border-sitio-azul"
                  >
                    <p className="font-medium tracking-[-0.01em] text-sitio-tinta">{canal.nombre}</p>
                    <p className="mt-0.5 text-sm text-sitio-azul">{canal.detalle}</p>
                    <p className="mt-2 text-sm text-sitio-suave">{canal.texto}</p>
                  </a>
                ))}

                <div className="rounded-2xl bg-sitio-crema p-5">
                  <p className="font-medium tracking-[-0.01em] text-sitio-tinta">Colombia</p>
                  <p className="mt-2 text-sm leading-relaxed text-sitio-suave">
                    Trabajamos en remoto. Respondemos en horario colombiano, de lunes a viernes.
                  </p>
                </div>
              </div>
            </Revelar>
          </div>
        </Contenedor>
      </section>
    </>
  )
}
