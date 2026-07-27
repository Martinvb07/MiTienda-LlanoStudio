import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Caracteristicas } from '@/componentes/sitio/Caracteristicas'
import { Contenedor, Rotulo } from '@/componentes/sitio/Contenedor'
import { LlamadoFinal } from '@/componentes/sitio/LlamadoFinal'
import { Revelar } from '@/componentes/sitio/Revelar'

export const metadata: Metadata = {
  title: 'Características',
  description:
    'Editor de bloques, catálogo con fotos optimizadas, dominio propio y pagos colombianos. Todo lo que trae Mi Tienda para vender en línea.',
}

const DETALLES = [
  {
    titulo: 'Tu tienda carga rápido',
    texto:
      'Las páginas se arman en el servidor y se guardan listas para servir. El comprador no espera a que se cargue nada antes de ver tus productos.',
  },
  {
    titulo: 'Google ve tu catálogo entero',
    texto:
      'Cada producto tiene su propia página con título, descripción e imagen. No es una aplicación que el buscador no pueda leer.',
  },
  {
    titulo: 'Se ve bien en celular',
    texto:
      'La mayoría de tus clientes va a entrar desde el teléfono. Todas las plantillas se adaptan solas a la pantalla.',
  },
  {
    titulo: 'Tus ventas quedan registradas',
    texto:
      'Cada pedido guarda una copia del nombre y el precio del producto en el momento de la venta. Cambiar el catálogo mañana no altera tu histórico.',
  },
  {
    titulo: 'Tus datos son sólo tuyos',
    texto:
      'Cada tienda está aislada de las demás. Ningún otro cliente de la plataforma puede ver ni tocar tu información.',
  },
  {
    titulo: 'El trabajo pesado no te frena',
    texto:
      'Optimizar fotos o confirmar un pago ocurre en segundo plano. Tu tienda sigue respondiendo mientras tanto.',
  },
]

export default function PaginaCaracteristicas() {
  return (
    <>
      <CabeceraPagina
        rotulo="Características"
        titulo="Todo lo que necesitás para vender, sin pedirle nada a nadie"
        descripcion="Diseño, catálogo, dominio y pagos en un solo lugar. Sin plugins que instalar ni piezas sueltas que conectar entre sí."
      >
        <Boton href="/panel/crear-cuenta" tamano="grande" flecha>
          Crear mi tienda
        </Boton>
      </CabeceraPagina>

      <Caracteristicas />

      <section className="bg-white py-20 lg:py-24">
        <Contenedor>
          <Revelar className="max-w-2xl">
            <Rotulo indice="—">Además</Rotulo>
            <h2 className="mt-5 font-display text-3xl leading-[1.1] font-bold tracking-[-0.03em] text-balance text-sitio-tinta sm:text-4xl">
              Detalles que no se ven, pero se notan
            </h2>
          </Revelar>

          <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {DETALLES.map((detalle, indice) => (
              <Revelar key={detalle.titulo} retardo={(indice % 3) * 0.07}>
                <div className="border-t border-sitio-borde-fuerte pt-5">
                  <h3 className="font-display font-semibold text-sitio-tinta">{detalle.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-sitio-suave">
                    {detalle.texto}
                  </p>
                </div>
              </Revelar>
            ))}
          </div>
        </Contenedor>
      </section>

      <LlamadoFinal />
    </>
  )
}
