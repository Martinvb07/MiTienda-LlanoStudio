import { NavegacionPanel } from '@/componentes/panel/NavegacionPanel'
import { ProveedorSesion } from '@/componentes/panel/SesionPanel'
import { TransicionPanel } from '@/componentes/panel/TransicionPanel'
import { ProveedorAvisos } from '@/componentes/panel/Avisos'
import { ProveedorBuscador } from '@/componentes/panel/BuscadorRapido'

/**
 * Marco del tablero de administración. Siempre se sirve en
 * mitienda.llanostudio.co; el middleware garantiza que ningún dominio de tienda
 * llegue hasta aquí. Mismo negro y misma tipografía que llanostudio.co.
 */
export default function LayoutTablero({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-oscuro min-h-screen font-sans">
      <ProveedorSesion
        cargando={
          <div className="grid min-h-screen place-items-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-white" />
          </div>
        }
      >
        <ProveedorAvisos>
          <ProveedorBuscador>
            <div className="flex min-h-screen flex-col md:flex-row">
              <NavegacionPanel />
              <main className="mx-auto w-full max-w-[1280px] min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 md:px-10 md:py-10">
                <TransicionPanel>{children}</TransicionPanel>
              </main>
            </div>
          </ProveedorBuscador>
        </ProveedorAvisos>
      </ProveedorSesion>
    </div>
  )
}
