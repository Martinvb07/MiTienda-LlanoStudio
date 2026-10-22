import type { PropsPie } from '@/tipos/bloques'

/** wa.me exige el indicativo: a un celular colombiano de 10 dígitos se le antepone el 57. */
function numeroWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, '')
  return digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos
}

export function Pie({
  texto,
  mostrarRedes,
  instagram,
  whatsapp,
  ocultarMarca,
  quitarMarcaPermitido = false,
}: PropsPie & { quitarMarcaPermitido?: boolean }) {
  return (
    <footer className="mt-16 border-t border-tinta/10 px-6 py-10">
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
                href={`https://wa.me/${numeroWhatsapp(whatsapp)}`}
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

      {!(quitarMarcaPermitido && ocultarMarca) && (
        <p className="mt-6 text-center text-xs text-tinta/40">Hecho con Mi Tienda de Llano Studio</p>
      )}
    </footer>
  )
}
