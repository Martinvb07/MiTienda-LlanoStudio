import Image from 'next/image'
import Link from 'next/link'

/**
 * Marco de las pantallas de sesión.
 *
 * Una sola columna centrada sobre fondo crema, con el formulario dentro de una
 * tarjeta. Nada compite con lo único que hay que hacer aquí, que es escribir
 * dos campos y seguir.
 */
export default function LayoutSesion({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sitio-crema px-6 py-12 font-sans text-sitio-tinta">
      {/* Trama muy tenue: da textura al fondo sin robar atención. */}
      <div
        aria-hidden="true"
        className="trama-puntos pointer-events-none absolute inset-0 text-sitio-borde-fuerte [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="relative w-full max-w-[26rem]">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-display text-lg font-bold tracking-tight"
        >
          <Image
            src="/llanostudio-marca-oscura.png"
            alt="Llano Studio"
            width={220}
            height={194}
            priority
            className="h-7 w-auto"
          />
          Mi Tienda
        </Link>

        <div className="mt-7 rounded-2xl border border-sitio-borde bg-white p-8 shadow-[0_18px_50px_-30px_rgba(10,15,28,0.35)]">
          {children}
        </div>

        <p className="mt-8 text-center text-xs text-sitio-tenue">
          © {new Date().getFullYear()} Mi Tienda · Un producto de Llano Studio
        </p>
      </div>
    </div>
  )
}
