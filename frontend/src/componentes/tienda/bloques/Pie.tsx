import type { PropsPie } from '@/tipos/bloques'

export function Pie({ texto, mostrarRedes, instagram, whatsapp }: PropsPie) {
  return (
    <footer className="mt-16 border-t border-black/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-tinta/60">{texto}</p>

        {mostrarRedes && (instagram || whatsapp) && (
          <nav className="flex gap-5 text-sm">
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tinta/60 transition hover:text-tinta"
              >
                Instagram
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tinta/60 transition hover:text-tinta"
              >
                WhatsApp
              </a>
            )}
          </nav>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-tinta/40">
        Hecho con Mi Tienda de Llano Studio
      </p>
    </footer>
  )
}
