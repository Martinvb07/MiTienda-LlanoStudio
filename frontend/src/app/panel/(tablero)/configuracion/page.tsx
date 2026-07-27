import type { Metadata } from 'next'
import { Tarjeta } from '@/componentes/comunes/Tarjeta'

export const metadata: Metadata = { title: 'Configuración' }

export default function PaginaConfiguracion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-slate-500">Datos, dominio y apariencia de tu tienda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tarjeta titulo="Datos de la tienda" descripcion="Nombre, descripción y logo." />
        <Tarjeta
          titulo="Dominio"
          descripcion="Tu subdominio en llanostudio.co y, si quieres, tu dominio propio."
        />
        <Tarjeta titulo="Tema" descripcion="Colores y tipografía; se aplican como variables CSS." />
        <Tarjeta titulo="Pagos" descripcion="Wompi y PSE — fase posterior." />
      </div>
    </div>
  )
}
