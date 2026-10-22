'use client'

import type { EstiloSeccion } from '@/tipos/bloques'
import type { EsquemaColor } from '@/tipos/tienda'
import { cn } from '@/utilidades/clases'
import { generarSlug } from '@/utilidades/formato'
import { nivelIncluye, planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { Campo, CampoColor, Candado, Interruptor, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'

interface Props {
  estilo: EstiloSeccion
  alCambiar: (estilo: EstiloSeccion) => void
  limites: LimitesPlan
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  esquemas: EsquemaColor[]
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-sitio-suave">{titulo}</span>
      {children}
    </div>
  )
}

/**
 * Apariencia de la sección: lo mismo para todos los tipos. Cada nivel del plan
 * abre un grupo más; lo que no está incluido se ve con su candado.
 */
export function CamposEstilo({ estilo, alCambiar, limites, alError, alSubiendo, esquemas }: Props) {
  const nivel = limites.estiloSeccion
  const cambiar = (cambios: Partial<EstiloSeccion>) => alCambiar({ ...estilo, ...cambios })

  if (nivel === 'ninguno') {
    return (
      <Candado plan={planMinimo((plan) => plan.estiloSeccion !== 'ninguno')}>
        Fondo, colores, espaciado, animaciones y más para cada sección.
      </Candado>
    )
  }

  return (
    <>
      <Grupo titulo="Esquema de color">
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => cambiar({ esquema: undefined })}
            title="El del tema"
            className={cn(
              'grid h-10 place-items-center rounded-lg border text-[10px] text-sitio-tenue transition-colors',
              !estilo.esquema ? 'border-white/60' : 'border-sitio-borde hover:border-white/25',
            )}
          >
            Tema
          </button>
          {esquemas.map((esquema) => (
            <button
              key={esquema.id}
              type="button"
              title={esquema.nombre}
              onClick={() => cambiar({ esquema: esquema.id })}
              className={cn(
                'relative grid h-10 place-items-center rounded-lg border text-[12px] font-semibold transition-colors',
                estilo.esquema === esquema.id ? 'border-white ring-2 ring-white/30' : 'border-white/10 hover:border-white/30',
              )}
              style={{ background: esquema.fondo, color: esquema.texto }}
            >
              Aa
              <span className="absolute right-1 bottom-1 h-2 w-2 rounded-full" style={{ background: esquema.marca }} />
            </button>
          ))}
        </div>
      </Grupo>

      <Interruptor
        activo={Boolean(estilo.fondo)}
        alCambiar={(activo) => cambiar({ fondo: activo ? '#f4f4f5' : undefined })}
      >
        Fondo de color propio
      </Interruptor>
      {estilo.fondo && <CampoColor etiqueta="Color de fondo" valor={estilo.fondo} alCambiar={(fondo) => cambiar({ fondo })} />}

      <Interruptor
        activo={Boolean(estilo.texto)}
        alCambiar={(activo) => cambiar({ texto: activo ? '#111111' : undefined })}
      >
        Color de texto propio
      </Interruptor>
      {estilo.texto && <CampoColor etiqueta="Color del texto" valor={estilo.texto} alCambiar={(texto) => cambiar({ texto })} />}

      <Grupo titulo="Espacio arriba y abajo">
        <Segmentado
          opciones={[
            { valor: 'ninguno', etiqueta: 'Nada' },
            { valor: 'compacto', etiqueta: 'Poco' },
            { valor: 'normal', etiqueta: 'Normal' },
            { valor: 'amplio', etiqueta: 'Mucho' },
          ]}
          valor={estilo.espaciado ?? 'normal'}
          alCambiar={(espaciado) => cambiar({ espaciado })}
          chico
        />
      </Grupo>

      <Campo
        etiqueta="Nombre para enlazar desde el menú"
        valor={estilo.ancla ?? ''}
        alCambiar={(ancla) => cambiar({ ancla: generarSlug(ancla) || undefined })}
        prefijo="#"
        marcador="ofertas"
        ayuda={estilo.ancla ? `Enlaza a esta sección con #${estilo.ancla}` : 'Úsalo como enlace en “Cabecera y menú”.'}
      />

      {nivelIncluye(nivel, 'avanzado') ? (
        <>
          <Grupo titulo="Ancho">
              <Segmentado
                opciones={[
                  { valor: 'estrecho', etiqueta: 'Angosto' },
                  { valor: 'normal', etiqueta: 'Normal' },
                  { valor: 'amplio', etiqueta: 'Ancho' },
                ]}
                valor={estilo.ancho ?? 'normal'}
                alCambiar={(ancho) => cambiar({ ancho })}
                chico
              />
            </Grupo>
          <Grupo titulo="Forma">
              <Segmentado
                opciones={[
                  { valor: 'normal', etiqueta: 'Normal' },
                  { valor: 'tarjeta', etiqueta: 'Tarjeta', titulo: 'Flota con márgenes y esquinas redondeadas' },
                ]}
                valor={estilo.forma ?? 'normal'}
                alCambiar={(forma) => cambiar({ forma })}
                chico
              />
            </Grupo>
          <Grupo titulo="Animación al aparecer">
            <Segmentado
              opciones={[
                { valor: 'ninguna', etiqueta: 'No' },
                { valor: 'aparecer', etiqueta: 'Suave' },
                { valor: 'deslizar', etiqueta: 'Subir' },
                { valor: 'zoom', etiqueta: 'Zoom' },
                { valor: 'desenfoque', etiqueta: 'Enfocar' },
              ]}
              valor={estilo.animacion ?? 'ninguna'}
              alCambiar={(animacion) => cambiar({ animacion })}
              chico
            />
          </Grupo>
          <Grupo titulo="Se ve en">
            <Segmentado
              opciones={[
                { valor: 'todos', etiqueta: 'Todos' },
                { valor: 'movil', etiqueta: 'Sólo celular' },
                { valor: 'escritorio', etiqueta: 'Sólo computador' },
              ]}
              valor={estilo.dispositivos ?? 'todos'}
              alCambiar={(dispositivos) => cambiar({ dispositivos })}
              chico
            />
          </Grupo>
        </>
      ) : (
        <Candado plan={planMinimo((plan) => nivelIncluye(plan.estiloSeccion, 'avanzado'))}>
          Ancho, forma de tarjeta, animaciones al aparecer y mostrar sólo en celular o computador.
        </Candado>
      )}

      {nivelIncluye(nivel, 'completo') ? (
        <>
          <span className="text-[11.5px] text-sitio-suave">Imagen de fondo</span>
          <ZonaImagen
            url={estilo.imagenFondo}
            alCambiar={(imagenFondo) => cambiar({ imagenFondo: imagenFondo ?? undefined })}
            proporcion="aspect-[21/9]"
            texto="Arrastra una imagen de fondo"
            alError={alError}
            alSubiendo={alSubiendo}
          />
          {estilo.imagenFondo && (
            <Grupo titulo={`Oscurecer la imagen: ${estilo.oscurecer ?? 40}%`}>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={estilo.oscurecer ?? 40}
                onChange={(evento) => cambiar({ oscurecer: Number(evento.target.value) })}
                className="w-full accent-white"
              />
            </Grupo>
          )}
        </>
      ) : (
        <Candado plan={planMinimo((plan) => nivelIncluye(plan.estiloSeccion, 'completo'))}>
          Imagen de fondo en cualquier sección, con oscurecido para que el texto se lea.
        </Candado>
      )}
    </>
  )
}
