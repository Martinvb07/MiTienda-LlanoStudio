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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">Mi Tienda</p>
      <h1 className="text-3xl font-semibold text-slate-900">Aquí todavía no hay una tienda</h1>
      <p className="max-w-md text-slate-500">
        Este dominio no está conectado a ninguna tienda publicada. Si es tuyo, revisa la
        configuración de dominios en el panel.
      </p>
      <a
        href="https://llanostudio.co"
        className="mt-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Ir a Llano Studio
      </a>
    </main>
  )
}
