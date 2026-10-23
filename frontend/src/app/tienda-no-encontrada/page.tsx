import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda no encontrada',
  robots: { index: false, follow: false },
}

/**
 * Destino de los dominios que no resuelven a ninguna tienda: subdominio libre,
 * dominio propio sin verificar o Host desconocido.
 */
export default function TiendaNoEncontrada() {
  return (
    <main className="marco-oscuro relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="entrada flex flex-col items-center">
        <span className="antetitulo mb-5">Mi Sitio</span>
        <h1 className="titulo-2 max-w-[16ch]">Aquí todavía no hay una tienda</h1>
        <p className="bajada mx-auto mt-5">
          Este dominio no está conectado a ninguna tienda publicada. Si es tuyo, revisa la
          configuración de dominios en el panel.
        </p>
        <a href="https://llanostudio.co" className="boton boton-primario mt-8">
          Ir a Llano Studio
        </a>
      </div>
    </main>
  )
}
