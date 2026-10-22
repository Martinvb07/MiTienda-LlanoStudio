import type { Metadata } from 'next'
import { Boton } from '@/componentes/sitio/Boton'
import { CabeceraPagina } from '@/componentes/sitio/CabeceraPagina'
import { Caracteristicas, ComoFunciona } from '@/componentes/sitio/Caracteristicas'
import { Contenedor } from '@/componentes/sitio/Contenedor'
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
        titulo="Todo lo que necesitas para vender, sin pedirle nada a nadie"
        descripcion="Diseño, catálogo, dominio y pagos en un solo lugar. Sin plugins que instalar ni piezas sueltas que conectar entre sí."
      >
        <Boton href="/panel/crear-cuenta" flecha>
          Crear mi tienda
        </Boton>
      </CabeceraPagina>

      <Caracteristicas />

      <ComoFunciona />

      <section className="pb-[110px] md:pb-[150px]">
        <Contenedor>
          <Revelar className="mb-14">
            <span className="antetitulo mb-[22px]">Además</span>
            <h2 className="titulo-2 max-w-[14ch]">Detalles que no se ven, pero se notan</h2>
          </Revelar>
          <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {DETALLES.map((detalle, indice) => (
              <Revelar key={detalle.titulo} retardo={(indice % 3) * 0.08}>
                <div className="border-t border-white/12 py-7">
                  <span className="font-mono text-[12px] text-white/35">{String(indice + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-[19px] tracking-[-0.02em]">{detalle.titulo}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{detalle.texto}</p>
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
