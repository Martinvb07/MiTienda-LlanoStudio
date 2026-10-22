/**
 * Ilustraciones de las secciones de producto.
 *
 * Están dibujadas con CSS en lugar de ser capturas o imágenes de relleno: pesan
 * casi nada, se ven nítidas en cualquier pantalla y se adaptan a los colores de
 * la marca sin volver a exportar nada.
 */

function Marco({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden baldosa shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] ${className}`}
    >
      {children}
    </div>
  )
}

export function VisualEditor() {
  return (
    <Marco className="p-5">
      <div className="flex gap-4">
        <div className="flex w-28 flex-col gap-2">
          {[
            { nombre: 'Portada', tono: 'bg-sitio-azul' },
            { nombre: 'Grilla', tono: 'bg-[#7c9df0]' },
            { nombre: 'Texto', tono: 'bg-[#a8bdf5]' },
          ].map((bloque, indice) => (
            <div
              key={bloque.nombre}
              className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${
                indice === 1
                  ? 'border-white/40 bg-white/[0.07] shadow-[0_10px_24px_-8px_rgba(59,96,255,0.55)]'
                  : 'border-sitio-borde'
              }`}
            >
              <span className={`h-4 w-4 rounded ${bloque.tono}`} />
              <span className="text-[11px] text-sitio-suave">{bloque.nombre}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-2 rounded-xl bg-sitio-crema p-3">
          <div className="h-14 rounded-lg bg-gradient-to-br from-sitio-azul to-sitio-profundo" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((indice) => (
              <div key={indice} className="h-10 rounded bg-sitio-superficie-2" />
            ))}
          </div>
          <div className="h-6 rounded bg-sitio-superficie-2" />
        </div>
      </div>
    </Marco>
  )
}

export function VisualProductos() {
  const productos = [
    { nombre: 'Sombrero llanero', precio: '$ 89.000', stock: 12 },
    { nombre: 'Cotizas artesanales', precio: '$ 45.900', stock: 30 },
    { nombre: 'Ruana de lana', precio: '$ 132.000', stock: 4 },
  ]

  return (
    <Marco>
      <div className="flex items-center justify-between border-b border-sitio-borde px-5 py-3">
        <span className="text-sm font-medium text-sitio-tinta">Productos</span>
        <span className="rounded-md bg-sitio-azul px-2.5 py-1 text-[11px] font-medium text-white">
          Nuevo
        </span>
      </div>

      <div className="divide-y divide-sitio-borde">
        {productos.map((producto) => (
          <div key={producto.nombre} className="flex items-center gap-3 px-5 py-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-sitio-crema" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-sitio-tinta">{producto.nombre}</p>
              <p className="text-xs text-sitio-tenue">{producto.precio}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                producto.stock < 5
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {producto.stock} en stock
            </span>
          </div>
        ))}
      </div>
    </Marco>
  )
}

export function VisualDominio() {
  return (
    <Marco className="p-5">
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-sitio-borde bg-sitio-crema px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="flex-1 text-sm text-sitio-tinta">tunegocio.llanostudio.co</span>
          <span className="text-[11px] text-sitio-tenue">Incluido</span>
        </div>

        <div className="flex justify-center">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-sitio-borde-fuerte">
            <path
              d="M12 4v16m0 0l-5-5m5 5l5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="flex items-center gap-3 rounded-xl border-2 border-sitio-azul bg-sitio-superficie px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-sitio-azul" />
          <span className="flex-1 text-sm font-medium text-sitio-tinta">www.tunegocio.com</span>
          <span className="rounded-full bg-sitio-azul/10 px-2 py-0.5 text-[11px] font-medium text-sitio-azul-claro">
            Tu dominio
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          {['#2563eb', '#0f2159', '#b45309', '#0f766e'].map((color) => (
            <span
              key={color}
              className="h-7 w-7 rounded-full border border-white ring-1 ring-sitio-borde"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="ml-1 self-center text-xs text-sitio-tenue">Tema de tu marca</span>
        </div>
      </div>
    </Marco>
  )
}

export function VisualPagos() {
  return (
    <Marco className="p-5">
      <div className="space-y-2.5">
        {['Wompi', 'PSE', 'Tarjeta de crédito'].map((medio, indice) => (
          <div
            key={medio}
            className="flex items-center gap-3 rounded-xl border border-sitio-borde px-4 py-3"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-lg font-display text-xs font-bold text-white"
              style={{ backgroundColor: ['#2563eb', '#0f2159', '#7c9df0'][indice] }}
            >
              {medio.slice(0, 1)}
            </span>
            <span className="flex-1 text-sm text-sitio-tinta">{medio}</span>
            <span className="h-4 w-4 rounded-full border-2 border-sitio-borde-fuerte" />
          </div>
        ))}

        <div className="mt-4 flex items-center justify-between rounded-xl bg-sitio-crema px-4 py-3">
          <span className="text-sm text-sitio-suave">Total del pedido</span>
          <span className="text-lg font-medium text-sitio-tinta">$ 134.900</span>
        </div>
      </div>
    </Marco>
  )
}
