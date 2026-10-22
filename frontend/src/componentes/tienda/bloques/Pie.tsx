import Link from 'next/link'
import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Music2 } from 'lucide-react'
import type { PropsPie } from '@/tipos/bloques'
import type { AjustesTienda } from '@/tipos/tienda'
import { generarSlug } from '@/utilidades/formato'
import { enlaceWhatsapp, telefonoLegible } from '@/utilidades/whatsapp'

interface Props extends PropsPie {
  quitarMarcaPermitido?: boolean
  ajustes?: AjustesTienda
  /** Categorías del catálogo, para la columna de enlaces. */
  categorias?: string[]
}

/**
 * Pie de la tienda. Con datos de contacto en los ajustes se vuelve un pie
 * completo en columnas (contacto, categorías, redes); sin ellos, una línea.
 */
export function Pie({
  texto,
  mostrarRedes,
  instagram,
  whatsapp,
  ocultarMarca,
  quitarMarcaPermitido = false,
  ajustes = {},
  categorias = [],
}: Props) {
  const telefono = ajustes.whatsapp || whatsapp
  const cuentaInstagram = ajustes.instagram || instagram
  const completo = Boolean(ajustes.direccion || ajustes.correo || ajustes.horario || categorias.length > 0)
  const marca = !(quitarMarcaPermitido && ocultarMarca) && (
    <p className="mt-8 text-center text-xs text-tinta/40">Hecho con Mi Tienda de Llano Studio</p>
  )

  const redes = mostrarRedes && (cuentaInstagram || ajustes.facebook || ajustes.tiktok || telefono) && (
    <div className="flex gap-3">
      {cuentaInstagram && (
        <a href={`https://instagram.com/${cuentaInstagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full border border-current/20 opacity-75 transition hover:opacity-100">
          <Instagram aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
      {ajustes.facebook && (
        <a href={ajustes.facebook.startsWith('http') ? ajustes.facebook : `https://facebook.com/${ajustes.facebook}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full border border-current/20 opacity-75 transition hover:opacity-100">
          <Facebook aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
      {ajustes.tiktok && (
        <a href={`https://tiktok.com/@${ajustes.tiktok.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="grid h-9 w-9 place-items-center rounded-full border border-current/20 opacity-75 transition hover:opacity-100">
          <Music2 aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
      {telefono && (
        <a href={enlaceWhatsapp(telefono)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full border border-current/20 opacity-75 transition hover:opacity-100">
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
    </div>
  )

  if (!completo) {
    return (
      <footer className="mt-16 border-t border-tinta/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-tinta/60">{texto}</p>
          {redes}
        </div>
        {marca}
      </footer>
    )
  }

  // Pie oscuro en columnas, con el color de la barra de la cabecera si la hay.
  return (
    <footer style={{ background: ajustes.colorBarra ?? '#0b0b0c' }} className="mt-16 px-6 pt-14 pb-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-semibold">Contáctanos</h3>
          <ul className="mt-4 space-y-2.5 text-sm opacity-80">
            {ajustes.direccion && (
              <li className="flex gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {ajustes.direccion}
              </li>
            )}
            {telefono && (
              <li>
                <a href={enlaceWhatsapp(telefono)} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 hover:underline">
                  <MessageCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {telefonoLegible(telefono)}
                </a>
              </li>
            )}
            {ajustes.correo && (
              <li>
                <a href={`mailto:${ajustes.correo}`} className="flex gap-2.5 hover:underline">
                  <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {ajustes.correo}
                </a>
              </li>
            )}
            {ajustes.horario && (
              <li className="flex gap-2.5">
                <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {ajustes.horario}
              </li>
            )}
          </ul>
        </div>

        {categorias.length > 0 && (
          <div>
            <h3 className="font-semibold">Tienda en línea</h3>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {categorias.slice(0, 8).map((categoria) => (
                <li key={categoria}>
                  <Link href={`/categoria/${generarSlug(categoria)}`} className="hover:underline">
                    {categoria}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(ajustes.menu?.length ?? 0) > 0 && (
          <div>
            <h3 className="font-semibold">Sobre nosotros</h3>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {ajustes.menu!.map((item) => (
                <li key={item.texto + item.enlace}>
                  <a href={item.enlace || '#'} className="hover:underline">
                    {item.texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-semibold">Síguenos</h3>
          <div className="mt-4">{redes}</div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-white/15 pt-6 text-xs opacity-60 sm:flex-row">
        <p>{texto}</p>
        {!(quitarMarcaPermitido && ocultarMarca) && <p>Hecho con Mi Tienda de Llano Studio</p>}
      </div>
    </footer>
  )
}
