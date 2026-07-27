import { Tarjeta } from '@/componentes/comunes/Tarjeta'

export default function PaginaResumen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
        <p className="mt-1 text-slate-500">
          Estructura lista. Aquí irán las métricas de ventas de la tienda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Pedidos" descripcion="Pendiente de la fase de pedidos" />
        <Tarjeta titulo="Ingresos" descripcion="Pendiente de la integración de pagos" />
        <Tarjeta titulo="Visitas" descripcion="Pendiente de analítica" />
      </div>
    </div>
  )
}
