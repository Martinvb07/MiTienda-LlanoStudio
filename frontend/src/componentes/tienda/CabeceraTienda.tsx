import Image from 'next/image'
import Link from 'next/link'
import { esMedioLocal } from '@/utilidades/medios'

interface Props {
  nombre: string
  logoUrl: string | null
}

/** Barra superior de la tienda: logo (o nombre) y acceso al catálogo. */
export function CabeceraTienda({ nombre, logoUrl }: Props) {
  return (
    <header className="border-b border-tinta/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt=""
              width={80}
              height={80}
              unoptimized={esMedioLocal(logoUrl)}
              className="h-9 w-9 shrink-0 rounded-(--radius-marca) object-contain"
            />
          )}
          <span className="truncate font-display text-lg font-semibold tracking-tight">{nombre}</span>
        </Link>
        <Link href="/#productos" className="shrink-0 text-sm text-tinta/70 transition hover:text-tinta">
          Productos
        </Link>
      </div>
    </header>
  )
}
