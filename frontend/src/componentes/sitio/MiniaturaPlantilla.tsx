import type { PlantillaTienda } from '@/utilidades/plantillas'

/**
 * La tienda de una plantilla, esquematizada con sus colores reales: pesa nada
 * y siempre coincide con lo que se aplica. La usan el sitio y el editor.
 */
export function MiniaturaPlantilla({ plantilla, chica = false }: { plantilla: PlantillaTienda; chica?: boolean }) {
  const { tema } = plantilla
  const tipos = plantilla.bloques('').map((bloque) => bloque.tipo)

  return (
    <div
      className="space-y-1.5 overflow-hidden rounded-md p-2 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]"
      style={{ background: tema.colorFondo, borderRadius: chica ? 6 : undefined }}
    >
      {tipos.includes('anuncio') && <div className="h-1.5 rounded-sm" style={{ background: tema.colorMarca }} />}
      <div
        className={chica ? 'rounded-sm p-2' : 'rounded p-3'}
        style={{ background: `color-mix(in srgb, ${tema.colorTexto} 6%, transparent)` }}
      >
        <div className={`rounded-full opacity-80 ${chica ? 'h-1.5 w-12' : 'h-2 w-20'}`} style={{ background: tema.colorTexto }} />
        <div className={`mt-1.5 rounded-full opacity-40 ${chica ? 'h-1 w-16' : 'h-1.5 w-28'}`} style={{ background: tema.colorTexto }} />
        <div
          className={`mt-2 ${chica ? 'h-2.5 w-8' : 'h-4 w-14'}`}
          style={{ background: tema.colorMarca, borderRadius: tema.radio }}
        />
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${plantilla.columnas}, minmax(0, 1fr))` }}>
        {Array.from({ length: plantilla.columnas }, (_, celda) => (
          <div
            key={celda}
            className={chica ? 'h-4' : 'h-9'}
            style={{ background: `color-mix(in srgb, ${tema.colorTexto} 10%, transparent)`, borderRadius: tema.radio }}
          />
        ))}
      </div>
      {tipos.includes('imagen-texto') && (
        <div className="grid grid-cols-2 gap-1">
          <div className={chica ? 'h-4' : 'h-8'} style={{ background: `color-mix(in srgb, ${tema.colorTexto} 10%, transparent)`, borderRadius: tema.radio }} />
          <div className="space-y-1 pt-1">
            <div className="h-1 w-3/4 rounded-full opacity-60" style={{ background: tema.colorTexto }} />
            <div className="h-1 w-1/2 rounded-full opacity-30" style={{ background: tema.colorTexto }} />
          </div>
        </div>
      )}
    </div>
  )
}
