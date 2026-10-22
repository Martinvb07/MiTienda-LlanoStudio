import Image from 'next/image'
import Link from 'next/link'

/**
 * Marco de las pantallas de sesión: una sola columna centrada sobre negro,
 * con el halo azul de llanostudio.co detrás. Nada compite con lo único que hay
 * que hacer aquí, que es escribir dos campos y seguir.
 */
export default function LayoutSesion({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-oscuro relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12 font-sans">
      <div aria-hidden="true" className="halo !top-[-10%]" />
      <div
        aria-hidden="true"
        className="cuadricula pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]"
      />

      <div className="entrada relative w-full max-w-[26rem]">
        <Link href="/" className="flex items-center justify-center gap-[11px]">
          <Image src="/llanostudio-marca.png" alt="Llano Studio" width={232} height={205} priority className="h-7 w-auto" />
          <span className="text-base font-semibold tracking-[-0.02em]">Mi Tienda</span>
        </Link>

        <div className="mt-7 rounded-[14px] border border-sitio-borde bg-sitio-superficie/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
          {children}
        </div>

        <p className="mt-8 text-center text-xs text-sitio-tenue">
          © {new Date().getFullYear()} Mi Tienda · Un producto de Llano Studio
        </p>
      </div>
    </div>
  )
}
